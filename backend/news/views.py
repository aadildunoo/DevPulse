from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from news.models import Article, Category, Technology, Source, DailyBriefing, IngestionJob
from news.serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    CategorySerializer,
    TechnologySerializer,
    SourceSerializer,
    DailyBriefingSerializer,
    IngestionJobSerializer,
)
from news.services import generate_daily_briefing
from ingestion.engine import IngestionEngine


class ArticleListView(generics.ListAPIView):
    """
    List articles with full filtering: category, technology, source, event_type, search, sorting.
    """
    serializer_class = ArticleListSerializer

    def get_queryset(self):
        qs = Article.objects.select_related('source', 'category', 'intelligence').prefetch_related('technologies', 'categories')
        params = self.request.query_params

        category_slug = params.get('category')
        if category_slug:
            qs = qs.filter(Q(category__slug=category_slug) | Q(categories__slug=category_slug)).distinct()

        tech_slug = params.get('technology')
        if tech_slug:
            qs = qs.filter(technologies__slug=tech_slug)

        source_slug = params.get('source')
        if source_slug:
            qs = qs.filter(source__slug=source_slug)

        article_type = params.get('article_type')
        if article_type:
            qs = qs.filter(article_type=article_type)

        editorial_desk = params.get('editorial_desk')
        if editorial_desk:
            qs = qs.filter(editorial_desk__icontains=editorial_desk)

        ticker = params.get('ticker')
        if ticker:
            qs = qs.filter(stock_symbols__icontains=ticker.upper().strip())

        company = params.get('company')
        if company:
            qs = qs.filter(primary_companies__icontains=company)

        event_type = params.get('event_type')
        if event_type:
            qs = qs.filter(primary_event_type=event_type)

        importance_min = params.get('importance_min')
        if importance_min and importance_min.isdigit():
            qs = qs.filter(importance_score__gte=int(importance_min))

        breaking_only = params.get('is_breaking')
        if breaking_only in ('true', '1'):
            qs = qs.filter(is_breaking=True)

        date_from = params.get('date_from')
        if date_from:
            try:
                qs = qs.filter(published_at__gte=date_from)
            except Exception:
                pass

        date_to = params.get('date_to')
        if date_to:
            try:
                qs = qs.filter(published_at__lte=date_to)
            except Exception:
                pass

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(summary_raw__icontains=search) |
                Q(intelligence__concise_summary__icontains=search) |
                Q(technologies__name__icontains=search)
            ).distinct()

        ordering = params.get('ordering', '-published_at')
        if ordering in ['-published_at', 'published_at', '-importance_score', 'importance_score', '-view_count']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-published_at')

        return qs


class ArticleDetailView(generics.RetrieveAPIView):
    """
    Retrieve full article analysis by slug.
    """
    queryset = Article.objects.select_related('source', 'category', 'intelligence').prefetch_related('technologies', 'corrections')
    serializer_class = ArticleDetailSerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Article.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ForYouFeedView(views.APIView):
    """
    Personalized intelligence feed.
    If authenticated, prioritizes followed technologies and preferred categories.
    For anonymous visitors, delivers high-signal top stories + recent developments.
    """
    def get(self, request):
        user = request.user
        base_qs = Article.objects.select_related('source', 'category', 'intelligence').prefetch_related('technologies')

        if user.is_authenticated and hasattr(user, 'profile'):
            profile = user.profile
            followed_techs = profile.followed_technologies.all()
            preferred_cats = profile.preferred_categories.all()

            if followed_techs.exists() or preferred_cats.exists():
                personalized_qs = base_qs.filter(
                    Q(technologies__in=followed_techs) | Q(category__in=preferred_cats)
                ).distinct().order_by('-importance_score', '-published_at')[:30]

                # Fallback / supplement with general high importance stories
                if personalized_qs.count() < 10:
                    general_qs = base_qs.order_by('-importance_score', '-published_at')[:20]
                    articles = list(personalized_qs) + [a for a in general_qs if a not in personalized_qs]
                    serializer = ArticleListSerializer(articles[:30], many=True)
                    return Response({'feed_type': 'personalized_hybrid', 'results': serializer.data})

                serializer = ArticleListSerializer(personalized_qs, many=True)
                return Response({'feed_type': 'personalized', 'results': serializer.data})

        # Anonymous visitor feed: balanced mix of breaking / high-importance + latest
        breaking = list(base_qs.filter(is_breaking=True).order_by('-published_at')[:5])
        top_signal = list(base_qs.order_by('-importance_score', '-published_at')[:25])
        combined = breaking + [a for a in top_signal if a not in breaking]

        serializer = ArticleListSerializer(combined[:25], many=True)
        return Response({'feed_type': 'curated_signal', 'results': serializer.data})


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer_class = CategorySerializer
    pagination_class = None


