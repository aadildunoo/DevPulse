#!/usr/bin/env bash
set -e

# Detect python binary
if command -v python3 >/dev/null 2>&1; then
    PY="python3"
elif command -v python >/dev/null 2>&1; then
    PY="python"
else
    echo "==> Error: Neither python3 nor python found in PATH!"
    exit 1
fi

# Run database migrations
echo "==> [Backend] Running database migrations..."
$PY manage.py migrate --noinput

# Seed database if newly initialized
$PY -c "
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
    $PY manage.py collectstatic --noinput 2>/dev/null || true
fi

# Execute custom command if passed, or start server
if [ "$#" -gt 0 ]; then
    exec "$@"
elif [ "${DJANGO_DEBUG:-False}" = "True" ] || [ "${DJANGO_DEBUG:-False}" = "true" ] || [ "${DJANGO_DEBUG:-False}" = "1" ]; then
    echo "==> [Backend] Starting Django development server on 0.0.0.0:${PORT:-8001}..."
    exec $PY manage.py runserver 0.0.0.0:${PORT:-8001}
else
    echo "==> [Backend] Starting Gunicorn production server on 0.0.0.0:${PORT:-8001}..."
    exec $PY -m gunicorn devpulse.wsgi:application \
        --bind 0.0.0.0:${PORT:-8001} \
        --workers "${GUNICORN_WORKERS:-3}" \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
fi

