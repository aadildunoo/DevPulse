from django.db import models
from django.utils.text import slugify

class SecurityAdvisory(models.Model):
    SEVERITY_LEVELS = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    advisory_id = models.CharField(max_length=100, unique=True, db_index=True)
    cve_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    title = models.CharField(max_length=350)
    slug = models.SlugField(max_length=380, unique=True)
    summary = models.TextField()
    details = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='medium', db_index=True)
    cvss_score = models.FloatField(null=True, blank=True)

    affected_product = models.CharField(max_length=200)
    affected_versions = models.CharField(max_length=255)
    patched_versions = models.CharField(max_length=255, blank=True)
    remediation_guide = models.TextField(blank=True)
    references = models.JSONField(default=list, blank=True)
    source_url = models.URLField(max_length=500, blank=True)

    technology = models.ForeignKey('news.Technology', on_delete=models.SET_NULL, null=True, blank=True, related_name='security_advisories')
    article = models.ForeignKey('news.Article', on_delete=models.SET_NULL, null=True, blank=True, related_name='security_advisories')

    published_at = models.DateTimeField(db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Security Advisories"
        ordering = ['-published_at']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.cve_id or self.advisory_id}: {self.title[:60]}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.cve_id or self.advisory_id}-{self.title}")[:300]
            candidate = base_slug
            idx = 1
            while SecurityAdvisory.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{idx}"
                idx += 1
            self.slug = candidate
        super().save(*args, **kwargs)