class TechnologyListView(generics.ListAPIView):
    queryset = Technology.objects.all().order_by('name')
    serializer_class = TechnologySerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        trending = self.request.query_params.get('trending')
        if category:
            qs = qs.filter(category__slug=category)
        if trending in ('true', '1'):
            qs = qs.filter(is_trending=True)
        return qs


class TechnologyDetailView(generics.RetrieveAPIView):
    queryset = Technology.objects.all()
    serializer_class = TechnologySerializer
    lookup_field = 'slug'


class SourceListView(generics.ListAPIView):
    queryset = Source.objects.all().order_by('name')
    serializer_class = SourceSerializer
    pagination_class = None


class DailyBriefingView(views.APIView):
    """
    Returns today's curated daily briefing.
    """
    def get(self, request):
        briefing = generate_daily_briefing()
        serializer = DailyBriefingSerializer(briefing)
        return Response(serializer.data)


class GlobalSearchView(views.APIView):
    """
    Fast unified search across articles, technologies, and advisories with rich filtering.
    """
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'articles': [], 'technologies': [], 'advisories': []})

        articles_qs = Article.objects.filter(
            Q(title__icontains=q) |
            Q(subheadline__icontains=q) |
            Q(summary_raw__icontains=q) |
            Q(editorial_desk__icontains=q) |
            Q(primary_companies__icontains=q) |
            Q(stock_symbols__icontains=q) |
            Q(intelligence__concise_summary__icontains=q) |
            Q(technologies__name__icontains=q)
        ).select_related('source', 'category', 'intelligence').prefetch_related('technologies', 'categories')

        # Optional filters
        cat_slug = request.query_params.get('category')
        if cat_slug:
            articles_qs = articles_qs.filter(Q(category__slug=cat_slug) | Q(categories__slug=cat_slug))

        src_slug = request.query_params.get('source')
        if src_slug:
            articles_qs = articles_qs.filter(source__slug=src_slug)

        importance_min = request.query_params.get('importance_min')
        if importance_min and importance_min.isdigit():
            articles_qs = articles_qs.filter(importance_score__gte=int(importance_min))

        date_from = request.query_params.get('date_from')
        if date_from:
            try:
                articles_qs = articles_qs.filter(published_at__gte=date_from)
            except Exception:
                pass

        date_to = request.query_params.get('date_to')
        if date_to:
            try:
                articles_qs = articles_qs.filter(published_at__lte=date_to)
            except Exception:
                pass

        ordering = request.query_params.get('ordering', '-importance_score')
        if ordering in ['-published_at', '-importance_score']:
            articles_qs = articles_qs.order_by(ordering)
        else:
            articles_qs = articles_qs.order_by('-importance_score')

        limit = min(int(request.query_params.get('limit', 15)), 50)
        articles = list(articles_qs.distinct()[:limit])

        technologies = Technology.objects.filter(
            Q(name__icontains=q) | Q(slug__icontains=q)
        )[:5]

        # Search covered market companies & stock tickers
        from markets.models import Company
        from markets.serializers import CompanySerializer
        companies = Company.objects.filter(
            Q(ticker__icontains=q) | Q(name__icontains=q) | Q(sector__icontains=q)
        )[:5]

        from security.models import SecurityAdvisory
        from security.serializers import SecurityAdvisorySerializer
        advisories = SecurityAdvisory.objects.filter(
            Q(title__icontains=q) | Q(cve_id__icontains=q) | Q(advisory_id__icontains=q) | Q(affected_product__icontains=q)
        )[:6]

        return Response({
            'query': q,
            'total_article_matches': len(articles),
            'articles': ArticleListSerializer(articles, many=True).data,
            'technologies': TechnologySerializer(technologies, many=True).data,
            'companies': CompanySerializer(companies, many=True).data,
            'advisories': SecurityAdvisorySerializer(advisories, many=True).data,
        })


