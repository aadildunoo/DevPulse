#!/usr/bin/env bash
set -e

# Run database migrations
echo "==> [Backend] Running database migrations..."
python manage.py migrate --noinput

# Seed database if newly initialized
python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devpulse.settings')
django.setup()
from news.models import Category
if not Category.objects.exists():
    print('==> [Backend] Seeding baseline categories, technologies, and sources...')
    from django.core.management import call_command
    call_command('seed_devpulse')
else:
    print('==> [Backend] Database already contains initialized data.')
"

# Collect static files if in production mode
if [ "${DJANGO_DEBUG:-False}" != "True" ] && [ "${DJANGO_DEBUG:-False}" != "true" ] && [ "${DJANGO_DEBUG:-False}" != "1" ]; then
    echo "==> [Backend] Collecting static files..."
    python manage.py collectstatic --noinput 2>/dev/null || true
fi

# Execute custom command if passed, or start server
if [ "$#" -gt 0 ]; then
    exec "$@"
elif [ "${DJANGO_DEBUG:-False}" = "True" ] || [ "${DJANGO_DEBUG:-False}" = "true" ] || [ "${DJANGO_DEBUG:-False}" = "1" ]; then
    echo "==> [Backend] Starting Django development server on 0.0.0.0:8001..."
    exec python manage.py runserver 0.0.0.0:8001
else
    echo "==> [Backend] Starting Gunicorn production server on 0.0.0.0:8001..."
    exec python -m gunicorn devpulse.wsgi:application \
        --bind 0.0.0.0:8001 \
        --workers "${GUNICORN_WORKERS:-3}" \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
fi

