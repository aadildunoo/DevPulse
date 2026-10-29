from django.db import models
from django.utils.text import slugify
import hashlib

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon identifier")
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Technology(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='technologies')
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    doc_url = models.URLField(blank=True)
    github_repo = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_trending = models.BooleanField(default=False)
    follower_count = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Technologies"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Source(models.Model):
    SOURCE_TYPES = [
        ('rss', 'RSS Feed'),
        ('atom', 'Atom Feed'),
        ('github_releases', 'GitHub Releases API/Feed'),
        ('security_advisory', 'Official Security Advisory'),
        ('official_blog', 'Official Engineering Blog'),
    ]
    RELIABILITY_TIERS = [
        ('authoritative', 'Authoritative (Official Docs/Releases/Vendors)'),
        ('verified', 'Verified Independent (Reputable Labs/Audits)'),
        ('community', 'Community Curated'),
    ]

    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True)
    source_type = models.CharField(max_length=30, choices=SOURCE_TYPES, default='rss')
    url = models.URLField(max_length=500, help_text="Feed or endpoint URL")
    site_url = models.URLField(max_length=500, blank=True)
    reliability_tier = models.CharField(max_length=30, choices=RELIABILITY_TIERS, default='authoritative')
    is_active = models.BooleanField(default=True)
    poll_interval_minutes = models.IntegerField(default=60)
    last_polled_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.IntegerField(default=0)
    etag = models.CharField(max_length=255, blank=True)
    last_modified = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_reliability_tier_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Article(models.Model):
    EVENT_TYPES = [
        ('release', 'Software / Model Release'),
        ('breaking_change', 'Breaking Changes & Deprecations'),
        ('security_vulnerability', 'Security Vulnerability & Advisory'),
        ('research_paper', 'Engineering & AI Research'),
        ('ai_model', 'AI Model & Capability'),
        ('developer_tools', 'Developer Tools & Open Source'),
        ('outage', 'Cloud Outage & Service Reliability'),
        ('industry_news', 'Industry & Ecosystem Development'),
        ('tech_layoffs', 'Tech Layoffs & Employment Restructuring'),
        ('market_movement', 'Stock Market & Earnings Movement'),
        ('funding_round', 'Startup Venture & Funding Round'),
        ('acquisition', 'Big Tech M&A and Strategic Acquisition'),
        ('regulatory_policy', 'Antitrust & Technology Policy'),
    ]

    ARTICLE_TYPES = [
        ('standard_news', 'Standard Technology News'),
        ('breaking_news', 'Breaking News'),
        ('major_development', 'Major Industry Development'),
        ('company_analysis', 'Technology Company Analysis'),
        ('technical_explainer', 'In-Depth Technical Explainer'),
        ('market_report', 'Technology Market Report'),
    ]

    EDITORIAL_STATUSES = [
        ('ingested', 'Ingested'),
        ('awaiting_enrichment', 'Awaiting Enrichment'),
        ('enriched', 'Enriched'),
        ('published', 'Published'),
        ('needs_correction', 'Needs Correction'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=350)
    subheadline = models.CharField(max_length=500, blank=True, help_text="One or two sentences explaining central development")
    slug = models.SlugField(max_length=380, unique=True, db_index=True)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='articles')
    canonical_url = models.URLField(max_length=800, unique=True, db_index=True)
    original_url = models.URLField(max_length=800, blank=True)
    author = models.CharField(max_length=200, blank=True)
    editorial_desk = models.CharField(max_length=100, default='Technology Newsdesk', help_text="Publishing desk e.g. AI & ML Desk, Tech Markets Desk")
    article_type = models.CharField(max_length=40, choices=ARTICLE_TYPES, default='standard_news')
    
    summary_raw = models.TextField(blank=True)
    content_raw = models.TextField(blank=True)
    body_paragraphs = models.JSONField(default=list, blank=True, help_text="List of substantive article paragraphs")
    background_context = models.TextField(blank=True, help_text="Historical circumstances and prior developments")
    why_it_matters_text = models.TextField(blank=True, help_text="Significance for developers, companies, and investors")
    implications_analysis = models.TextField(blank=True, help_text="Technical, business, or financial implications")
    what_happens_next = models.TextField(blank=True, help_text="Upcoming milestones, timelines, dates to watch")
    sources_and_references = models.JSONField(default=list, blank=True, help_text="Attributed sources with links and titles")
    
    primary_companies = models.JSONField(default=list, blank=True, help_text="List of covered company names")
    stock_symbols = models.JSONField(default=list, blank=True, help_text="List of ticker symbols e.g. NVDA, MSFT")
    
    lead_image_url = models.URLField(max_length=800, blank=True)
    lead_image_caption = models.CharField(max_length=300, blank=True)
    lead_image_credit = models.CharField(max_length=150, blank=True)
    
    editorial_status = models.CharField(max_length=30, choices=EDITORIAL_STATUSES, default='published', db_index=True)
    ai_generation_status = models.CharField(max_length=50, default='heuristic_enriched')
    verification_status = models.CharField(max_length=50, default='verified_source')
    content_hash = models.CharField(max_length=64, db_index=True, blank=True)
    published_at = models.DateTimeField(db_index=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    ingested_at = models.DateTimeField(auto_now_add=True, db_index=True)

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles')
    categories = models.ManyToManyField(Category, blank=True, related_name='articles_multi')
    technologies = models.ManyToManyField(Technology, blank=True, related_name='articles')
    primary_event_type = models.CharField(max_length=40, choices=EVENT_TYPES, default='developer_tools')

    importance_score = models.IntegerField(default=50, db_index=True, help_text="Ranking 1-100 based on developer impact")
    importance_explanation = models.TextField(blank=True)

    is_breaking = models.BooleanField(default=False, db_index=True)
    is_developing = models.BooleanField(default=False)
    is_editorial_pick = models.BooleanField(default=False, db_index=True)
    is_reviewed = models.BooleanField(default=False)

    read_time_minutes = models.IntegerField(default=3)
    view_count = models.IntegerField(default=0)
    bookmark_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['-importance_score', '-published_at']),
            models.Index(fields=['category', '-published_at']),
            models.Index(fields=['article_type', '-published_at']),
            models.Index(fields=['editorial_status', '-published_at']),
        ]

    def __str__(self):
        return self.title

    def compute_content_hash(self):
        normalized = (self.title + (self.content_raw or self.summary_raw)).strip().lower().encode('utf-8')
        return hashlib.sha256(normalized).hexdigest()

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:300]
            candidate = base_slug
            idx = 1
            while Article.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{idx}"
                idx += 1
            self.slug = candidate
        if not self.content_hash:
            self.content_hash = self.compute_content_hash()
        super().save(*args, **kwargs)


