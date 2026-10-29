from rest_framework import views, generics, status, permissions
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from users.models import UserProfile, Bookmark
from news.models import Technology, Category
from users.serializers import UserSerializer, RegisterSerializer, BookmarkSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(views.APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})


class CurrentUserView(views.APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'authenticated': False, 'user': None})
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        profile = user.profile
        data = request.data

        if 'role_title' in data:
            profile.role_title = data['role_title']
        if 'theme_preference' in data and data['theme_preference'] in ['dark', 'light', 'system']:
            profile.theme_preference = data['theme_preference']
        if 'email_digest_frequency' in data:
            profile.email_digest_frequency = data['email_digest_frequency']

        profile.save()
        return Response(UserSerializer(user).data)


class BookmarkListView(generics.ListCreateAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related('article__source', 'article__category')


class BookmarkDeleteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, article_id):
        deleted, _ = Bookmark.objects.filter(user=request.user, article_id=article_id).delete()
        if deleted:
            return Response({'message': 'Bookmark removed'}, status=status.HTTP_200_OK)
        return Response({'error': 'Bookmark not found'}, status=status.HTTP_404_NOT_FOUND)


class ToggleFollowTechnologyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tech_slug):
        tech = Technology.objects.filter(slug=tech_slug).first()
        if not tech:
            return Response({'error': 'Technology not found'}, status=404)

        profile = request.user.profile
        if profile.followed_technologies.filter(pk=tech.pk).exists():
            profile.followed_technologies.remove(tech)
            is_following = False
        else:
            profile.followed_technologies.add(tech)
            is_following = True

        return Response({
            'technology': tech.name,
            'slug': tech.slug,
            'is_following': is_following
        })
