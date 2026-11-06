FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install curl
RUN apt-get update && apt-get install -y --no-install-recommends curl gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies
COPY backend/requirements.txt backend/pyproject.toml* /app/
RUN uv venv /app/.venv && \
    uv pip install --python /app/.venv -r /app/requirements.txt

COPY backend/ /app/
RUN chmod +x /app/docker-entrypoint.sh

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
