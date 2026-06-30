# AGENTS.md — TRIBIA 2026

## Commands

```bash
npm run dev          # dev server
npm run build        # prod build → dist/
npm run preview      # preview prod build locally
```

No lint, typecheck, or test commands exist in this repo.

## Architecture

- React 18 SPA, built with Vite 5, deployed to **GitHub Pages** at base path `/TRIBIA-2026-ANTUNEZ/`.
- **Supabase is optional.** The app degrades gracefully to localStorage-only mode when env vars aren't set. Always guard Supabase calls behind `isSupabaseConfigured` (`src/lib/supabase.js:10`).
- No auth. RLS is fully open — this is a family-trust app.

## Key environment vars (`.env.local`, not committed)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_ADMIN_PIN=1234
```

All client-side env vars **must** use the `VITE_` prefix.

## Data model (critical)

- **Match fixtures** are versioned in **code** (`src/data/matches.js`), NOT in Supabase. `match_id` is a logical reference (e.g. `"A1"`, `"R1"`); there's no DB-level FK to a matches table.
- **Dynamic data** (users, predictions, match_results) lives in Supabase tables. Schema: `supabase-schema.sql`.
- The merger happens in `useStore.getAllMatches()` (`src/store/index.js:174`): code fixtures + result overrides + team-name overrides.
- **All kickoff times are UTC.** `src/utils/scoring.js` converts to the browser's local timezone via `Intl.DateTimeFormat` — never hardcode offsets.

## Scoring

- Exact score: 3 pts
- Correct winner/empate (wrong score): 1 pt
- Implemented in `src/utils/scoring.js`.

## Zustand store (`src/store/index.js`)

- localStorage key: `tribia-2026-storage`.
- When Supabase IS configured, only `currentUserId` + `matchUpdates` are persisted locally; all other data comes from Supabase.
- When Supabase is NOT configured, everything persists to localStorage.
- Realtime subscriptions listen on all 3 tables (`users`, `predictions`, `match_results`) and trigger full re-sync on any change.

## Live scores (auto-polling)

- `src/hooks/useLiveScores.js` polls the free **ESPN API** (no key needed) every 90s for live/finished scores.
- A separate 10-minute poll checks for **R32 team updates** — when group-stage ends, placeholder names like `"1A"` get replaced with real team names from ESPN.
- Team name mapping (ES ↔ EN) lives in `src/lib/footballData.js:8-73`.

## Seed script

```bash
node scripts/seed-users.mjs
```

Requires `.env.local` with Supabase credentials. Uses PostgREST directly (fetch, no Supabase SDK) to avoid WebSocket issues in Node < 22.

## Database setup

1. Run `supabase-schema.sql` in Supabase SQL Editor (creates tables, indexes, RLS policies).
2. If upgrading an existing DB, also run `supabase-migration-penalties.sql` (adds penalty columns).
3. Optionally seed users: `node scripts/seed-users.mjs`.

## Deploy

Push to `main` → GitHub Actions builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). Build step injects Supabase secrets from repo settings.
