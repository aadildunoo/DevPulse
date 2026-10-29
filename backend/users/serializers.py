from rest_framework import serializers
from django.contrib.auth.models import User
from users.models import UserProfile, Bookmark
from news.serializers import ArticleListSerializer, TechnologySerializer, CategorySerializer

class UserSerializer(serializers.ModelSerializer):
    role_title = serializers.CharField(source='profile.role_title', read_only=True)
    theme_preference = serializers.CharField(source='profile.theme_preference', read_only=True)
    followed_technologies = TechnologySerializer(source='profile.followed_technologies', many=True, read_only=True)
    preferred_categories = CategorySerializer(source='profile.preferred_categories', many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role_title', 'theme_preference', 'followed_technologies', 'preferred_categories']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role_title = serializers.CharField(required=False, default="")

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role_title']

    def create(self, validated_data):
        role_title = validated_data.pop('role_title', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        if hasattr(user, 'profile'):
            user.profile.role_title = role_title
            user.profile.save()
        return user


class BookmarkSerializer(serializers.ModelSerializer):
    article = ArticleListSerializer(read_only=True)
    article_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'article', 'article_id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        article_id = validated_data['article_id']
        bookmark, created = Bookmark.objects.get_or_create(user=user, article_id=article_id)
        return bookmark
