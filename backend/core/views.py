from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone
from news.models import Article, Source, IngestionJob
from security.models import SecurityAdvisory
from oss.models import Repository

class HealthCheckView(APIView):
    """
    Public system health check returning database status and core platform metrics.
    """
    def get(self, request):
        db_healthy = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as e:
            db_healthy = False

        failed_sources = Source.objects.filter(consecutive_failures__gt=2).count()
        recent_jobs = IngestionJob.objects.order_by('-started_at')[:5]
        latest_job_status = recent_jobs[0].status if recent_jobs else 'none'

        return Response({
            'status': 'healthy' if db_healthy else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'database_connected': db_healthy,
            'metrics': {
                'total_articles': Article.objects.count(),
                'total_security_advisories': SecurityAdvisory.objects.count(),
                'total_repositories': Repository.objects.count(),
                'active_sources': Source.objects.filter(is_active=True).count(),
                'degraded_sources': failed_sources,
                'latest_ingestion_status': latest_job_status,
            }
        })
