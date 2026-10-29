from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from oss.models import Repository

class OpenSourceRepositoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.repo_rust = Repository.objects.create(
            full_name="astral-sh/uv",
            name="uv",
            owner="astral-sh",
            description="An extremely fast Python package and project manager, written in Rust.",
            repo_url="https://github.com/astral-sh/uv",
            stars_count=45000,
            forks_count=1200,
            primary_language="Rust",
            topics=["python", "package-manager", "cli"],
            license_name="MIT or Apache-2.0",
            maintenance_status="highly_active",
            is_featured=True,
        )

        self.repo_ts = Repository.objects.create(
            full_name="shadcn/ui",
            name="ui",
            owner="shadcn",
            description="Beautifully designed components that you can copy and paste into your apps.",
            repo_url="https://github.com/shadcn-ui/ui",
            stars_count=75000,
            forks_count=6500,
            primary_language="TypeScript",
            topics=["react", "tailwindcss", "radix-ui"],
            license_name="MIT",
            maintenance_status="highly_active",
            is_featured=True,
        )

    def test_list_repositories(self):
        url = reverse('api-v1:repository-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_by_language(self):
        url = reverse('api-v1:repository-list')
        response = self.client.get(f"{url}?language=Rust")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "uv")

    def test_repository_detail(self):
        url = reverse('api-v1:repository-detail', kwargs={'slug': self.repo_rust.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], "astral-sh/uv")
        self.assertIn("package-manager", response.data['topics'])

    def test_search_repositories(self):
        url = reverse('api-v1:repository-list')
        response = self.client.get(f"{url}?search=components")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "ui")
