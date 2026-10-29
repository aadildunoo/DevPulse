from django.urls import path
from markets.views import (
    MarketOverviewView,
    StockQuoteListView,
    StockQuoteDetailView,
    MarketMoversView,
    CompanyDetailView,
    WatchlistView,
)

urlpatterns = [
    path('overview/', MarketOverviewView.as_view(), name='market-overview'),
    path('stocks/', StockQuoteListView.as_view(), name='stock-list'),
    path('stocks/<str:ticker>/', StockQuoteDetailView.as_view(), name='stock-detail'),
    path('movers/', MarketMoversView.as_view(), name='market-movers'),
    path('companies/<slug:slug>/', CompanyDetailView.as_view(), name='company-detail'),
    path('watchlist/', WatchlistView.as_view(), name='market-watchlist'),
]
