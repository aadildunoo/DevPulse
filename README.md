# DevPulse
### The Developer-First Global Technology Intelligence Platform

> **"Know what changed. Understand why it matters. Decide what to do next."**  
> *Signal over noise. Evidence over hype. Context over clickbait. Practical value over vanity metrics.*

---

## 1. Overview

**DevPulse** is a production-oriented, full-stack technology intelligence platform engineered for software engineers, software architects, AI engineers, DevOps professionals, security analysts, and researchers.

Rather than aggregating sensationalist headlines, DevPulse ingests real primary technology sources (official releases, core maintainer weblogs, and CVE security advisories) and synthesizes **actionable developer intelligence**:
- **What happened:** Objective, verified summary of the release or incident.
- **Why it matters:** Strategic significance to the software engineering ecosystem.
- **Developer impact:** Concrete consequences on daily workflows, breaking changes, and migration needs.
- **Implications matrix:** Positive capabilities contrasted against drawbacks, risks, and limitations.
- **Recommended actions:** Prioritized steps for engineering teams.
- **Authoritative source links:** Direct attribution to official documentation and feeds.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Dark theme default with near-black and charcoal surfaces, electric violet & indigo accents)
- **Icons:** Lucide React
- **Features:** Keyboard Command Palette (`Cmd+K` / `Ctrl+K`), live ingestion ticker, bookmark vault, ecosystem hubs.

### Backend
- **Framework:** Python 3.12, Django 6, Django REST Framework
- **API Documentation:** OpenAPI 3 schema via `drf-spectacular` and Swagger UI
- **Data Persistence:** SQLite (instant local development with zero dependencies) + PostgreSQL support via `DATABASE_URL`
- **Security:** Strict CORS, XSS protections, input sanitization, generic IP tracking in audit logs.

### News Ingestion Engine
- **Source Adapters:** Handles XML RSS/Atom feeds, GitHub releases feeds, and JSON REST Security Advisory endpoints.
- **Deduplication:** Canonical URL normalization, query parameter stripping, SHA-256 content hashing.
- **Reliability Tiers:** Authoritative (primary maintainers/vendors), Verified Independent, and Community.
- **Health Tracking:** Polling intervals, ETag/Last-Modified conditional HTTP requests, consecutive failure tracking, and job logs.

### AI Editorial Intelligence Pipeline
- **Validation:** Strict schema enforcement via `pydantic`.
- **Provider Independence:** High-signal Heuristic Engine running locally with zero external API key requirements, with seamless adapter support for Gemini, OpenAI, or Anthropic.

---

## 3. Architecture & Repository Structure

```
DevPulse/
├── backend/
│   ├── devpulse/           # Project settings, URL routing, WSGI/ASGI
│   ├── core/               # Health check view, AuditLog model
│   ├── news/               # Articles, Intelligence, Sources, Categories, Technologies, Daily Briefings
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py     # Daily Briefing synthesis
│   │   └── management/     # seed_devpulse, run_ingestion commands
│   ├── security/           # CVE Security Advisories, remediation guides
│   ├── oss/                # Open Source Explorer repositories
│   ├── users/              # Profiles, Bookmarks, Preferences, Auth
│   ├── ingestion/          # Source adapters, HTTP engine, deduplication
│   └── intelligence/       # Pydantic schema, heuristic extraction, LLM interface
├── frontend/
│   ├── src/
│   │   ├── app/            # App Router pages (Home, Live, AI, Frameworks, Security, OSS, Briefing, Saved, Tech, Article)
│   │   ├── components/     # Navbar, SearchModal, ArticleCard, Footer, AppShell
│   │   └── lib/            # Typed API client, TypeScript contracts
│   └── public/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
└── README.md
```

---

## 4. REST API v1 Endpoints

The backend exposes versioned REST APIs under `/api/v1/`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health/` | `GET` | System health check, DB status, and ingestion telemetry |
| `/api/v1/feed/` | `GET` | "For You" personalized / high-signal intelligence feed |
| `/api/v1/articles/` | `GET` | Filter articles by category, tech, source, event_type, importance |
| `/api/v1/articles/<slug>/` | `GET` | Full structured article analysis (24 analytical points) |
| `/api/v1/briefing/` | `GET` | Executive daily briefing for today |
| `/api/v1/security/` | `GET` | Security advisories and CVEs with severity filters |
| `/api/v1/repositories/` | `GET` | Open-source tools with language and star metrics |
| `/api/v1/technologies/` | `GET` | Tech hubs (React, Next.js, Python, Rust, etc.) |
| `/api/v1/search/?q=<query>` | `GET` | Multi-index global search across all entities |
| `/api/v1/bookmarks/` | `GET/POST`| Personal reading vault bookmark management |
| `/api/v1/ingest/` | `POST` | Trigger source ingestion (all or single source) |
| `/api/v1/docs/` | `GET` | Interactive Swagger API documentation |

---

## 5. Getting Started (Local Development)

### Prerequisites
- Python 3.12+ (or `uv`)
- Node.js 20+ and npm

### 1. Clone & Set Up Backend
```bash
cd backend

# Create virtualenv and install dependencies
uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install django djangorestframework django-cors-headers feedparser beautifulsoup4 httpx pydantic python-dateutil drf-spectacular

# Run database migrations
python manage.py migrate

# Seed baseline categories, technologies, and verified sources
python manage.py seed_devpulse

# Ingest live real technology news and CVEs
python manage.py run_ingestion

# Start backend server on port 8001
python manage.py runserver 0.0.0.0:8001
```

### 2. Set Up Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server on port 3000
npm run dev -- -p 3000
```

Open `http://localhost:3000` in your browser.

---

## 6. Running Tests & Quality Checks

### Backend Automated Test Suite
```bash
cd backend
python manage.py test
```
*Output: 23/23 automated tests passed covering intelligence schema validation, CVE detection, security advisories filtering, open-source repository explorer, authentication lifecycle, profile preferences, bookmark user data isolation, SSRF security defenses, URL normalization, and global multi-index search.*

### Frontend Linting, Typecheck & Production Build
```bash
cd frontend
npm run lint
npm run build
```
*Output: Next.js Turbopack compilation succeeded with 0 errors across all 21 static and dynamic routes (including Home, Live, AI, Frameworks, Security, OSS, Briefings, Article Detail, Tech Hubs, Admin Dashboard, About, Contact, Sitemap, Robots).*

---

## 7. Docker Deployment

Launch the complete full-stack platform using Docker Compose:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Admin Telemetry & Operations: `http://localhost:3000/admin-dashboard`
- Backend API: `http://localhost:8001/api/v1/`
- API Interactive Docs: `http://localhost:8001/api/v1/docs/`
- System Health Check: `http://localhost:8001/api/v1/health/`

---

## 8. License

Distributed under the MIT License.

