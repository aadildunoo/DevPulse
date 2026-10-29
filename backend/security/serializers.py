from rest_framework import serializers
from security.models import SecurityAdvisory

class SecurityAdvisorySerializer(serializers.ModelSerializer):
    technology_name = serializers.CharField(source='technology.name', read_only=True)
    technology_slug = serializers.CharField(source='technology.slug', read_only=True)
    article_slug = serializers.CharField(source='article.slug', read_only=True)

    class Meta:
        model = SecurityAdvisory
        fields = [
            'id',
            'advisory_id',
            'cve_id',
            'title',
            'slug',
            'summary',
            'details',
            'severity',
            'cvss_score',
            'affected_product',
            'affected_versions',
            'patched_versions',
            'remediation_guide',
            'references',
            'source_url',
            'technology_name',
            'technology_slug',
            'article_slug',
            'published_at',
            'updated_at',
        ]
