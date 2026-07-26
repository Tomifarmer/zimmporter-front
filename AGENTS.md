# Zimmporter Frontend — Agent Notes

## Stack
Next.js 16 (App Router), React 19, TypeScript, PrimeReact + Bootstrap, React Query, axios.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | Biome check (lint + format + imports) |
| `npm run format` | Biome format --write |
| `npm run lint:fix` | Biome check --write |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest (watch mode) |
| `npm run test:coverage` | Vitest with coverage |

## Tests
- **Framework:** Vitest + React Testing Library + jsdom
- **API mocking:** `src/lib/api.ts` is auto-mocked via `vi.mock` in `src/__tests__/helpers/api-mock.ts`
- **Mock factories:** `src/__tests__/helpers/factories.ts` provides builders for `SearchResult`, `JobStatusResponse`, `Song`
- **Page tests** require a `QueryClient` wrapper — see existing page tests for pattern
- **Dynamic imports** (e.g., `next/dynamic` for PrimeReact Dropdown) are mocked in page test files as needed

## Project Structure
- `src/proxy.ts` — Next.js 16 proxy; redirects unauthenticated users to `/login` when `USE_SOCIAL_LOGIN=true`
- `src/app/api/config/route.ts` — runtime config endpoint (reads `API_URL` and `API_KEY` from server env)
- `src/app/` — App Router pages (`(app)/page.tsx`, `(app)/search/`, `(app)/jobs/`, `(auth)/login/`)
- `src/components/ApiKeyErrorOverlay.tsx` — full-page overlay when backend requires API key but none configured
- `src/components/SocialLoginErrorOverlay.tsx` — full-page overlay when backend requires auth but no session active
- `src/components/AuthConflictOverlay.tsx` — full-page overlay when both `USE_SOCIAL_LOGIN` and `USE_SIMPLE_AUTH` are enabled
- `src/lib/api.ts` — single axios client; auth interceptors for `X-API-Key` and Bearer token
- `src/lib/auth.ts` — NextAuth v5 config; OIDC/GitHub providers, JWT/session image passthrough
- `src/lib/config.ts` — `RuntimeConfig` type with `useSocialLogin`, `useSimpleAuth`, `apiUrl`, `apiKey`
- `src/hooks/useJobPolling.ts` — polls job status every 3s while pending/running
- `src/providers/auth-provider.tsx` — wraps children in `SessionProvider` when `useSocialLogin` prop is true
- `src/providers/query-provider.tsx` — React Query wrapper (all pages are inside it)
- `src/types/api.ts` — shared TypeScript types for API responses

Path alias: `@/*` maps to `src/*`.

## Environment Variables
Set in `.env.local` or container environment at runtime.

| Variable | Default | Description |
|---|---|---|
| `API_URL` | `http://localhost:8000` | Backend API base URL (read at runtime via `GET /api/config`) |
| `API_KEY` | `""` | API key sent as `X-API-Key` header when `USE_SIMPLE_AUTH=true` |
| `USE_SOCIAL_LOGIN` | `false` | Enable social login (OIDC/GitHub) via NextAuth; proxy redirects to `/login` |
| `USE_SIMPLE_AUTH` | `false` | Enable API key auth; sends `X-API-Key` header to backend |
| `OIDC_NAME` | `"OIDC"` | Display name for the OIDC provider on the login button |
| `OIDC_ISSUER_URL` | `""` | OIDC issuer URL (e.g. `https://accounts.google.com`) |
| `OIDC_CLIENT_ID` | `""` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | `""` | OIDC client secret |
| `GITHUB_CLIENT_ID` | `""` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | `""` | GitHub OAuth App client secret |
| `AUTH_SECRET` | `"dev-secret-change-in-production"` | NextAuth encryption secret (generate with `openssl rand -base64 32`) |

`USE_SOCIAL_LOGIN` and `USE_SIMPLE_AUTH` cannot both be `true`; the app shows an error overlay if both are enabled.

Backend sibling repo: `../zimmporter-api`.

Backend sibling repo: `../zimmporter-api`.

## Docker
- `next.config.ts` sets `output: "standalone"` — Dockerfile uses multi-stage build, copies `.next/standalone` for a minimal production image.
- Runtime image runs `node server.js` on port 3000.
