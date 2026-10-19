# Progress

Current task: 0.5 Authz core

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 0.4 Mongo client + ensure script - done 2026-10-19
- Done: `src/server/db.ts` (server-only) `getClient()`/`getDb()` cached on `globalThis` (connect promise reset on failure). `src/server/data/schemas/system.ts`: zod schema + hand-written `$jsonSchema` (strict, `additionalProperties: false`) for `organization_settings` (singleton via `key: "default"` + unique index), `audit_logs`, `rate_limits` (TTL `expiresAt`, unique key+window). `src/server/data/registry.ts`: `collections` + `ensureCollections(db)` (createCollection or collMod, named indexes). `scripts/db-ensure.ts` reads only MONGODB_URI/MONGODB_DB; `db:ensure` loads `.env.local` if present.
- Files: src/server/db.ts, src/server/data/{registry.ts,schemas/system.ts}, scripts/db-ensure.ts, test/helpers/mongo.ts, test/db-ensure.test.ts, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/db-ensure.test.ts` 4/4 pass (ensure x2 idempotent, TTL, valid insert ok, invalid + duplicate singleton rejected); config+smoke 8/8. Script without URI exits 1 (imports resolve under Node).
- Open: zod and `$jsonSchema` are maintained by hand side by side (no generator); keep in step. Script not run against a real Atlas/local mongod. mongodb-memory-server downloaded MongoDB 8.2.6 on first run (~77 MB, cached).

## 0.3 Env + config - done 2026-10-19
- Done: `src/server/config.ts` (`import "server-only"`): zod schema for every `.env.example` key; "" treated as unset; required MONGODB_URI (mongodb[+srv]://), AUTH_SECRET (>=32 chars), FIELD_ENC_KEY (base64, 32 bytes); defaults APP_URL/MONGODB_DB/FIELD_ENC_KID. `parseConfig(env)` pure, `getConfig()` cached from process.env. `integrations.{stripe,email,googleCalendar}` true only when all their keys set. `ConfigError` lists key names only, never values.
- Vitest aliases `server-only` to `test/helpers/server-only.ts` (real package throws outside RSC builds).
- Files: src/server/config.ts, test/config.test.ts, test/helpers/server-only.ts, vitest.config.ts, docs/MAP.md, docs/progress.md.
- Tests: typecheck pass; eslint clean; `npx vitest run test/config.test.ts test/smoke.test.ts` 8/8 pass.
- Open: config not yet called at boot (first consumer: 0.4 `getDb()`). Stripe needs all 3 keys incl. publishable to count as configured.

## 0.2 RESEARCH Pin versions - done 2026-10-19
- Done: versions from npm registry (dist-tags + peers), all pinned exact; `docs/adr/001-versions.md` written. Installed zod, RHF, resolvers, mongodb, next-auth v5 beta, adapter, stripe, resend, react-email, date-fns(+tz), lucide-react, server-only; dev shadcn, mongodb-memory-server. react 19.3.0 -> 19.3.1.
- Deviations: mongodb 6.21.0 not 7.7.0 (adapter peers ^6). `react-email@6.11.3` replaces deprecated `@react-email/components` (PLAN named the old package). TS 5.9.3 / ESLint 9.39.5 held (TS 7, ESLint 10 out).
- Files: package.json, package-lock.json, docs/adr/001-versions.md, docs/MAP.md, docs/progress.md.
- Tests: `npm ls` no peer errors; typecheck pass; eslint clean; `npx vitest run test/smoke.test.ts` 1/1 pass; `npm audit --omit=dev` 0.
- Open: Auth.js v5 still beta, maintenance-only (risk in ADR). 9 high dev-only audit warnings. mongodb-memory-server postinstall blocked: binary downloads on first use (0.4).

## 0.1 Scaffold - done 2026-10-19
- Done: create-next-app@latest (next 16.4.2, react 19.3.0, TS strict, App Router, Tailwind v4, ESLint flat, `src/`), scaffolded in scratch dir and written into repo. Scripts typecheck/test/test:e2e/db:ensure/db:seed; Vitest + Playwright configs; folder layout with .gitkeep; `.env.example`; `.gitignore` (+ `!.env.example`, Playwright dirs); home moved to `(public)`; Geist Google font removed (system font until ADR 002).
- Installed beyond scaffold: vitest 5.0.5, @playwright/test 1.64.1 (needed for smoke test; 0.2 pins). @types/node bumped ^20 -> ^24 (vitest 5 peer range).
- Files: package.json, tsconfig.json, eslint.config.mjs, next.config.ts, vitest.config.ts, playwright.config.ts, .gitignore, .env.example, src/app/{layout.tsx,globals.css,(public)/page.tsx,favicon.ico}, scripts/db-*.ts, test/smoke.test.ts, docs/MAP.md.
- Tests: `npm run typecheck` pass; `npx eslint src test scripts vitest.config.ts playwright.config.ts` clean; `npx vitest run test/smoke.test.ts` 1/1 pass.
- Open: create-next-app's AGENTS.md not added (it tells agents to read node_modules, conflicts with CLAUDE.md rule 4); `next dev` may regenerate it, decide whether to commit or gitignore. npm blocked install scripts for unrs-resolver and fsevents (allowScripts); harmless so far. 5 high npm audit warnings from scaffold, not reviewed. `.claude/settings.json` unchanged.
