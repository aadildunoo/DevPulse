"""
DevPulse News Ingestion Engine.
Modular source adapters, deduplication, retry policy, health tracking, and pipeline execution.
"""

import logging
import hashlib
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urlunparse

import httpx
import feedparser
from dateutil import parser as date_parser
from django.utils import timezone
from django.db import transaction

from news.models import Source, Article, ArticleIntelligence, Category, Technology, IngestionJob
from security.models import SecurityAdvisory
from intelligence.pipeline import IntelligencePipeline
from core.security import validate_safe_url, sanitize_external_text

logger = logging.getLogger(__name__)


def normalize_url(url: str) -> str:
    """Strip tracking query parameters like utm_source, utm_medium, ref, etc."""
    parsed = urlparse(url)
    # Remove fragments and standard tracking params
    query_parts = []
    if parsed.query:
        for q in parsed.query.split('&'):
            key = q.split('=')[0].lower()
            if key not in ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref']:
                query_parts.append(q)
    clean_query = '&'.join(query_parts)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, clean_query, ''))


class IngestionEngine:
    """
    Coordinates polling of sources, parsing, deduplication, and intelligence pipeline invocation.
    Includes SSRF defense, exponential backoff, and multi-category tagging.
    """

    @classmethod
    def poll_source(cls, source: Source, force: bool = False) -> IngestionJob:
        # Check exponential backoff if consecutive failures occurred
        if not force and source.consecutive_failures > 0 and source.last_polled_at:
            backoff_minutes = min(source.poll_interval_minutes * (2 ** min(source.consecutive_failures - 1, 6)), 1440)
            next_allowed = source.last_polled_at + timedelta(minutes=backoff_minutes)
            if timezone.now() < next_allowed:
                job = IngestionJob.objects.create(
                    source=source,
                    status='skipped',
                    error_message=f"Exponential backoff active ({source.consecutive_failures} failures). Next poll after {next_allowed:%Y-%m-%d %H:%M} UTC.",
                    completed_at=timezone.now()
                )
                return job

        job = IngestionJob.objects.create(source=source, status='running')

        # 1. SSRF URL Validation
        is_safe, reason = validate_safe_url(source.url)
        if not is_safe:
            source.last_polled_at = timezone.now()
            source.consecutive_failures += 1
            source.save(update_fields=['last_polled_at', 'consecutive_failures'])
            job.status = 'failed'
            job.error_message = f"Security block (SSRF): {reason}"
            job.completed_at = timezone.now()
            job.save()
            logger.error(f"SSRF attempt blocked for source {source.name} ({source.url}): {reason}")
            return job

        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 DevPulseBot/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/atom+xml;q=0.9,*/*;q=0.8'
        }
        if source.etag:
            headers['If-None-Match'] = source.etag
        if source.last_modified:
            headers['If-Modified-Since'] = source.last_modified

        try:
            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                response = client.get(source.url, headers=headers)

            if response.status_code == 304:
                source.last_polled_at = timezone.now()
                source.save(update_fields=['last_polled_at'])
                job.status = 'skipped'
                job.completed_at = timezone.now()
                job.save()
                return job

            response.raise_for_status()

            # Save etag and last_modified if provided
            if 'etag' in response.headers:
                source.etag = response.headers['etag']
            if 'last-modified' in response.headers:
                source.last_modified = response.headers['last-modified']

            if source.source_type == 'security_advisory' and response.headers.get('content-type', '').startswith('application/json'):
                data = response.json()
                items_found = len(data)
                items_created = 0
                items_updated = 0
                for item in data:
                    c, u = cls._process_github_advisory(item, source)
                    if c:
                        items_created += 1
                    elif u:
                        items_updated += 1
            else:
                content_text = response.text
                parsed_feed = feedparser.parse(content_text)
                items_found = len(parsed_feed.entries)
                items_created = 0
                items_updated = 0

                for entry in parsed_feed.entries:
                    created, updated = cls._process_entry(entry, source)
                    if created:
                        items_created += 1
                    elif updated:
                        items_updated += 1

            source.last_polled_at = timezone.now()
            source.last_success_at = timezone.now()
            source.consecutive_failures = 0
            source.save()

            job.status = 'success'
            job.items_found = items_found
            job.items_created = items_created
            job.items_updated = items_updated
            job.completed_at = timezone.now()
            job.save()

        except Exception as e:
            logger.error(f"Failed to ingest source {source.name}: {e}")
            source.last_polled_at = timezone.now()
            source.consecutive_failures += 1
            source.save()

            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()

        return job

    @classmethod
    def _process_entry(cls, entry: Any, source: Source) -> (bool, bool):
        title = entry.get('title', '').strip()
        link = entry.get('link', '') or entry.get('id', '')
        if not title or not link:
            return False, False

        canonical_url = normalize_url(link)

        # Parse publication time
        pub_date = None
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            try:
                pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            except Exception:
                pass
        if not pub_date and 'published' in entry:
            try:
                pub_date = date_parser.parse(entry.published)
                if timezone.is_naive(pub_date):
                    pub_date = timezone.make_aware(pub_date, timezone.utc)
            except Exception:
                pass
        if not pub_date:
            pub_date = timezone.now()

        summary_raw = entry.get('summary', '') or entry.get('description', '')
        content_raw = ""
        if 'content' in entry and isinstance(entry.content, list) and len(entry.content) > 0:
            content_raw = entry.content[0].get('value', '')
        if not content_raw:
            content_raw = summary_raw

        author = entry.get('author', '')

        # Check existing article by canonical_url
        existing = Article.objects.filter(canonical_url=canonical_url).first()
        if existing:
            # Check if updated
            return False, False

        with transaction.atomic():
            # Run Intelligence Pipeline
            intel_data = IntelligencePipeline.process_article(
                title=title,
                content=content_raw or summary_raw,
                source_name=source.name,
                category_slug=""
            )

            # Determine category
            category = None
            if intel_data.event_type == 'security_vulnerability':
                category = Category.objects.filter(slug='cybersecurity').first()
            elif intel_data.event_type == 'tech_layoffs':
                category = Category.objects.filter(slug='tech-layoffs').first()
            elif intel_data.event_type in ('market_movement', 'funding_round') or intel_data.stock_symbols:
                category = Category.objects.filter(slug='tech-markets').first()
            elif intel_data.event_type in ('ai_model', 'research_paper'):
                category = Category.objects.filter(slug='ai-machine-learning').first()
            elif any(t in ['React', 'Next.js', 'TypeScript', 'Python', 'Django', 'Rust', 'Go'] for t in intel_data.detected_technologies):
                category = Category.objects.filter(slug='programming-frameworks').first()

            if not category:
                category = Category.objects.filter(slug='developer-tools').first()

            article = Article.objects.create(
                title=title,
                subheadline=intel_data.subheadline,
                editorial_desk=intel_data.editorial_desk,
                article_type=intel_data.article_type,
                source=source,
                canonical_url=canonical_url,
                original_url=link,
                author=author or intel_data.editorial_desk,
                summary_raw=summary_raw,
                content_raw=content_raw,
                body_paragraphs=intel_data.body_paragraphs,
                background_context=intel_data.background_context,
                why_it_matters_text=intel_data.why_it_matters_text,
                implications_analysis=intel_data.implications_analysis,
                what_happens_next=intel_data.what_happens_next,
                sources_and_references=intel_data.sources_and_references,
                primary_companies=intel_data.primary_companies,
                stock_symbols=intel_data.stock_symbols,
                published_at=pub_date,
                category=category,
                primary_event_type=intel_data.event_type,
                importance_score=intel_data.importance_score,
                importance_explanation=intel_data.importance_explanation,
                is_breaking=intel_data.importance_score >= 85,
                read_time_minutes=max(2, len((content_raw or summary_raw).split()) // 200),
                editorial_status='published',
            )

            # Save Intelligence record
            ArticleIntelligence.objects.create(
                article=article,
                concise_summary=intel_data.concise_summary,
                detailed_summary=intel_data.detailed_summary,
                what_happened=intel_data.what_happened,
                why_it_matters=intel_data.why_it_matters,
                developer_impact=intel_data.developer_impact,
                positive_implications=intel_data.positive_implications,
                negative_implications=intel_data.negative_implications,
                risks_and_limitations=intel_data.risks_and_limitations,
                recommended_actions=intel_data.recommended_actions,
                affected_versions=intel_data.affected_versions,
                who_is_affected=intel_data.who_is_affected,
                supporting_evidence=intel_data.supporting_evidence,
                uncertainty_notes=intel_data.uncertainty_notes,
                provider='heuristic-engine-v1',
            )

            # Associate detected technologies
            for tech_name in intel_data.detected_technologies:
                tech_obj, _ = Technology.objects.get_or_create(
                    name=tech_name,
                    defaults={'description': f'{tech_name} ecosystem'}
                )
                article.technologies.add(tech_obj)

            # Associate detected categories (multi-category classification)
            for cat_slug in intel_data.detected_categories:
                cat_obj = Category.objects.filter(slug=cat_slug).first()
                if cat_obj:
                    article.categories.add(cat_obj)
            if category and not article.categories.filter(pk=category.pk).exists():
                article.categories.add(category)

            # If security advisory event, also create SecurityAdvisory entry
            if intel_data.event_type == 'security_vulnerability':
                cve_match = re.search(r'CVE-\d{4}-\d{4,7}', f"{title} {summary_raw}", re.IGNORECASE)
                cve_id = cve_match.group(0).upper() if cve_match else ""
                advisory_id = cve_id or f"ADV-{article.id}"
                if not SecurityAdvisory.objects.filter(advisory_id=advisory_id).exists():
                    SecurityAdvisory.objects.create(
                        advisory_id=advisory_id,
                        cve_id=cve_id or None,
                        title=title,
                        summary=intel_data.concise_summary,
                        details=intel_data.detailed_summary,
                        severity='critical' if intel_data.importance_score > 85 else 'high',
                        affected_product=intel_data.who_is_affected or "Software Dependency",
                        affected_versions=intel_data.affected_versions or "All unpatched versions",
                        patched_versions="See vendor release advisory",
                        remediation_guide="; ".join(intel_data.recommended_actions),
                        source_url=canonical_url,
                        article=article,
                        published_at=pub_date,
                    )

            return True, False

    @classmethod
    def _process_github_advisory(cls, item: Dict[str, Any], source: Source) -> (bool, bool):
        ghsa_id = item.get('ghsa_id', '')
        cve_id = item.get('cve_id') or ''
        title = item.get('summary', '') or f"Security Advisory {ghsa_id}"
        link = item.get('html_url') or item.get('url') or f"https://github.com/advisories/{ghsa_id}"
        canonical_url = normalize_url(link)

        if SecurityAdvisory.objects.filter(advisory_id=ghsa_id).exists():
            return False, False

        published_str = item.get('published_at')
        try:
            pub_date = date_parser.parse(published_str) if published_str else timezone.now()
        except Exception:
            pub_date = timezone.now()

        severity_raw = item.get('severity', 'medium').lower()
        if severity_raw not in ['critical', 'high', 'medium', 'low']:
            severity_raw = 'medium'

        description = item.get('description', '') or title
        vulnerabilities = item.get('vulnerabilities', [])
        affected_pkg = vulnerabilities[0].get('package', {}).get('name', '') if vulnerabilities else ""
        patched_ver = vulnerabilities[0].get('first_patched_version') if vulnerabilities else ""

        with transaction.atomic():
            # Process with intelligence pipeline
            intel_data = IntelligencePipeline.process_article(
                title=f"Security Alert: {title}",
                content=description,
                source_name=source.name,
                category_slug="cybersecurity"
            )

            category, _ = Category.objects.get_or_create(
                slug='cybersecurity',
                defaults={'name': 'Cybersecurity', 'description': 'Security advisories and CVE alerts'}
            )

            article = Article.objects.create(
                title=f"Security Alert: {title}",
                source=source,
                canonical_url=canonical_url,
                original_url=link,
                author='GitHub Security Lab',
                summary_raw=item.get('summary', ''),
                content_raw=description,
                published_at=pub_date,
                category=category,
                primary_event_type='security_vulnerability',
                importance_score=95 if severity_raw == 'critical' else (85 if severity_raw == 'high' else 70),
                importance_explanation=f"Authoritative security advisory {ghsa_id} ({cve_id or 'No CVE assigned'}). Severity: {severity_raw.upper()}.",
                is_breaking=severity_raw in ['critical', 'high'],
                read_time_minutes=3,
            )

            ArticleIntelligence.objects.create(
                article=article,
                concise_summary=intel_data.concise_summary,
                detailed_summary=intel_data.detailed_summary,
                what_happened=f"{title}. Vulnerability reported in {affected_pkg or 'software component'}.",
                why_it_matters=f"Identified as {severity_raw.upper()} severity. Developers utilizing {affected_pkg or 'this library'} should review dependencies immediately.",
                developer_impact=f"Potential vulnerability impact on unpatched instances. Remediation required if {affected_pkg or 'package'} is deployed in production.",
                positive_implications=["Official advisory published with disclosure and patch information"],
                negative_implications=[f"Exploitable condition in unpatched versions of {affected_pkg or 'dependency'}"],
                risks_and_limitations=["Supply chain and direct dependency vulnerability"],
                recommended_actions=[
                    f"Upgrade {affected_pkg} to {patched_ver}" if patched_ver else f"Review dependency tree for {affected_pkg}",
                    "Audit CI/CD pipeline dependency lockfiles",
                ],
                affected_versions=intel_data.affected_versions or "See advisory details",
                who_is_affected=f"Users of {affected_pkg or 'the affected software'}",
                supporting_evidence=[f"GitHub Advisory {ghsa_id}", cve_id or ""],
                provider='heuristic-engine-v1',
            )

            SecurityAdvisory.objects.create(
                advisory_id=ghsa_id,
                cve_id=cve_id or None,
                title=title,
                summary=intel_data.concise_summary,
                details=description,
                severity=severity_raw,
                affected_product=affected_pkg or "Software component",
                affected_versions=intel_data.affected_versions or "All unpatched",
                patched_versions=str(patched_ver) if patched_ver else "Review advisory",
                remediation_guide=f"Upgrade to {patched_ver}" if patched_ver else "Follow vendor instructions",
                references=[ref.get('url', '') for ref in item.get('references', []) if isinstance(ref, dict)],
                source_url=canonical_url,
                article=article,
                published_at=pub_date,
            )

            # Associate categories
            for cat_slug in intel_data.detected_categories:
                cat_obj = Category.objects.filter(slug=cat_slug).first()
                if cat_obj:
                    article.categories.add(cat_obj)
            article.categories.add(category)

            return True, False

    @classmethod
    def poll_all_active_sources(cls) -> List[IngestionJob]:
        active_sources = Source.objects.filter(is_active=True)
        jobs = []
        for src in active_sources:
            job = cls.poll_source(src)
            jobs.append(job)
        return jobs
