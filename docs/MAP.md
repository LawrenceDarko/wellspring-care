# Codebase map

Max 60 lines. Each task updates this instead of future tasks exploring. One line per key module: path - purpose - main exports.

## Root config
- `package.json` - all deps pinned exact per `docs/adr/001-versions.md`. Scripts: dev, build, typecheck (`next typegen && tsc --noEmit`), test, test:e2e, db:ensure, db:seed. `"type": "module"`.
- `next.config.ts` - Next 16 (cacheComponents, partialPrefetching, Tailwind via turbopack loader).
- `tsconfig.json` - strict, `@/*` -> `src/*`, `allowImportingTsExtensions` (scripts run via Node type stripping).
- `eslint.config.mjs` - flat config, next core-web-vitals + typescript.
- `vitest.config.ts` - node env; includes `test/**/*.test.ts`, `src/**/*.test.ts`; excludes `test/e2e`; `@` alias; `server-only` -> stub.
- `playwright.config.ts` - testDir `test/e2e`, chromium + mobile, webServer `npm run dev` (GATE only).
- `.env.example` - every env var with comments (PRD §17).

## src/
- `src/app/layout.tsx` - root layout; exports `metadata`. System font (fonts decided in ADR 002).
- `src/app/globals.css` - Tailwind v4 import + color tokens.
- `src/app/(public)/page.tsx` - placeholder home with pastoral-care-only notice.
- `src/app/(portal)/`, `src/app/(staff)/`, `src/app/api/` - empty (.gitkeep).
- `src/server/config.ts` - server-only zod env validation. Exports `parseConfig(env)`, `getConfig()` (cached), `ConfigError`, types `Env`, `Config` (`env`, `integrations.{stripe,email,googleCalendar}`).
- `src/server/{auth,data,crypto,email,payments,audit}/` - empty (.gitkeep).
- `src/domain/`, `src/components/`, `src/content/` - empty (.gitkeep).

## scripts/
- `scripts/db-ensure.ts`, `scripts/db-seed.ts` - stubs, exit 1 "not implemented yet".

## test/
- `test/smoke.test.ts` - alias + metadata smoke test.
- `test/config.test.ts` - config parsing, integration booleans, required-key errors.
- `test/helpers/server-only.ts` - empty stub; vitest aliases `server-only` to it.
- `test/e2e/` - Playwright specs (empty).
