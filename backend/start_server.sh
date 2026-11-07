#!/usr/bin/env bash
set -e

# Run database migrations
echo "==> Running database migrations..."
python manage.py migrate --noinput

# Seed initial baseline data if needed
python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devpulse.settings')
django.setup()
from news.models import Category
if not Category.objects.exists():
    print('==> Seeding baseline categories, technologies, and sources...')
    from django.core.management import call_command
    call_command('seed_devpulse')
"

# Start Gunicorn server
PORT="${PORT:-8001}"
echo "==> Starting Gunicorn on port ${PORT}..."
exec python -m gunicorn devpulse.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

