"""
URL configuration for DevPulse project.
Versioned REST API v1 routing and administrative endpoints.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.views import HealthCheckView
from news.views import (
    ArticleListView,
    ArticleDetailView,
    BreakingNewsView,
    TrendingNewsView,
    ForYouFeedView,
    CategoryListView,
    TechnologyListView,
    TechnologyDetailView,
    SourceListView,
    DailyBriefingView,
    GlobalSearchView,
    TriggerIngestionView,
)
from security.views import SecurityAdvisoryListView, SecurityAdvisoryDetailView
from oss.views import RepositoryListView, RepositoryDetailView
from users.views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    BookmarkListView,
    BookmarkDeleteView,
    ToggleFollowTechnologyView,
)

api_v1_patterns = [
    # Core & Health
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # News & Articles
    path('articles/', ArticleListView.as_view(), name='article-list'),
    path('articles/breaking/', BreakingNewsView.as_view(), name='breaking-news'),
    path('articles/trending/', TrendingNewsView.as_view(), name='trending-news'),
    path('articles/<slug:slug>/', ArticleDetailView.as_view(), name='article-detail'),
    path('feed/', ForYouFeedView.as_view(), name='for-you-feed'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('technologies/', TechnologyListView.as_view(), name='technology-list'),
    path('technologies/<slug:slug>/', TechnologyDetailView.as_view(), name='technology-detail'),
    path('technologies/<slug:tech_slug>/follow/', ToggleFollowTechnologyView.as_view(), name='technology-follow'),
    path('sources/', SourceListView.as_view(), name='source-list'),
    path('briefing/', DailyBriefingView.as_view(), name='daily-briefing'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('ingest/', TriggerIngestionView.as_view(), name='trigger-ingestion'),

    # Security Center
    path('security/', SecurityAdvisoryListView.as_view(), name='security-list'),
    path('security/<slug:slug>/', SecurityAdvisoryDetailView.as_view(), name='security-detail'),

    # Open Source Explorer
    path('repositories/', RepositoryListView.as_view(), name='repository-list'),
    path('repositories/<slug:slug>/', RepositoryDetailView.as_view(), name='repository-detail'),

    # Technology Stock Markets & Financial Desk
    path('markets/', include(('markets.urls', 'markets'))),

    # Users & Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('bookmarks/', BookmarkListView.as_view(), name='bookmark-list'),
    path('bookmarks/<int:article_id>/', BookmarkDeleteView.as_view(), name='bookmark-delete'),

    # API Schema & Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include((api_v1_patterns, 'api-v1'))),
]
