from rest_framework import generics
from django.db.models import Q
from security.models import SecurityAdvisory
from security.serializers import SecurityAdvisorySerializer

class SecurityAdvisoryListView(generics.ListAPIView):
    """
    List security advisories with filtering by severity, product, CVE, search.
    """
    serializer_class = SecurityAdvisorySerializer

    def get_queryset(self):
        qs = SecurityAdvisory.objects.select_related('technology', 'article')
        params = self.request.query_params

        severity = params.get('severity')
        if severity:
            qs = qs.filter(severity=severity.lower())

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(cve_id__icontains=search) |
                Q(advisory_id__icontains=search) |
                Q(affected_product__icontains=search) |
                Q(summary__icontains=search)
            )

        return qs.order_by('-published_at')


class SecurityAdvisoryDetailView(generics.RetrieveAPIView):
    queryset = SecurityAdvisory.objects.select_related('technology', 'article')
    serializer_class = SecurityAdvisorySerializer
    lookup_field = 'slug'