class ArticleIntelligence(models.Model):
    """
    Validated structured AI and editorial intelligence pipeline output.
    Contains granular, actionable developer breakdown.
    """
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name='intelligence')
    concise_summary = models.TextField(help_text="1-2 sentences high signal TL;DR")
    detailed_summary = models.TextField(help_text="Detailed objective summary")
    what_happened = models.TextField(help_text="Objective facts of what occurred")
    why_it_matters = models.TextField(help_text="Practical industry significance")
    developer_impact = models.TextField(help_text="Direct ramifications on daily development")
    positive_implications = models.JSONField(default=list, blank=True)
    negative_implications = models.JSONField(default=list, blank=True)
    risks_and_limitations = models.JSONField(default=list, blank=True)
    recommended_actions = models.JSONField(default=list, blank=True)
    affected_versions = models.CharField(max_length=255, blank=True)
    who_is_affected = models.TextField(blank=True)
    supporting_evidence = models.JSONField(default=list, blank=True)
    uncertainty_notes = models.TextField(blank=True, help_text="Limitations, unverified claims, or missing data")
    provider = models.CharField(max_length=50, default='heuristic-engine-v1')
    schema_version = models.CharField(max_length=20, default='1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Intelligence for: {self.article.title[:60]}"


class ArticleCorrection(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='corrections')
    original_claim = models.TextField()
    correction_text = models.TextField()
    corrected_at = models.DateTimeField(auto_now_add=True)
    editor_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-corrected_at']

    def __str__(self):
        return f"Correction for {self.article.title[:50]} at {self.corrected_at:%Y-%m-%d}"


class DailyBriefing(models.Model):
    date = models.DateField(unique=True, db_index=True)
    title = models.CharField(max_length=250)
    overview = models.TextField()
    top_stories = models.ManyToManyField(Article, related_name='briefings')
    reading_time_minutes = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"DevPulse Daily Briefing - {self.date}"


class IngestionJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped (Unmodified)'),
    ]

    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    items_found = models.IntegerField(default=0)
    items_created = models.IntegerField(default=0)
    items_updated = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Job for {self.source.name} [{self.status}] at {self.started_at:%Y-%m-%d %H:%M}"
