from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from security.models import SecurityAdvisory
from news.models import Technology, Category

class SecurityAdvisoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Cybersecurity", slug="cybersecurity")
        self.tech = Technology.objects.create(name="Django", slug="django", category=self.category)

        self.advisory_critical = SecurityAdvisory.objects.create(
            advisory_id="GHSA-xxxx-1111",
            cve_id="CVE-2026-9999",
            title="Remote Code Execution in Django Form Validation",
            summary="A critical vulnerability was identified in older forms handlers.",
            severity="critical",
            cvss_score=9.8,
            affected_product="django",
            affected_versions="< 5.1.2",
            patched_versions="5.1.2",
            remediation_guide="Upgrade to version 5.1.2 immediately.",
            technology=self.tech,
            published_at=timezone.now(),
        )

        self.advisory_medium = SecurityAdvisory.objects.create(
            advisory_id="GHSA-yyyy-2222",
            cve_id="CVE-2026-8888",
            title="Timing Attack in Password Hash Comparison",
            summary="Potential side-channel timing attack under synthetic load.",
            severity="medium",
            cvss_score=5.3,
            affected_product="django-auth",
            affected_versions="< 2.0",
            patched_versions="2.0",
            remediation_guide="Update dependencies to modern cryptography.",
            technology=self.tech,
            published_at=timezone.now(),
        )

    def test_list_security_advisories(self):
        url = reverse('api-v1:security-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_by_severity(self):
        url = reverse('api-v1:security-list')
        response = self.client.get(f"{url}?severity=critical")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['cve_id'], "CVE-2026-9999")

    def test_security_advisory_detail(self):
        url = reverse('api-v1:security-detail', kwargs={'slug': self.advisory_critical.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['advisory_id'], "GHSA-xxxx-1111")
        self.assertEqual(response.data['remediation_guide'], "Upgrade to version 5.1.2 immediately.")

    def test_search_advisories(self):
        url = reverse('api-v1:security-list')
        response = self.client.get(f"{url}?search=Timing")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['severity'], "medium")
