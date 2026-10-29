from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from news.models import Category, Technology, Source, Article, ArticleIntelligence
from security.models import SecurityAdvisory
from intelligence.pipeline import IntelligencePipeline, ArticleIntelligenceSchema


class IntelligencePipelineTests(TestCase):
    def test_heuristic_analysis_produces_valid_schema(self):
        title = "React 19 Released with Server Actions and Compiler"
        content = "The React team has officially released React 19. Features include React Compiler, Server Actions, and asset loading improvements."
        intel = IntelligencePipeline.process_article(title, content, "React Official Blog", "programming-frameworks")

        self.assertIsInstance(intel, ArticleIntelligenceSchema)
        self.assertIn("React", intel.detected_technologies)
        self.assertGreaterEqual(intel.importance_score, 50)
        self.assertTrue(len(intel.positive_implications) > 0)
        self.assertTrue(len(intel.recommended_actions) > 0)

    def test_security_cve_detection_and_high_score(self):
        title = "Critical Security Vulnerability CVE-2025-1234 in Package"
        content = "A remote code execution vulnerability has been reported in popular dependency. Apply patches immediately."
        intel = IntelligencePipeline.process_article(title, content, "GitHub Security Advisory", "cybersecurity")

        self.assertEqual(intel.event_type, "security_vulnerability")
        self.assertGreaterEqual(intel.importance_score, 80)


class NewsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="AI & Machine Learning", slug="ai-machine-learning")
        self.tech = Technology.objects.create(name="OpenAI", slug="openai", category=self.category)
        self.source = Source.objects.create(
            name="OpenAI News",
            slug="openai-news",
            url="https://openai.com/news/rss.xml",
            reliability_tier="authoritative"
        )
        self.article = Article.objects.create(
            title="New AI Model Breakthrough Announced",
            source=self.source,
            canonical_url="https://openai.com/news/breakthrough",
            published_at=timezone.now(),
            category=self.category,
            importance_score=90,
            is_breaking=True
        )
        self.article.technologies.add(self.tech)
        self.intelligence = ArticleIntelligence.objects.create(
            article=self.article,
            concise_summary="OpenAI announces new breakthrough model with high reasoning performance.",
            detailed_summary="Full synthesis of the architectural benchmark.",
            what_happened="Model released.",
            why_it_matters="Advances automated software development.",
            developer_impact="Integrate through API.",
            positive_implications=["Improved latency"],
            negative_implications=["Cost per token"],
            risks_and_limitations=["Benchmark validation"],
            recommended_actions=["Evaluate on test harness"],
        )

    def test_articles_list_endpoint(self):
        url = reverse('api-v1:article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], self.article.title)

    def test_article_detail_endpoint(self):
        url = reverse('api-v1:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], self.article.slug)
        self.assertIn('intelligence', response.data)
        self.assertEqual(response.data['intelligence']['concise_summary'], self.intelligence.concise_summary)

    def test_for_you_feed_endpoint(self):
        url = reverse('api-v1:for-you-feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_health_check_endpoint(self):
        url = reverse('api-v1:health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertIn('metrics', response.data)


class UserBookmarksTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testdev", password="password123#")
        self.source = Source.objects.create(name="Dev Source", slug="dev-source", url="https://dev.to")
        self.article = Article.objects.create(
            title="Essential Dev Tips",
            source=self.source,
            canonical_url="https://dev.to/essential-tips",
            published_at=timezone.now()
        )

    def test_bookmark_lifecycle(self):
        self.client.force_authenticate(user=self.user)
        # Create bookmark
        response = self.client.post(reverse('api-v1:bookmark-list'), {'article_id': self.article.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # List bookmarks
        list_resp = self.client.get(reverse('api-v1:bookmark-list'))
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data['results']), 1)

        # Delete bookmark
        del_resp = self.client.delete(reverse('api-v1:bookmark-delete', kwargs={'article_id': self.article.id}))
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)

        # Verify deletion
        list_resp2 = self.client.get(reverse('api-v1:bookmark-list'))
        self.assertEqual(len(list_resp2.data['results']), 0)


class SecurityAndIngestionDefensesTests(TestCase):
    def test_ssrf_validation_blocks_internal_and_cloud_metadata(self):
        from core.security import validate_safe_url

        # Test localhost and loopback
        safe, reason = validate_safe_url("http://127.0.0.1/feed")
        self.assertFalse(safe)

        safe, reason = validate_safe_url("http://localhost:8000/feed")
        self.assertFalse(safe)

        # Test AWS / GCP cloud metadata
        safe, reason = validate_safe_url("http://169.254.169.254/latest/meta-data/")
        self.assertFalse(safe)

        # Test RFC1918 private network
        safe, reason = validate_safe_url("http://192.168.1.10/admin")
        self.assertFalse(safe)

        safe, reason = validate_safe_url("http://10.0.0.5/api")
        self.assertFalse(safe)

        # Test invalid protocols
        safe, reason = validate_safe_url("ftp://internal.server/file")
        self.assertFalse(safe)

        safe, reason = validate_safe_url("file:///etc/passwd")
        self.assertFalse(safe)

        # Test legitimate external HTTPS endpoints
        safe, reason = validate_safe_url("https://blog.rust-lang.org/feed.xml")
        self.assertTrue(safe)

    def test_url_normalization_strips_tracking_params(self):
        from ingestion.engine import normalize_url

        raw_url = "https://react.dev/blog/react-19?utm_source=twitter&utm_medium=social&utm_campaign=launch&ref=hackernews"
        cleaned = normalize_url(raw_url)
        self.assertEqual(cleaned, "https://react.dev/blog/react-19")


class GlobalSearchAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Languages", slug="languages")
        self.tech = Technology.objects.create(name="TypeScript", slug="typescript", category=self.category)
        self.source = Source.objects.create(name="TS Blog", slug="ts-blog", url="https://devblogs.microsoft.com/typescript")
        self.article = Article.objects.create(
            title="Announcing TypeScript 5.8 Beta",
            source=self.source,
            canonical_url="https://devblogs.microsoft.com/typescript/5-8-beta",
            published_at=timezone.now(),
            importance_score=85,
        )
        self.article.technologies.add(self.tech)

    def test_global_search_returns_multi_index_results(self):
        url = reverse('api-v1:global-search')
        response = self.client.get(f"{url}?q=TypeScript")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('articles', response.data)
        self.assertIn('technologies', response.data)
        self.assertGreaterEqual(len(response.data['articles']), 1)
        self.assertEqual(response.data['articles'][0]['title'], self.article.title)
        self.assertEqual(response.data['technologies'][0]['name'], 'TypeScript')

