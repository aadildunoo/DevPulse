from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from users.models import UserProfile, Bookmark
from news.models import Article, Source, Technology, Category

class UserAuthAndPersonalizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Frameworks", slug="frameworks")
        self.tech = Technology.objects.create(name="React", slug="react", category=self.category)
        self.source = Source.objects.create(name="Source 1", slug="src-1", url="https://react.dev")
        self.article = Article.objects.create(
            title="React Server Actions in Practice",
            source=self.source,
            canonical_url="https://react.dev/blog/actions",
            published_at=timezone.now(),
        )

    def test_user_registration_and_profile_creation(self):
        url = reverse('api-v1:auth-register')
        data = {
            'username': 'newdeveloper',
            'email': 'new@devpulse.io',
            'password': 'SecurePassword123!',
            'role_title': 'Lead AI Engineer',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newdeveloper')
        self.assertEqual(response.data['role_title'], 'Lead AI Engineer')

        user = User.objects.get(username='newdeveloper')
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.role_title, 'Lead AI Engineer')

    def test_login_and_logout_lifecycle(self):
        User.objects.create_user(username='existingdev', password='password123#')

        # Test invalid login
        login_url = reverse('api-v1:auth-login')
        fail_resp = self.client.post(login_url, {'username': 'existingdev', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(fail_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Test valid login
        success_resp = self.client.post(login_url, {'username': 'existingdev', 'password': 'password123#'}, format='json')
        self.assertEqual(success_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(success_resp.data['username'], 'existingdev')

        # Test current user status
        me_url = reverse('api-v1:auth-me')
        me_resp = self.client.get(me_url)
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(me_resp.data['authenticated'])
        self.assertEqual(me_resp.data['user']['username'], 'existingdev')

        # Test logout
        logout_url = reverse('api-v1:auth-logout')
        logout_resp = self.client.post(logout_url)
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)

    def test_profile_patch_preferences(self):
        user = User.objects.create_user(username='profiledev', password='password123#')
        self.client.force_authenticate(user=user)

        url = reverse('api-v1:auth-me')
        patch_data = {
            'role_title': 'Staff Systems Architect',
            'theme_preference': 'light',
            'email_digest_frequency': 'weekly',
        }
        response = self.client.patch(url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role_title'], 'Staff Systems Architect')
        self.assertEqual(response.data['theme_preference'], 'light')

    def test_toggle_follow_technology(self):
        user = User.objects.create_user(username='followerdev', password='password123#')
        self.client.force_authenticate(user=user)

        url = reverse('api-v1:technology-follow', kwargs={'tech_slug': self.tech.slug})
        # 1. Follow
        resp_follow = self.client.post(url)
        self.assertEqual(resp_follow.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_follow.data['is_following'])
        self.assertTrue(user.profile.followed_technologies.filter(pk=self.tech.pk).exists())

        # 2. Unfollow
        resp_unfollow = self.client.post(url)
        self.assertEqual(resp_unfollow.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_unfollow.data['is_following'])
        self.assertFalse(user.profile.followed_technologies.filter(pk=self.tech.pk).exists())

    def test_user_data_isolation_on_bookmarks(self):
        user_a = User.objects.create_user(username='user_a', password='password123#')
        user_b = User.objects.create_user(username='user_b', password='password123#')

        # User A saves article
        Bookmark.objects.create(user=user_a, article=self.article)

        # User B queries bookmarks
        self.client.force_authenticate(user=user_b)
        response_b = self.client.get(reverse('api-v1:bookmark-list'))
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_b.data['results']), 0)

        # User B tries to delete User A's bookmark
        del_resp = self.client.delete(reverse('api-v1:bookmark-delete', kwargs={'article_id': self.article.id}))
        self.assertEqual(del_resp.status_code, status.HTTP_404_NOT_FOUND)
        # Ensure User A's bookmark remains intact
        self.assertTrue(Bookmark.objects.filter(user=user_a, article=self.article).exists())
