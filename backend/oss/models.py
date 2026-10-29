from django.db import models
from django.utils.text import slugify

class Repository(models.Model):
    MAINTENANCE_STATUS = [
        ('highly_active', 'Highly Active'),
        ('active', 'Active'),
        ('maintenance_only', 'Maintenance Only'),
        ('slow', 'Slow Maintenance'),
        ('deprecated', 'Deprecated / Archived'),
    ]

    full_name = models.CharField(max_length=200, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    owner = models.CharField(max_length=100)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True)
    repo_url = models.URLField(max_length=500)

    stars_count = models.IntegerField(default=0, db_index=True)
    forks_count = models.IntegerField(default=0)
    open_issues_count = models.IntegerField(default=0)

    primary_language = models.CharField(max_length=60, blank=True, db_index=True)
    topics = models.JSONField(default=list, blank=True)
    license_name = models.CharField(max_length=100, blank=True)

    latest_release_tag = models.CharField(max_length=100, blank=True)
    latest_release_name = models.CharField(max_length=200, blank=True)
    latest_release_date = models.DateTimeField(null=True, blank=True)

    maintenance_status = models.CharField(max_length=30, choices=MAINTENANCE_STATUS, default='active')
    is_featured = models.BooleanField(default=False, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Repositories"
        ordering = ['-stars_count']

    def __str__(self):
        return f"{self.full_name} ({self.stars_count} stars)"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.full_name.replace('/', '-'))
        super().save(*args, **kwargs)
