from rest_framework import generics
from django.db.models import Q
from oss.models import Repository
from oss.serializers import RepositorySerializer

class RepositoryListView(generics.ListAPIView):
    """
    List open source repositories with filters for language, maintenance status, and search.
    """
    serializer_class = RepositorySerializer

    def get_queryset(self):
        qs = Repository.objects.all()
        params = self.request.query_params

        lang = params.get('language')
        if lang:
            qs = qs.filter(primary_language__icontains=lang)

        status = params.get('maintenance_status')
        if status:
            qs = qs.filter(maintenance_status=status)

        featured = params.get('featured')
        if featured in ('true', '1'):
            qs = qs.filter(is_featured=True)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(description__icontains=search) |
                Q(primary_language__icontains=search)
            )

        ordering = params.get('ordering', '-stars_count')
        if ordering in ['-stars_count', 'stars_count', '-last_synced_at']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-stars_count')

        return qs


class RepositoryDetailView(generics.RetrieveAPIView):
    queryset = Repository.objects.all()
    serializer_class = RepositorySerializer
    lookup_field = 'slug'
