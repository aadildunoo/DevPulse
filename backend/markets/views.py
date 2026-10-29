from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from markets.models import Company, MarketIndex, StockQuote, FinancialResult, WatchlistItem
from markets.serializers import (
    CompanySerializer,
    MarketIndexSerializer,
    StockQuoteSerializer,
    FinancialResultSerializer,
    WatchlistItemSerializer,
)
from markets.services import MarketDataService, MarketHoursHelper
from news.models import Article
from news.serializers import ArticleListSerializer


class MarketOverviewView(APIView):
    """
    Returns high-signal technology financial markets overview:
    indices (^IXIC, NDX, ^GSPC, SOXX), session state, top gainers, losers, and mega-caps.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        overview = MarketDataService.get_market_overview()
        return Response({
            'session': overview['session'],
            'indices': MarketIndexSerializer(overview['indices'], many=True).data,
            'gainers': StockQuoteSerializer(overview['gainers'], many=True).data,
            'losers': StockQuoteSerializer(overview['losers'], many=True).data,
            'most_active': StockQuoteSerializer(overview['most_active'], many=True).data,
            'mega_caps': StockQuoteSerializer(overview['mega_caps'], many=True).data,
            'last_updated': overview['last_updated'],
            'provider_notice': overview['provider_notice'],
        })


class StockQuoteListView(APIView):
    """
    Lists technology stock quotes with filtering by sector, ticker/name search,
    and sorting (market_cap, change_percent, volume, current_price).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Auto-seed if empty
        if not StockQuote.objects.exists():
            MarketDataService.initialize_market_universe()

        queryset = StockQuote.objects.select_related('company').all()

        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(company__ticker__icontains=search_query) |
                Q(company__name__icontains=search_query) |
                Q(company__sector__icontains=search_query)
            )

        sector = request.query_params.get('sector', '').strip()
        if sector:
            queryset = queryset.filter(company__sector__iexact=sector)

        sort_by = request.query_params.get('sort', 'market_cap')
        if sort_by == 'change_percent_desc':
            queryset = queryset.order_by('-change_percent')
        elif sort_by == 'change_percent_asc':
            queryset = queryset.order_by('change_percent')
        elif sort_by == 'volume_desc':
            queryset = queryset.order_by('-volume')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-current_price')
        elif sort_by == 'price_asc':
            queryset = queryset.order_by('current_price')
        else:
            queryset = queryset.order_by('-market_cap')

        serializer = StockQuoteSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'session': MarketHoursHelper.get_current_session_info(),
            'results': serializer.data,
        })


class StockQuoteDetailView(APIView):
    """
    Detail page for a specific ticker symbol. Includes live quote,
    company background, quarterly financial filings, and related news coverage.
    """
    permission_classes = [AllowAny]

    def get(self, request, ticker):
        ticker_clean = ticker.upper().strip()
        company = get_object_or_404(Company, ticker=ticker_clean)
        quote, _ = StockQuote.objects.get_or_create(
            company=company,
            defaults={
                'current_price': 100.00,
                'change': 0.00,
                'change_percent': 0.00,
                'market_status': 'Market Closed',
            }
        )

        financials = company.financial_results.all()[:4]

        # Related articles
        related_articles = Article.objects.filter(
            Q(stock_symbols__icontains=ticker_clean) |
            Q(primary_companies__icontains=company.name) |
            Q(title__icontains=ticker_clean) |
            Q(title__icontains=company.name)
        ).order_by('-published_at')[:6]

        return Response({
            'quote': StockQuoteSerializer(quote).data,
            'company': CompanySerializer(company).data,
            'financials': FinancialResultSerializer(financials, many=True).data,
            'related_articles': ArticleListSerializer(related_articles, many=True).data,
            'session': MarketHoursHelper.get_current_session_info(),
        })


class MarketMoversView(APIView):
    """
    Sorted views of technology market gainers, losers, and highest volume movers.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not StockQuote.objects.exists():
            MarketDataService.initialize_market_universe()

        quotes = StockQuote.objects.select_related('company').all()
        return Response({
            'session': MarketHoursHelper.get_current_session_info(),
            'gainers': StockQuoteSerializer(quotes.order_by('-change_percent')[:10], many=True).data,
            'losers': StockQuoteSerializer(quotes.order_by('change_percent')[:10], many=True).data,
            'most_active': StockQuoteSerializer(quotes.order_by('-volume')[:10], many=True).data,
        })


class CompanyDetailView(APIView):
    """
    Detailed profile for a covered technology corporation.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        company = get_object_or_404(Company, slug=slug)
        quote = getattr(company, 'quote', None)
        financials = company.financial_results.all()

        related_news = Article.objects.filter(
            Q(primary_companies__icontains=company.name) |
            Q(stock_symbols__icontains=company.ticker) |
            Q(title__icontains=company.name)
        ).order_by('-published_at')[:8]

        return Response({
            'company': CompanySerializer(company).data,
            'quote': StockQuoteSerializer(quote).data if quote else None,
            'financials': FinancialResultSerializer(financials, many=True).data,
            'related_news': ArticleListSerializer(related_news, many=True).data,
        })


class WatchlistView(APIView):
    """
    User technology stocks watchlist.
    """
    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'items': []})

        items = WatchlistItem.objects.filter(user=request.user).select_related('company', 'company__quote')
        return Response({
            'items': WatchlistItemSerializer(items, many=True).data
        })

    def post(self, request):
        ticker = request.data.get('ticker', '').strip().upper()
        if not ticker:
            return Response({'error': 'Ticker symbol required'}, status=status.HTTP_400_BAD_REQUEST)

        company = get_object_or_404(Company, ticker=ticker)
        item, created = WatchlistItem.objects.get_or_create(user=request.user, company=company)
        return Response({
            'message': f'{ticker} added to watchlist',
            'created': created,
            'item': WatchlistItemSerializer(item).data
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        if not ticker:
            return Response({'error': 'Ticker parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        company = get_object_or_404(Company, ticker=ticker)
        deleted_count, _ = WatchlistItem.objects.filter(user=request.user, company=company).delete()
        return Response({
            'message': f'{ticker} removed from watchlist',
            'deleted': deleted_count > 0
        })
