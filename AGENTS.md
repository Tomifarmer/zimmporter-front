# Zimmporter Frontend — Agent Notes

## Stack
Next.js 16 (App Router), React 19, TypeScript, PrimeReact + Bootstrap, React Query, axios.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
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
- `src/app/` — App Router pages (`page.tsx`, `/jobs`, `/search`)
- `src/components/` — shared UI components
- `src/lib/api.ts` — single axios client; all API calls go through here
- `src/hooks/useJobPolling.ts` — polls job status every 3s while pending/running
- `src/providers/query-provider.tsx` — React Query wrapper (all pages are inside it)
- `src/types/api.ts` — shared TypeScript types for API responses

Path alias: `@/*` maps to `src/*`.

## Environment Variables
Set in `.env.local` or docker-compose:
- `NEXT_PUBLIC_API_URL` — backend address (default `http://localhost:8000`)
- `NEXT_PUBLIC_API_KEY` — optional API key sent as `X-API-Key` header

Backend sibling repo: `../zimmporter-api`.

## Docker
- `next.config.ts` sets `output: "standalone"` — Dockerfile uses multi-stage build, copies `.next/standalone` for a minimal production image.
- Runtime image runs `node server.js` on port 3000.
