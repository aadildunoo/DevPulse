"""
Django settings for DevPulse backend.
Production-ready, modular architecture with sensible local defaults.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

from django.core.exceptions import ImproperlyConfigured

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'devpulse-insecure-dev-key-change-in-prod-49102847' if DEBUG else ''
)

if not DEBUG and not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY environment variable must be set in production environments.")

DEVPULSE_ADMIN_API_TOKEN = os.environ.get('DEVPULSE_ADMIN_API_TOKEN', '')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',
    'drf_spectacular',

    # DevPulse Modular Apps
    'core.apps.CoreConfig',
    'news.apps.NewsConfig',
    'markets.apps.MarketsConfig',
    'security.apps.SecurityConfig',
    'oss.apps.OssConfig',
    'users.apps.UsersConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'devpulse.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'devpulse.wsgi.application'

# Database
# Support DATABASE_URL or PostgreSQL env, default to local SQLite for instant zero-dependency launch
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres'):
    import urllib.parse as urlparse
    url = urlparse.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS & CSRF Settings
CORS_ALLOW_ALL_ORIGINS = DEBUG

_env_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
_extra_origins = [o.strip() for o in _env_cors.split(',') if o.strip()]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://devpulse-hq.netlify.app',
    'https://devpulse123.netlify.app',
] + _extra_origins

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.netlify\.app$",
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.netlify.app',
    'https://*.up.railway.app',
    'https://*.railway.app',
]
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',
        'user': '600/min',
    }
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'DevPulse API',
    'DESCRIPTION': 'Developer-First Global Technology Intelligence Platform API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# DevPulse AI Pipeline Settings
DEVPULSE_AI_PROVIDER = os.environ.get('DEVPULSE_AI_PROVIDER', 'heuristic') # 'heuristic', 'gemini', 'openai', 'anthropic'
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
