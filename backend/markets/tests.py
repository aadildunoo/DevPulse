from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from markets.models import Company, MarketIndex, StockQuote, FinancialResult, WatchlistItem
from markets.services import MarketDataService, MarketHoursHelper
from news.models import Article, Category, Source


class MarketDataServiceTests(TestCase):
    def setUp(self):
        MarketDataService.initialize_market_universe(force=True)

    def test_market_universe_seeding(self):
        self.assertGreaterEqual(Company.objects.count(), 10)
        self.assertGreaterEqual(StockQuote.objects.count(), 10)
        self.assertGreaterEqual(MarketIndex.objects.count(), 4)
        self.assertGreaterEqual(FinancialResult.objects.count(), 4)

    def test_market_hours_helper(self):
        session = MarketHoursHelper.get_current_session_info()
        self.assertIn('status', session)
        self.assertIn('is_open', session)
        self.assertIn('is_delayed', session)
        self.assertTrue(session['is_delayed'])

    def test_market_overview_service(self):
        overview = MarketDataService.get_market_overview()
        self.assertIn('session', overview)
        self.assertIn('indices', overview)
        self.assertIn('gainers', overview)
        self.assertIn('losers', overview)
        self.assertIn('mega_caps', overview)
        self.assertGreaterEqual(len(overview['indices']), 4)


class MarketAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        MarketDataService.initialize_market_universe(force=True)
        self.user = User.objects.create_user(username='market_trader', password='securepassword123#')

    def test_market_overview_endpoint(self):
        url = reverse('api-v1:markets:market-overview')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('session', response.data)
        self.assertIn('indices', response.data)
        self.assertGreaterEqual(len(response.data['indices']), 4)

    def test_stocks_list_endpoint(self):
        url = reverse('api-v1:markets:stock-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 10)

    def test_stock_detail_endpoint(self):
        url = reverse('api-v1:markets:stock-detail', kwargs={'ticker': 'NVDA'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company']['ticker'], 'NVDA')
        self.assertIn('financials', response.data)
        self.assertIn('quote', response.data)

    def test_market_movers_endpoint(self):
        url = reverse('api-v1:markets:market-movers')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('gainers', response.data)
        self.assertIn('losers', response.data)

    def test_watchlist_workflow(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('api-v1:markets:market-watchlist')

        # Add NVDA
        post_res = self.client.post(url, {'ticker': 'NVDA'}, format='json')
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)

        # Get watchlist
        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data['items']), 1)
        self.assertEqual(get_res.data['items'][0]['company']['ticker'], 'NVDA')

        # Delete NVDA
        del_res = self.client.delete(f"{url}?ticker=NVDA")
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertTrue(del_res.data['deleted'])


class NewspaperArticleTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Tech Markets', slug='tech-markets')
        self.source = Source.objects.create(name='DevPulse Financial', slug='devpulse-financial', url='https://devpulse.news/feed')
        self.article = Article.objects.create(
            title='NVIDIA Crosses New Valuation Milestone on AI Infrastructure Capex',
            subheadline='Hyperscaler cloud allocations reinforce sustained momentum across semiconductor supply chains.',
            slug='nvidia-valuation-milestone',
            source=self.source,
            canonical_url='https://devpulse.news/nvidia-milestone',
            published_at='2026-10-29T10:00:00Z',
            category=self.category,
            editorial_desk='Technology Markets & Finance Desk',
            article_type='market_report',
            body_paragraphs=[
                'NVIDIA Corporation has achieved a new market capitalization milestone following quarterly hyperscaler disclosures.',
                'Cloud providers including Microsoft, Meta, and Alphabet increased infrastructure investments by over 40% year-over-year.',
                'The broader semiconductor index reacted favorably, driven by sustained high-bandwidth memory allocations.',
            ],
            background_context='Prior to the current cycle, data center revenues represented under 30% of total revenue.',
            why_it_matters_text='Reflects the ongoing shift toward AI-centric compute and specialized accelerator hardware.',
            implications_analysis='Enterprise software budgets are increasingly earmarked for GPU-accelerated computing workloads.',
            what_happens_next='Upcoming investor day disclosures will provide guidance on next-generation architecture shipments.',
            primary_companies=['NVIDIA'],
            stock_symbols=['NVDA'],
            importance_score=94
        )

    def test_article_newspaper_fields_serialization(self):
        client = APIClient()
        url = reverse('api-v1:article-detail', kwargs={'slug': self.article.slug})
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subheadline'], self.article.subheadline)
        self.assertEqual(response.data['editorial_desk'], 'Technology Markets & Finance Desk')
        self.assertEqual(response.data['article_type'], 'market_report')
        self.assertEqual(len(response.data['paragraphs']), 3)
        self.assertEqual(response.data['primary_companies'], ['NVIDIA'])
        self.assertEqual(response.data['stock_symbols'], ['NVDA'])
        self.assertIn('Hyperscaler cloud allocations', response.data['subheadline'])
