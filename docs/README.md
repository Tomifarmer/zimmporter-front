# Zimmporter Front

Web interface for the Zimmporter music import API. Built with Next.js 15, TypeScript, PrimeReact, and TanStack Query.

## Stack

| Package | Version |
|---------|---------|
| Next.js | 15.5.6 |
| React | 19.1.0 |
| TypeScript | 5 |
| PrimeReact | 10.9.8 |
| TanStack Query | 5.101.2 |
| Axios | 1.18.1 |
| PrimeIcons | 8.0.0 |

## Quick Start

```bash
cp .env.example .env.local
# Edit .env.local to configure auth (USE_SOCIAL_LOGIN, USE_SIMPLE_AUTH, API_KEY, etc.)
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
npm run lint   # biome check (lint + format + imports)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | No | `http://localhost:8000` | Backend API base URL (read at runtime via `/api/config`) |
| `API_KEY` | No | `""` | API key sent as `X-API-Key` header when `USE_SIMPLE_AUTH=true` |
| `USE_SOCIAL_LOGIN` | No | `false` | Enable social login (OIDC/GitHub) via NextAuth; proxy redirects to `/login` |
| `USE_SIMPLE_AUTH` | No | `false` | Enable API key auth; sends `X-API-Key` header to backend |
| `OIDC_NAME` | No | `"OIDC"` | Display name for the OIDC provider on the login button |
| `OIDC_ISSUER_URL` | No | `""` | OIDC issuer URL (e.g. `https://accounts.google.com`) |
| `OIDC_CLIENT_ID` | No | `""` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | No | `""` | OIDC client secret |
| `AUTH_SECRET` | No | `"dev-secret-change-in-production"` | NextAuth encryption secret (generate with `openssl rand -base64 32`) |

`USE_SOCIAL_LOGIN` and `USE_SIMPLE_AUTH` cannot both be `true`; the app shows an error overlay if both are enabled.

Set in `.env.local` for local development, or via container environment at runtime.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — system health cards, job stats, recent jobs |
| `/search` | Search YouTube Music for albums/playlists, multi-select, batch download |
| `/jobs` | Paginated jobs list with progress bars |
| `/jobs/[id]` | Job detail — live polling (3s), songs table |

### Dashboard (`/`)

- Health status cards for API, Redis, Celery, and MariaDB
- Job overview stats: total jobs, running jobs, last job status
- Recent jobs list with clickable links to job detail
- Auto-refreshes health every 10s, jobs every 5s

### Search (`/search`)

- Search input (Enter to submit)
- Albums / Playlists toggle
- Multi-select results with checkboxes
- Concurrent downloads slider (1\u201332, default 4)
- Select All toggle button
- Download Selected button sends `POST /download/album` or `/download/playlist`
- Redirects to job detail page on success

### Jobs (`/jobs`)

- Paginated table (20 jobs per page)
- Each row shows job ID, type, progress bar, status badge, timestamp
- Click arrow to expand message and error details inline
- Auto-refreshes every 5s

### Job Detail (`/jobs/[id]`)

- Job metadata: type, current album, album progress, songs count
- Progress bar (color reflects status: blue=running, green=success, red=failed)
- Message and error display
- Songs table with track number, title, artist, status, s3 path, error
- Auto-polls `GET /jobs/{id}` every 3s while status is `pending` or `running`
- Stops polling on `success` or `failed`

## Architecture

```
.github/
  workflows/
    build.yml               # GitHub Actions: test + build + push to GHCR
src/
  app/
    layout.tsx              # Server root layout, wraps ClientLayout
    page.tsx                # Dashboard page
    search/page.tsx         # Search page
    jobs/page.tsx           # Jobs list page
    jobs/[id]/page.tsx      # Job detail page
    globals.css             # CSS imports
  components/
    Header.tsx              # Navigation bar
    StatusBadge.tsx         # Color-coded status pill
    HealthCard.tsx          # Health status card
  hooks/
    useJobPolling.ts        # Polling hook (3s while running)
  lib/
    api.ts                  # Axios instance, auth interceptor
  providers/
    client-layout.tsx       # PrimeReactProvider, QueryClientProvider, Header
    query-provider.tsx      # TanStack Query client setup
  types/
    api.ts                  # TypeScript interfaces for all API models
```

### API Client (`src/lib/api.ts`)

- Axios instance fetches runtime config from `/api/config` (reads `API_URL` / `API_KEY` from server env)
- Request interceptor adds `X-API-Key` header when `USE_SIMPLE_AUTH=true` and `API_KEY` is set
- Request interceptor adds `Authorization: Bearer` header when an access token is available
- Response interceptor detects 401 errors and triggers full-page overlays for missing API key or social login session

### Job Polling (`src/hooks/useJobPolling.ts`)

- Uses TanStack Query `refetchInterval` callback
- Polls every 3s while `status \u2208 {pending, running}`
- Stops automatically when job completes or fails

## Docker Build

Multi-stage Dockerfile produces a standalone Next.js production build:

```bash
docker build -t zimmporter-front .
docker run -p 3000:3000 -e API_URL=http://api:8000 zimmporter-front
```

Or combined with the backend:

```bash
# From the repo root, merge both docker-compose files
docker compose -f zimmporter-api/docker-compose.yml -f zimmporter-front/docker-compose.yml up
```

The frontend is served on port `3000`, the API on port `8000`.

## CI

GitHub Actions workflow at `.github/workflows/build.yml`:

| Event | Tests | Build | Push image | Trivy scan |
|---|---|---|---|---|
| Push `main` | ✅ | — | — | — |
| Push `feature/*` | ✅ | ✅ | `feature-*` | — |
| Push tag `v*` | ✅ | ✅ | `latest`, semver | ✅ |
| PR to `main` | ✅ | — | — | — |

The `test` job runs `npm ci && npm run lint && npm test` on every trigger. The `build` job is gated to only build on tag or `feature/*` pushes; the `latest` and semver tags are only pushed on version tags, never from feature branches.

## API Models

All types defined in `src/types/api.ts`:

- **SearchResult** \u2014 album/playlist/item from search
- **SearchResponse** \u2014 array of search results
- **DownloadRequest** \u2014 id and concurrent fields
- **JobResponse** \u2014 job_id and status
- **JobStatusResponse** \u2014 full job with embedded songs
- **Song** \u2014 per-song status and metadata
- **HealthResponse** \u2014 component health status
