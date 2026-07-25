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
| Tailwind CSS | 4 |
| PrimeIcons | 8.0.0 |

## Quick Start

```bash
cp .env.example .env.local
# Edit .env.local with your API_KEY if auth is enabled
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
npm run lint   # type-check + lint
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_API_KEY` | No | `""` | API key (passed as `X-API-Key` header) |

Set in `.env.local` for local development, baked in at build time.

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
src/
  app/
    layout.tsx              # Server root layout, wraps ClientLayout
    page.tsx                # Dashboard page
    search/page.tsx         # Search page
    jobs/page.tsx           # Jobs list page
    jobs/[id]/page.tsx      # Job detail page
    globals.css             # Tailwind CSS imports
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

- Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL`
- Adds `X-API-Key` header from `NEXT_PUBLIC_API_KEY` if set
- Response interceptor normalizes error messages

### Job Polling (`src/hooks/useJobPolling.ts`)

- Uses TanStack Query `refetchInterval` callback
- Polls every 3s while `status \u2208 {pending, running}`
- Stops automatically when job completes or fails

## Docker Build

Multi-stage Dockerfile produces a standalone Next.js production build:

```bash
docker build -t zimmporter-front .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:8000 zimmporter-front
```

Or combined with the backend:

```bash
# From the repo root, merge both docker-compose files
docker compose -f zimmporter-api/docker-compose.yml -f zimmporter-front/docker-compose.yml up
```

The frontend is served on port `3000`, the API on port `8000`.

## API Models

All types defined in `src/types/api.ts`:

- **SearchResult** \u2014 album/playlist/item from search
- **SearchResponse** \u2014 array of search results
- **DownloadRequest** \u2014 id and concurrent fields
- **JobResponse** \u2014 job_id and status
- **JobStatusResponse** \u2014 full job with embedded songs
- **Song** \u2014 per-song status and metadata
- **HealthResponse** \u2014 component health status
