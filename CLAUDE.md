# Wellspring Care Platform - Claude Code rules

Faith-based chaplaincy, pastoral care, renewal programs, weddings, funerals and events. Pastoral care only: not a medical, mental-health or emergency provider.
Stack: Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui, Lucide, React Hook Form + zod, MongoDB Atlas (official `mongodb` driver, no Mongoose), Auth.js, Stripe, Resend, Vitest, Playwright. Exact versions: `docs/adr/001-versions.md`.

## Session discipline (read first, follow strictly)

1. One session = one task from `docs/PLAN.md`. Start by reading `docs/progress.md` to find the current task. Never start a second task in the same session.
2. Read `docs/MAP.md` (codebase map, max 60 lines) instead of exploring. Open only files the task or MAP names.
3. Read only the `docs/PRD.md` section(s) the task cites (e.g. `PRD §6.3`). Locate with `rg -n "^## |^### " docs/PRD.md`, then read by line range. Never read the whole PRD.
4. Never open or search: `node_modules/`, `.next/`, `coverage/`, `playwright-report/`, `test-results/`, `*.lock`, `package-lock.json`, images, fonts. Scope every `rg` to `src/`, `test/`, `scripts/` or `docs/`.
5. Files over ~200 lines: read by line range. Do not re-read a file you just edited.
6. Verification per task: `npm run typecheck`, `npx eslint <touched files>`, `npx vitest run <task test paths> --reporter=dot`. Pipe long output through `tail -n 60`.
   `next build`, the full test suite and Playwright run only on tasks marked `GATE`.
7. Dev server only if the task says so: start it in the background, check, then kill it. Never leave it running or tail its logs.
8. Stop conditions:
   - Acceptance checks pass: update `docs/progress.md` and `docs/MAP.md`, commit, STOP, print a 5-line summary.
   - Same failure after 3 fix attempts: STOP, record the blocker in `docs/progress.md`, report. No further variations.
   - Task needs more than ~6 files or ~400 changed lines: STOP and propose a split.
9. No subagents, no parallel exploration, no "survey the codebase" passes.
10. Web research only on tasks marked `RESEARCH`. Cap: 5 fetches per decision. Record an ADR in `docs/adr/` (max 40 lines) and stop.
11. Install only dependencies named in `docs/adr/001-versions.md`. Ask before adding anything else. `npx shadcn add <component>` is allowed.
12. `docs/progress.md`: max 12 lines per entry (task, done, files, tests with real results, open issues). Keep the last 5; collapse older ones to one line.
13. Never report a test as passing unless it ran in this session and you saw it pass. Never mark a feature done if it is UI without working backend behavior.

## Invariants (never violate; details in PRD §13)

- Every DB access goes through `src/server/data/` repositories that take an `AuthContext` and scope queries by owner or role. No raw collection access in routes, actions or components. MongoDB has no RLS: this layer IS the authorization boundary.
- Server-side authz on every sensitive read and write (`requireUser`, `requireCapability`). Never rely on hidden UI.
- `private_reflections`, `pastoral_notes` and prayer request text are field-encrypted (`src/server/crypto/field.ts`). Reflections are readable only by their owner, never by admins.
- No sensitive content in URLs, query strings, analytics, email subjects or bodies, or logs. Logs and `audit_logs.meta` use allowlisted fields only.
- Payment status comes only from verified Stripe webhooks. Never trust the client.
- Secrets only in env. `MONGODB_URI`, `STRIPE_SECRET_KEY`, `FIELD_ENC_KEY` are server-only (`import "server-only"`).
- No fake testimonials, credentials, endorsements, or "configured" integrations. Missing keys = visible "not configured" state.
- Never weaken a check to make a test pass.

## Commands

`npm run dev` - `npm run typecheck` - `npx vitest run <path> --reporter=dot` - `npm run db:ensure` (indexes + validators) - `npm run db:seed` (fictional dev data) - `npm run test:e2e` (GATE only)

## Layout

`src/app/(public)` site - `src/app/(portal)` client + participant - `src/app/(staff)` admin, facilitator, provider - `src/app/api` route handlers - `src/server/` (auth, data, crypto, email, payments, audit) - `src/domain/` (pure logic: status machines, pricing, scheduling) - `src/components/` - `src/content/` - `scripts/` - `test/` - `docs/`
