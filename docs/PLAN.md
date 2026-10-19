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

- **0.7a Email transport** - PRD §14. `email_outbox` schema + validator + registry (TTL), outbox repository, `sendEmail()`: Resend when configured, dev transport (`email_outbox`) otherwise, visible "not configured" error in production without Resend.
  Accept: tests for outbox write, transport selection, production refusal; typecheck passes.

- **0.7b Auth.js core** - PRD §13.2. Auth.js with MongoDB adapter, DB sessions, email provider sending through `sendEmail()`, session callback attaches roles (`user_roles` read), `getAuthContext()`, `/api/auth/[...nextauth]` route.
  Accept: integration test creates verification token and outbox entry; typecheck passes.

- **0.7c Sign-in + outbox pages** - PRD §13.2, §14. Minimal `/sign-in` page and `/dev/outbox` (dev only, 404 in prod).
  Accept: typecheck passes. Dev server check: sign-in page renders (start, curl, kill).

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

- **1.9a Design direction** - PRD §4.4, ADR 006, `.claude/skills/frontend-design`. ADR 006, token + type-scale update in `globals.css`, band pairs in `check:contrast`, `/dev/ui` specimen, UI rule in CLAUDE.md.
  Accept: typecheck; `check:contrast` passes; contrast test passes.

- **1.9b Shell restyle** - ADR 006. Header (wordmark in display face, quiet nav), mobile sheet, footer as forest band (contact, legal links, emergency notice). Files: `site-header.tsx`, `mobile-nav.tsx`, `site-footer.tsx`, `(public)/layout.tsx`.
  Accept: site-shell tests still pass (skip link first focusable); visible focus on band.

- **1.9c Home restyle** - PRD §4.3, ADR 006. Seasons hero on forest band (tagline in `type-display`, life-seasons path linking to services, two CTAs); sections as lists with margin notes, not card grids. Seasons map lives in `src/domain/seasons.ts` (category slug -> season).
  Accept: home tests updated (CTAs, seasons links, empty sections hidden); path is an ordered list with accessible names.

- **1.9d Services restyle** - PRD §4.1, §5.2, ADR 006. Directory grouped by season (category filter kept, same URL param), detail page with margin column (eligibility, pastoral-care note) and package cards as the only cards.
  Accept: services tests updated and passing.

- **1.9e Content, legal, contact, sign-in restyle** - ADR 006. `ContentPage`/`LegalPage` book-page layout (measure, margin notes, gold hairline section breaks), `contentComponents` type scale, contact + sign-in forms with clear error copy.
  Accept: content-pages, legal-pages, form-guard tests pass; `check:copy` ok.

- **1.9 GATE + write Phase 2 tasks** - Full suite, `next build`, Playwright smoke (home -> services -> detail -> contact submit) at 360 and 1280 px, on the ADR 006 UI. Then write Phase 2 tasks into this file.
  Accept: results recorded; Phase 2 tasks present.

## Phase 1.10 - Story-driven public redesign (user request 2026-10-19, ADR 007)

- **1.10a RESEARCH Motion + imagery direction** - ADR 007 (story, GSAP + Lenis, hero shader, vectors + stock, nav), pin gsap/@gsap/react/lenis in ADR 001, install, plan 1.10b-i.
  Accept: `npm ls` clean; typecheck.

- **1.10b Header + nav redesign** - ADR 007 Nav. `nav.ts` grouped (`NAV_GROUPS`, flat `MAIN_NAV` kept for footer/sitemap), `npx shadcn add navigation-menu`, single-row sticky header from `lg` (Care, Programs & events, Prayer, About, Contact, "Request care"; transparent over hero via `data-over-hero`, solid after scroll, hide-on-scroll-down with a passive scroll listener + CSS transitions, no GSAP dependency), "Request care" button, full-screen forest mobile overlay below `lg` with CSS-staggered links (instant under reduced motion); 1.10c may later move scroll state onto Lenis. Files: `nav.ts`, `site-header.tsx`, `mobile-nav.tsx`, new `header-scroll.tsx`, test.
  Accept: site-shell tests updated (skip link first focusable, every route reachable from both menus, Escape closes, focus returns to trigger, 44px targets).

- **1.10c Motion foundation** - ADR 007 rules 1-4. `src/components/motion/`: `MotionProvider` (client; registers ScrollTrigger, Lenis on GSAP ticker, off under reduced motion, refresh on route change), `Reveal` (fade/rise on enter, JS sets the from-state), `Parallax` (speed prop, scrub), `useReducedMotion`. Easing/duration tokens in `globals.css`. Mount in `(public)/layout.tsx`. `/dev/ui` demo block.
  Accept: jsdom tests: content visible with no JS / under reduced motion (no transform/opacity style set); provider skips Lenis under reduced motion.

- **1.10d Vector art set** - ADR 007 Vectors. `src/components/art/landscape.tsx` (layer components: sky, far hills, near hills, spring/water, trees, birds; each a separate `<svg>` layer for parallax), `seasons-art.tsx` (five season vignettes). Token colors, `aria-hidden`, viewBox-responsive. `/dev/ui` specimen.
  Accept: render test (aria-hidden, no hard-coded hex outside tokens); 360/1280 no overflow on `/dev/ui`.

- **1.10e Hero shader** - ADR 007 WebGL. `src/components/art/wellspring-shader.tsx`: raw WebGL2 full-screen quad (water + light, palette uniforms), guards (WebGL2, reduced motion, saveData, >=768px), DPR cap 1.5, IntersectionObserver + visibilitychange pause, context-loss handling, cleanup. Pure guard fn `canRunShader(env)` in `src/domain/` for tests.
  Accept: guard unit tests; component renders the SVG fallback when guard is false; no console errors on `/dev/ui` (dev server, killed after).

- **1.10f Home story** - PRD §4.3, ADR 007 Story. Rebuild `home.tsx`: pinned hero (shader + parallax landscape, tagline, CTAs), scrubbed "downstream" chapter: five seasons each a scene (vignette swap, season copy, link), then remaining PRD §4.3 sections with reveals, closing "still pool" CTA. Server data unchanged.
  Accept: home tests updated (CTAs, five season links in order as an `<ol>`, empty sections hidden, all text present without JS).

- **1.10g RESEARCH Stock media** - ADR 007 Stock. Choose <= 10 Unsplash/Pexels images (+ <= 1 short loop video, <= 4 MB) for home chapters, services, content headers; download to `public/media/` (resized webp/avif), `src/content/media.ts` (src, alt, credit, sourceUrl, licence, width, height). Credits listed on `/about` or a credits section of the footer.
  Accept: media test (every entry has alt + credit + licence; files exist); no face beside a quote.

- **1.10h Services + content treatments** - ADR 007. Image/vector page headers with parallax, season sections reveal, sticky margin notes on desktop, package cards hover/focus motion; `ContentPage` header image slot. Files: `services.tsx`, `content.tsx`, page header component, tests.
  Accept: services/content-pages tests pass; reduced-motion render identical content.

- **1.10 GATE** - Full suite, `next build`, Playwright at 360/1280 (existing smoke + header menus by keyboard + a `reducedMotion: 'reduce'` run asserting all home text visible), no horizontal scroll, first-load JS for `/` recorded.
  Accept: results recorded; Phase 2 resumes at 2.1.

## Phase 2 - Intake engine

- **2.1 Intake data layer** - PRD §3.2 (Intake), §5.1, §13.1. Zod schemas + validators for `intake_forms` (key, version, fields; `sensitive` literal false, free text maxLength <= 500), `service_requests` (requester userId or `pendingClaim`, service, package?, answers, status, assignedProviderIds, history[]), `referrals`, `consent_records`; registry indexes. Files: `src/server/data/schemas/intake.ts`, `registry.ts`, test.
  Accept: ensure idempotent; validator rejects `sensitive: true`, maxLength > 500, unknown status.

- **2.2 Status machine** - PRD §5.6. `src/domain/status.ts`: statuses, `canTransition`, `transition(request, to, actor, now)` returning the new status + history entry; `cancelled`/`referred` from any non-terminal; terminal set. Pure, no DB.
  Accept: table test of every allowed and a sample of rejected transitions; history entry shape.

- **2.3 Forms-as-data renderer** - PRD §5.1, §5.3, §5.4, §15.1. `src/domain/intake-form.ts` (definition -> zod schema, 500-char cap, required/options) + `src/components/intake/intake-form-fields.tsx` (RHF fields, helper text "Please share only what you're comfortable with...", labelled inputs, error links). Seed intake forms: general, hospice (relationship, setting, preferred support, clinical-team notice), family/couples (participants, who is the client, confidentiality summary); map every seeded service to a form key.
  Accept: schema-from-definition tests (caps, required, options); render test (labels, helper, errors via aria-describedby); seed idempotent.

- **2.4 Service request create** - PRD §5.7, §13.5, §14, §15.3. `/request/[slug]` page (ADR 006 book page, emergency notice, scope note), server action: guard + rate limit, validate against the form version, scope/privacy consent record, insert `submitted` with history, generic `inquiry_received` email. Signed-in -> requester = user; anonymous -> email + hashed claim token (TTL) and claim link email. Repo `src/server/data/service-requests.ts` (`createServiceRequest`). Fixes the `/request/<slug>` 404.
  Accept: action tests (valid signed-in, valid anon, honeypot, rate limit, invalid answers); stored doc has no extra keys; email subject/body generic.

- **2.5 Claim anonymous request** - PRD §5.7, §13.2. `/request/claim` route: requires sign-in with the same email, verifies hashed token (single use, expiry), sets requester, audit `request.claimed`. Nothing sensitive in the URL beyond the opaque token.
  Accept: tests for valid claim, wrong email, reused token, expired token.

- **2.6 Client portal: requests** - PRD §11, §13.1. `(portal)` layout (`requireUser`, sign-in link in site header), `/portal/requests` list + `/portal/requests/[id]` detail (status, history in plain words, service), owner-scoped repo methods `listMyRequests`, `getMyRequest`.
  Accept: IDOR test (other user's id -> null/404); render tests for list + detail.

- **2.7 Staff inbox + assignment** - PRD §2, §12.2, §13.1, §13.2. Capability `requests:triage` (super_admin; record in capability map), `(staff)` layout with `requireCapability` + 12h re-auth check, `/staff/requests` inbox (filter by status, no answers in list), detail, assign provider (`care:provide` holders), audit `request.assigned`. Chaplain sees only assigned (`assignedScope`).
  Accept: authz tests (triage sees all, chaplain only assigned, client 403); assignment audit written.

- **2.8 Staff transitions + referral** - PRD §5.5, §5.6. Server actions applying `src/domain/status.ts` (409 on invalid), history + audit, status email (generic); "Referred to another provider" with `referrals` record (category, optional provider name, note <= 200 chars).
  Accept: transition tests (valid, invalid, unassigned chaplain 403); referral note cap; client view shows new status.

- **2.9 Prayer requests** - PRD §10, §3.2 (Content), §13.3. `prayer_requests` schema (encrypted text with aad, private default, follow-up preference), form on `/prayer` (guard, rate limit, anonymous allowed), `prayer_team` view decrypting only with `prayer:read_assigned`; public-sharing consent recorded separately, never displayed (MVP).
  Accept: stored doc has no plaintext; non-prayer roles (incl. client, chaplain) cannot read; encryption aad bound to doc id.

- **2.10 GATE + write Phase 3 tasks** - Full suite incl. IDOR suite over every Phase 2 repository, `next build`, Playwright at 360 and 1280: anonymous request -> claim -> portal shows status; staff assigns + transitions; prayer submit. Then write Phase 3 tasks into this file.
  Accept: results recorded; Phase 3 tasks present.

## Later phases (outline; detailed at the end of the previous phase)

- **Phase 3 - Renewal program** (PRD §6): programs/tracks/cohorts/lessons, curriculum seed from `docs/content/renewal-curriculum.md`, enrollment wizard (payment stubbed to pending), participant portal, reflections, facilitator portal, attendance, certificate PDF.
- **Phase 4 - Scheduling** (PRD §7): availability, slot engine with DST tests, booking, cancellation policy, reminders cron, check-ins from enrollments.
- **Phase 5 - Payments** (PRD §8): Stripe Checkout, webhook + idempotency, quotes, invoices, deposits, installments, scholarships, memberships, dev mode. MVP milestone: acceptance criteria 1-5 and 8-11 demonstrable.
- **Phase 6 - Bookings** (PRD §9): shared pipeline, weddings, officiants, license checklist data, funerals, events, venues, agreements.
- **Phase 7 - Resources and prayer ministry** (PRD §10, §14): resources CMS, devotional plans, notification preferences, in-app notifications.
- **Phase 8 - Admin and hardening** (PRD §12, §13.7, §16, §15): metrics, audit viewer, exports/deletion, retention cron, a11y pass, CSP review.
- **Phase 9 - Launch** (brief §21-22): e2e for all 15 acceptance criteria, README, deployment guide (Vercel + Atlas), Stripe and Resend setup docs, security checklist, launch checklist, known-risks list.
