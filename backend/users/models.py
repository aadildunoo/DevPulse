from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    THEME_CHOICES = [
        ('dark', 'Dark'),
        ('light', 'Light'),
        ('system', 'System Default'),
    ]
    DIGEST_CHOICES = [
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'No Emails'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role_title = models.CharField(max_length=150, blank=True, help_text="e.g. Senior Backend Engineer")
    bio = models.TextField(blank=True)
    preferred_categories = models.ManyToManyField('news.Category', blank=True, related_name='interested_users')
    followed_technologies = models.ManyToManyField('news.Technology', blank=True, related_name='followers')
    theme_preference = models.CharField(max_length=10, choices=THEME_CHOICES, default='dark')
    email_digest_frequency = models.CharField(max_length=15, choices=DIGEST_CHOICES, default='daily')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    article = models.ForeignKey('news.Article', on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'article')

    def __str__(self):
        return f"{self.user.username} saved {self.article.title[:40]}"


class ReadingHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reading_history')
    article = models.ForeignKey('news.Article', on_delete=models.CASCADE, related_name='read_events')
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-viewed_at']
        unique_together = ('user', 'article')

    def __str__(self):
        return f"{self.user.username} read {self.article.title[:40]}"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