class TriggerIngestionView(views.APIView):
    """
    Manually trigger ingestion or check recent jobs.
    Protected in production against unauthorized denial-of-service batch scraping.
    """
    def _is_authorized(self, request):
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return True
        from django.conf import settings
        expected_token = getattr(settings, 'DEVPULSE_ADMIN_API_TOKEN', '')
        provided_token = request.headers.get('X-DevPulse-Admin-Token', '') or request.query_params.get('admin_token', '')
        if expected_token and provided_token == expected_token:
            return True
        if settings.DEBUG and not expected_token:
            return True
        return False

    def post(self, request):
        if not self._is_authorized(request):
            return Response(
                {'error': 'Unauthorized. Admin credentials or valid X-DevPulse-Admin-Token header required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        source_slug = request.data.get('source_slug')
        force = bool(request.data.get('force', False))
        if source_slug:
            src = Source.objects.filter(slug=source_slug).first()
            if not src:
                return Response({'error': f'Source {source_slug} not found'}, status=404)
            job = IngestionEngine.poll_source(src, force=force)
            return Response(IngestionJobSerializer(job).data)
        else:
            jobs = IngestionEngine.poll_all_active_sources()
            return Response(IngestionJobSerializer(jobs, many=True).data)

    def get(self, request):
        jobs = IngestionJob.objects.select_related('source').order_by('-started_at')[:20]
        return Response(IngestionJobSerializer(jobs, many=True).data)


class BreakingNewsView(views.APIView):
    """
    Returns active, time-sensitive breaking news articles.
    A story qualifies as breaking if:
    1. is_breaking is True and published within the last 48 hours
    2. OR importance_score >= 90 published within the last 24 hours.
    Expired breaking stories are automatically excluded.
    """
    def get(self, request):
        now = timezone.now()
        cutoff_breaking = now - timedelta(hours=48)
        cutoff_urgent = now - timedelta(hours=24)

        qs = Article.objects.filter(
            Q(is_breaking=True, published_at__gte=cutoff_breaking) |
            Q(importance_score__gte=90, published_at__gte=cutoff_urgent)
        ).filter(
            editorial_status='published'
        ).select_related('source', 'category').prefetch_related('technologies').order_by('-published_at', '-importance_score')[:10]

        serializer = ArticleListSerializer(qs, many=True)
        return Response({
            'count': len(serializer.data),
            'timestamp': now.isoformat(),
            'results': serializer.data
        })


class TrendingNewsView(views.APIView):
    """
    Returns trending stories receiving high reader engagement or strategic market focus.
    Considers freshness (last 7 days) and high importance score.
    """
    def get(self, request):
        now = timezone.now()
        cutoff = now - timedelta(days=7)

        qs = Article.objects.filter(
            published_at__gte=cutoff,
            editorial_status='published'
        ).select_related('source', 'category').prefetch_related('technologies').order_by('-importance_score', '-view_count', '-published_at')[:8]

        serializer = ArticleListSerializer(qs, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })

