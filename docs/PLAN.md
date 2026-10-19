# Build Plan

Rules: one task per session (CLAUDE.md). Each task: cites PRD sections, lists files it may touch, has acceptance checks. Only Phases 0-1 are broken into tasks now; the last task of each phase writes the next phase's tasks (max 10 tasks, each <= 6 files / ~400 lines).
Markers: `RESEARCH` = web lookups allowed (cap 5). `GATE` = full suite, `next build`, Playwright.

## Phase 0 - Foundations

- **0.1 Scaffold** - PRD §17. `create-next-app` (TS strict, App Router, Tailwind, ESLint, `src/`), add `typecheck` / `test` / `test:e2e` / `db:ensure` / `db:seed` scripts, Vitest config, Playwright config (not run), folder layout from CLAUDE.md, `.env.example`, `.gitignore`, `.claude/settings.json` kept as provided. Write `docs/MAP.md`.
  Accept: `npm run typecheck`, `npx eslint src`, one smoke vitest pass.

- **0.2 RESEARCH Pin versions** - Confirm current stable, mutually compatible: next, react, tailwindcss, shadcn CLI, zod, react-hook-form, @hookform/resolvers, mongodb driver, mongodb-memory-server, Auth.js (`next-auth` major and `@auth/mongodb-adapter`; if v5 still not stable, record the risk and pin the recommended version), stripe, resend, @react-email/components, date-fns + @date-fns/tz, lucide-react, vitest, @playwright/test. Write `docs/adr/001-versions.md` (table: package, version, why). Install them.
  Accept: ADR written; `npm ls` clean for listed packages; typecheck passes.

- **0.3 Env + config** - PRD §17. `src/server/config.ts` zod-validated env with integration booleans; `import "server-only"`. Test missing optional keys -> integration false; missing required -> throws.
  Accept: config tests pass.

- **0.4 Mongo client + ensure script** - PRD §3.1. Cached client for serverless (`globalThis`), `getDb()`, `scripts/db-ensure.ts` that applies validators + indexes from a registry (start with `organization_settings`, `audit_logs`, `rate_limits` TTL). Test helper `test/helpers/mongo.ts` with `MongoMemoryReplSet`.
  Accept: test runs ensure twice (idempotent) and inserts a valid doc, rejects an invalid one.

- **0.5 Authz core** - PRD §2, §13.1. `src/server/auth/capabilities.ts` (role -> capability map), `AuthContext` type, `requireUser`, `requireCapability`, `src/server/data/base.ts` scoped-repository helper that refuses unscoped queries. Tests: capability resolution, multi-role union, super_admin lacks reflection read.
  Accept: tests pass.

- **0.6 Field encryption + audit + logger** - PRD §13.3, §13.6. `src/server/crypto/field.ts` (encrypt/decrypt, kid), `src/server/audit.ts`, `src/server/log.ts` with allowlist. Tests: round trip, tamper fails, wrong kid fails, stored doc has no plaintext, logger drops non-allowlisted keys.
  Accept: tests pass.

- **0.7 Auth.js wiring** - PRD §13.2, §14. Auth.js with MongoDB adapter, DB sessions, email provider using dev transport (`email_outbox`) when Resend absent, session callback attaches roles. Minimal `/sign-in` page and `/dev/outbox` (dev only, 404 in prod).
  Accept: integration test creates verification token and outbox entry; typecheck passes. Dev server check: sign-in page renders (start, curl, kill).

- **0.8 Rate limit + public-form guard** - PRD §13.5. `src/server/rate-limit.ts` (fixed window, TTL), `guardPublicForm()` (honeypot, min fill time, origin check). Tests for limit, reset, honeypot reject.
  Accept: tests pass.

- **0.9 GATE + plan Phase 2 detail check** - Full suite, `next build`, write any fixes as follow-up tasks rather than fixing large issues here. Record real results.
  Accept: results in progress.md.

## Phase 1 - Design system and public site

- **1.1 Design tokens + fonts** - PRD §4.4. Tokens in `globals.css` (light only for MVP), Tailwind mapping, two fonts via `next/font` (choose in ADR 002, max 15 lines, no research), shadcn init + button, card, input, label, textarea, select, dialog, badge, sheet. `/dev/ui` page showing components (dev only).
  Accept: typecheck; contrast check script for token pairs (ratio >= 4.5 text, 3 for UI) passes.

- **1.2 Site shell** - PRD §4.1, §1.2. Header (nav, mobile sheet, skip link), footer (contact from settings, legal links, emergency notice), `getSettings()` repository with defaults when the doc is missing.
  Accept: unit test for settings defaults; keyboard: skip link is first focusable (Vitest + Testing Library).

- **1.3 Catalog data + seed** - PRD §3.2, §5.2, §8. Schemas + validators for `service_categories`, `services`, `service_packages`; seed script with fictional data, all packages `active: false` until reviewed except dev flag. Public read repository (active only).
  Accept: seed idempotent test; inactive packages hidden from public read.

- **1.4 Home page** - PRD §4.3. Sections per spec; testimonials and events sections hidden when empty.
  Accept: render test asserts CTAs, no testimonial section with empty data.

- **1.5 Services directory + detail** - PRD §4.1, §5.2. Filter by category (URL param = category slug only), detail page with packages, starting price, eligibility, request button (links to intake, built in Phase 2).
  Accept: repository + page render tests.

- **1.6 Content pages** - PRD §4.1, §4.2. About, Chaplaincy, Weddings, Funerals, Programs overview, Prayer (static explainer; form in Phase 2) from MDX with `TODO(org)` blocks.
  Accept: typecheck; test that `TODO(org)` renders the pending block only in non-production.

- **1.7 Legal + scope pages** - PRD §1.3, §15.3. Privacy, terms, cancellation, refund, accessibility, service scope as MDX drafts with a top banner "Draft - requires legal review".
  Accept: pages render; copy checklist grep script (`scripts/copy-check.ts`) flags banned phrases; passes on all content.

- **1.8 Contact + general inquiry** - PRD §4.1, §13.5, §14. Form (RHF + zod), server action with guard + rate limit, stores `contact_messages`, generic confirmation email to outbox.
  Accept: action tests (valid, honeypot, rate limit); stored doc has no extra fields.

- **1.9 GATE + write Phase 2 tasks** - Full suite, `next build`, Playwright smoke (home -> services -> detail -> contact submit) at 360 and 1280 px. Then write Phase 2 tasks into this file.
  Accept: results recorded; Phase 2 tasks present.

## Later phases (outline; detailed at the end of the previous phase)

- **Phase 2 - Intake engine** (PRD §5, §10 prayer form, §11 requests): forms-as-data renderer, service request create (anon + claim), status machine, staff inbox, assignment, referral, prayer requests (encrypted), consent records, client request views. GATE incl. IDOR suite.
- **Phase 3 - Renewal program** (PRD §6): programs/tracks/cohorts/lessons, curriculum seed from `docs/content/renewal-curriculum.md`, enrollment wizard (payment stubbed to pending), participant portal, reflections, facilitator portal, attendance, certificate PDF.
- **Phase 4 - Scheduling** (PRD §7): availability, slot engine with DST tests, booking, cancellation policy, reminders cron, check-ins from enrollments.
- **Phase 5 - Payments** (PRD §8): Stripe Checkout, webhook + idempotency, quotes, invoices, deposits, installments, scholarships, memberships, dev mode. MVP milestone: acceptance criteria 1-5 and 8-11 demonstrable.
- **Phase 6 - Bookings** (PRD §9): shared pipeline, weddings, officiants, license checklist data, funerals, events, venues, agreements.
- **Phase 7 - Resources and prayer ministry** (PRD §10, §14): resources CMS, devotional plans, notification preferences, in-app notifications.
- **Phase 8 - Admin and hardening** (PRD §12, §13.7, §16, §15): metrics, audit viewer, exports/deletion, retention cron, a11y pass, CSP review.
- **Phase 9 - Launch** (brief §21-22): e2e for all 15 acceptance criteria, README, deployment guide (Vercel + Atlas), Stripe and Resend setup docs, security checklist, launch checklist, known-risks list.
