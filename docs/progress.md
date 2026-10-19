# Progress

Current task: 0.3 Env + config

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

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
