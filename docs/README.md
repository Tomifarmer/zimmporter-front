# Zimmporter Front

Web interface for the Zimmporter music import API. Built with Next.js 16, TypeScript, PrimeReact, and TanStack Query.

## Stack

| Package | Version |
|---------|---------|
| Next.js | 16.2.11 |
| React | 19.2.8 |
| TypeScript | ^6.0.3 |
| PrimeReact | ^10.9.8 |
| TanStack Query | ^5.101.4 |
| Axios | ^1.18.1 |
| NextAuth | ^5.0.0-beta.32 |
| Bootstrap | ^5.3.8 |
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
| `GITHUB_CLIENT_ID` | No | `""` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | No | `""` | GitHub OAuth App client secret |
| `AUTH_SECRET` | No | `"dev-secret-change-in-production"` | NextAuth encryption secret (generate with `openssl rand -base64 32`) |

`USE_SOCIAL_LOGIN` and `USE_SIMPLE_AUTH` cannot both be `true`; the app shows an error overlay if both are enabled.

If `API_URL` is set to a value that does not start with `http://` or `https://`, the server logs an error and exits with code 1 at startup.

Set in `.env.local` for local development, or via container environment at runtime.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — system health cards, job stats, recent jobs |
| `/search` | Search YouTube Music for albums, featured playlists, or community playlists — multi-select, batch download |
| `/jobs` | Paginated jobs list with progress bars |
| `/jobs/[id]` | Job detail — live polling (3s), songs table |
| `/settings` | YouTube cookies management — upload cookies file for age-restricted downloads |

### Dashboard (`/`)

- Health status cards for API, Redis, Celery, and MariaDB
- Job overview stats: total jobs, running jobs, last job status
- Recent jobs list with clickable links to job detail
- Auto-refreshes health every 10s, jobs every 5s

### Search (`/search`)

- Search input (Enter to submit), auto-focused on page load
- Typing anywhere on the page (when not focused on another input) starts or refines the query; Backspace deletes from it
- Albums / Featured Playlists / Community Playlists type selector
- Multi-select results with checkboxes
- Green `pi-check-circle` badge on covers of albums/playlists already in the library (`available` flag from the API)
- Concurrent downloads slider (1–32, default 4)
- Select All toggle button
- Download Selected button sends `POST /download/album` or `/download/playlist`
- Redirects to job detail page on success

### Jobs (`/jobs`)

- Paginated table (20 jobs per page)
- Interactive status-pill toolbar (Total / Running / Completed / Partial / Failed) — each pill is a filter button showing a colored dot and live count
- Each row shows job ID, type, progress bar, status badge, timestamp
- Click arrow to expand message and error details inline
- Auto-refreshes every 5s

### Settings (`/settings`)

- YouTube cookies status card: badge (Configured / Not configured / Stale), cookie count, domains, last-updated timestamp
- Upload a Netscape-format cookies file (`.txt`, `.cookies`, `.tidycookies`) via `POST /cookies`; upload errors shown inline
- A stale-cookie warning banner appears at the top of every page (amber, `role="alert"`, re-checked every 60s) linking to this page

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
    build.yml                 # GitHub Actions: test + build + push to GHCR
src/
  proxy.ts                    # Next.js 16 middleware; redirects to /login when USE_SOCIAL_LOGIN=true
  app/
    layout.tsx                # Root layout, wraps Providers, injects runtime config
    globals.css               # CSS imports
    not-found.tsx             # Custom 404 page
    (app)/
      layout.tsx              # App layout — Header, LightfallBackground, PageContainer, Footer, overlays, stale-cookie banner
      page.tsx                # Dashboard page
      search/page.tsx         # Search page
      jobs/page.tsx           # Jobs list page
      jobs/[id]/page.tsx      # Job detail page
      settings/page.tsx       # Settings page (YouTube cookies)
    (auth)/
      layout.tsx              # Auth layout (bare, no header)
      login/page.tsx          # Login page (server)
      login/client.tsx        # Login page client component
    api/
      config/route.ts         # Runtime config endpoint (reads API_URL, API_KEY from server env)
      auth/[...nextauth]/route.ts  # NextAuth v5 route handler
  components/
    Header/                   # Navigation bar (brand, nav links, health dots, avatar)
    Footer/                   # Sticky footer with version
    HealthCard/               # Health status card
    JobRow/                   # Jobs list row with expand
    Lightfall/                # Lightfall animation component
    LightfallBackground/      # Full-page animated background
    PageContainer/            # Constrained page width wrapper
    StatusBadge/              # Color-coded status pill
    ApiKeyErrorOverlay.tsx    # Full-page overlay when API key required but missing
    AuthConflictOverlay.tsx   # Full-page overlay when both USE_SOCIAL_LOGIN and USE_SIMPLE_AUTH are true
    SocialLoginErrorOverlay.tsx  # Full-page overlay when social login required but no session
    CookieManager.tsx         # Settings card — upload the yt-dlp cookies file (GET/POST /cookies)
    CookieStaleBanner.tsx     # Warning banner when the backend flags cookies as stale
  hooks/
    useJobPolling.ts          # Polling hook (3s while pending/running)
  lib/
    api.ts                    # Axios instance, auth interceptors (X-API-Key + Bearer)
    auth.ts                   # NextAuth v5 config — OIDC + GitHub providers
    config.ts                 # RuntimeConfig type with useSocialLogin, useSimpleAuth, apiUrl, apiKey
  providers/
    auth-provider.tsx         # SessionProvider wrapper (conditionally enabled)
    query-provider.tsx        # TanStack Query provider
  types/
    api.ts                    # TypeScript interfaces for all API models
    next-auth.d.ts            # NextAuth type augmentation (accessToken on session)
  config/
    colors.ts                 # Shared color constants
    version.ts                # App version from package.json
  __tests__/                  # Vitest test suite
```

### Proxy Middleware (`src/proxy.ts`)

Next.js 16 middleware. When `USE_SOCIAL_LOGIN=true`, redirects unauthenticated users to `/login` for all routes except `/api/auth/*` and `/login`.

### API Client (`src/lib/api.ts`)

- Axios instance fetches runtime config from `/api/config` (reads `API_URL` / `API_KEY` from server env)
- Request interceptor adds `X-API-Key` header when `USE_SIMPLE_AUTH=true` and `API_KEY` is set
- Request interceptor adds `Authorization: Bearer` header when an access token is available
- Response interceptor detects 401 errors and triggers full-page overlays for missing API key or social login session

### Auth (`src/lib/auth.ts`)

NextAuth v5 configuration supporting:
- **OIDC** — any OpenID Connect provider (Google, etc.)
- **GitHub** — GitHub OAuth App
- JWT strategy with `accessToken` passthrough and `picture` propagation from user profile to session

### Job Polling (`src/hooks/useJobPolling.ts`)

- Uses TanStack Query `refetchInterval` callback
- Polls every 3s while `status ∈ {pending, running}`
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

- **SearchResult** — album/playlist/item from search (includes `available?: boolean` flag)
- **SearchResponse** — array of search results
- **DownloadRequest** — id and concurrent fields
- **JobResponse** — job_id and status
- **JobStatusResponse** — full job with embedded songs
- **Song** — per-song status and metadata
- **HealthResponse** — component health status
- **CookieStatus** — cookies file metadata (`exists`, `size`, `cookie_count`, `domains`, `modified_at`, `is_stale`)
