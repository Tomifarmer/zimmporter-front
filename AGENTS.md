# Zimmporter Frontend — Agent Notes

## Stack
Next.js 16 (App Router), React 19, TypeScript, PrimeReact + Bootstrap, React Query, axios.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (no test or typecheck scripts) |

No test framework is configured. Don't look for one.

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
