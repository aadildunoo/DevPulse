#!/usr/bin/env bash
set -e

# Detect and activate virtualenv if available
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "/app/.venv/bin/activate" ]; then
    source /app/.venv/bin/activate
elif [ -f "/opt/venv/bin/activate" ]; then
    source /opt/venv/bin/activate
fi

# Detect python binary (python3 or python)
if command -v python3 >/dev/null 2>&1; then
    PY="python3"
elif command -v python >/dev/null 2>&1; then
    PY="python"
else
    echo "==> Error: Neither python3 nor python found in PATH!"
    exit 1
fi

# Run database migrations
echo "==> Running database migrations..."
$PY manage.py migrate --noinput

# Seed initial baseline data if needed
$PY -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devpulse.settings')
django.setup()
from news.models import Category
if not Category.objects.exists():
    print('==> Seeding baseline categories, technologies, and sources...')
    from django.core.management import call_command
    call_command('seed_devpulse')
else:
    print('==> Database already seeded.')
"

# Start Gunicorn server
PORT="${PORT:-8001}"
echo "==> Starting Gunicorn on port ${PORT}..."
exec $PY -m gunicorn devpulse.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -


