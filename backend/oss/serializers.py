from rest_framework import serializers
from oss.models import Repository

class RepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Repository
        fields = [
            'id',
            'full_name',
            'name',
            'owner',
            'slug',
            'description',
            'repo_url',
            'stars_count',
            'forks_count',
            'open_issues_count',
            'primary_language',
            'topics',
            'license_name',
            'latest_release_tag',
            'latest_release_name',
            'latest_release_date',
            'maintenance_status',
            'is_featured',
            'last_synced_at',
        ]
