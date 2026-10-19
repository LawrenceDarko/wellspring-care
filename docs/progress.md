# Progress

Current task: 1.5 Services directory + detail

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 1.4 Home page - done 2026-10-19
- Done: `HomeSections` (pure props) per PRD §4.3: hero (tagline from settings, "Request Spiritual Care" -> /services until intake exists, "Explore Programs" -> /programs, pastoral-care-only line), active categories (links `/services?category=<slug>`), 4/8-week renewal (not-a-cure line), weddings/funerals, family + chaplaincy, events, testimonials, mission/values. Events and testimonials sections omitted when empty.
- New collections `events`, `testimonials` (schemas/content.ts, registry). Validator rejects `published: true` without `consentRecordId`. `src/server/data/content.ts`: `listUpcomingEvents` (published, not ended, soonest first), `listPublishedTestimonials` (also requires `consent_records` doc granted + not revoked).
- Page loads via `"use cache"` tags organization-settings/catalog/events/testimonials, cacheLife minutes; ConfigError -> defaults with no DB sections.
- Files: src/server/data/{schemas/content.ts,content.ts,registry.ts}, src/components/site/home.tsx, src/app/(public)/page.tsx, test/{home.test.tsx,content.test.ts}, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/home.test.tsx test/content.test.ts test/db-ensure.test.ts` 12/12 pass (CTAs, sections, no testimonial/event section when empty, event date in org tz, revoked/denied/missing consent hidden, validator rejects unconsented publish); smoke + catalog + site-shell 13/13.
- Open: not rendered in dev server/build (1.9 GATE). Mission/values copy is generic placeholder for org review. `consent_records` has no validator yet (intake tasks). Consent revoke and event/testimonial admin writes must `revalidateTag` ("testimonials"/"events"). Linked routes 404 until their tasks.

## 1.3 Catalog data + seed - done 2026-10-19
- Done: `schemas/catalog.ts` zod + `$jsonSchema` for `service_categories`, `services`, `service_packages` (price in cents, `depositRule` none/percent/fixed, `channels` enum, optional `stripePriceId`); registry entries with slug-unique and order indexes (`service_slug_unique` per package). Public read `src/server/data/catalog.ts`: `listCategories`, `listServices({categorySlug?})`, `getServiceBySlug` (active only; services in inactive categories hidden; no `active`/`stripePriceId`/timestamps in output).
- Seed: `scripts/seed/catalog.ts` `seedCatalog(db, {activatePackages?})`: 5 categories, the 20 PRD §5.2 services, fictional packages in PRD §8 ranges; upsert by slug with `$setOnInsert` only (re-run never overwrites admin edits); packages `active: false` unless dev flag. `npm run db:seed [-- --activate-packages]` (flag refused when NODE_ENV=production; now loads .env.local).
- Files: src/server/data/{schemas/catalog.ts,catalog.ts,registry.ts}, scripts/{db-seed.ts,seed/catalog.ts}, test/catalog.test.ts, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/catalog.test.ts test/db-ensure.test.ts` 11/11 pass (seed idempotent + validators, all packages inactive, admin edits kept, dev flag activates, inactive packages/services/categories hidden, ordering + filter). `node scripts/db-seed.ts` without URI exits 1 with message (imports load).
- Open: seed not run against a real DB (no local mongod). `intakeFormKey` values (general-care, hospice, family-couples) have no `intake_forms` yet (intake tasks). Service `bodyRef` copy not written. Prices are placeholders pending org review.

## 1.2 Site shell - done 2026-10-19
- Done: `src/server/data/settings.ts` `getSettings(db?)` (public read of `organization_settings` key "default", public-field projection, stored values merged over frozen `SETTINGS_DEFAULTS`). `(public)/layout.tsx`: skip link, header, `<main id="main" tabIndex=-1>`, footer; settings loaded via `"use cache"` + `cacheTag("organization-settings")`, falls back to defaults on `ConfigError` (cacheLife minutes). Header: name from settings, desktop nav (lg+), mobile Sheet nav. Footer: contact from settings or "not configured yet", emergency notice (tel:911, tel:988), legal links, pastoral-care-only line.
- Public pages' `<main>` -> `<div>` (layout owns `<main>`).
- New dev deps (user approved, ADR 001 row): @testing-library/react 16.3.3, dom 10.4.2, user-event 14.6.8, jsdom 30.1.3. Vitest now includes `*.test.tsx`.
- Files: src/server/data/settings.ts, src/components/site/{nav.ts,site-header.tsx,mobile-nav.tsx,site-footer.tsx}, src/app/(public)/{layout,page}.tsx, sign-in pages, test/{settings.test.ts,site-shell.test.tsx}, vitest.config.ts, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/settings.test.ts test/site-shell.test.tsx` 8/8 pass (defaults when missing, merge + no internal fields, skip link first Tab stop -> #main, nav, mobile sheet opens, footer 911/988/legal/contact); smoke + contrast 6/6.
- Open: not rendered with dev server or `next build` ("use cache" + fallback unverified until 1.9 GATE). Nav/legal routes 404 until their tasks. Home h1 still hardcodes "Wellspring Care" (home task). Admin settings write must `revalidateTag("organization-settings")`.

## 1.1 Design tokens + fonts - done 2026-10-19
- Done: brand tokens (hex, light only) in `globals.css` :root, mapped via `@theme inline` (+ `gold`, `font-sans`, `font-display`); h1-h3 use display font; global `prefers-reduced-motion` rule. Fonts Fraunces + Source Sans 3 via `next/font/google` (`src/app/fonts.ts`, ADR 002). shadcn init (radix, new-york) + button, card, input, label, textarea, select, dialog, badge, sheet. `/dev/ui` preview page (404 in production).
- New deps from shadcn, pinned exact and recorded in ADR 002: radix-ui 1.8.1, class-variance-authority 0.7.1, cn 0.5.0 (shadcn's clsx+tailwind-merge replacement), tw-animate-css 1.4.0 (dev).
- Focus ring: shadcn `ring-ring/50` measured ~2.5:1 on ivory, changed to solid `ring-ring` in 5 components + base `outline-ring`.
- `scripts/check-contrast.ts` (`npm run check:contrast`): 25 token pairs, text >= 4.5, UI >= 3. Vitest aliases `next/font/google` to `test/helpers/next-font.ts`.
- Files: src/app/{globals.css,layout.tsx,fonts.ts,dev/ui/page.tsx}, src/components/ui/*, src/lib/utils.ts, components.json, scripts/check-contrast.ts, test/{contrast.test.ts,helpers/next-font.ts}, vitest.config.ts, package.json, docs/adr/002-fonts.md.
- Tests: typecheck pass; eslint clean on touched files; `npm run check:contrast` 25/25 pass (lowest: input border 3.58, gold-foreground on gold 4.96); `npx vitest run test/smoke.test.ts test/contrast.test.ts` 6/6 pass.
- Open: /dev/ui not rendered in a browser (dev server not required by task); font download through next/font not exercised (first happens at next dev/build). Sign-in page not restyled yet.

## 0.9 GATE + Phase 2 detail check - done 2026-10-19
- Results: `npm run typecheck` pass; `npx eslint src test scripts` clean; `npx vitest run` 10 files, 55/55 pass (5.2s); `next build` pass (Next 16.4.2 Turbopack): / static, /sign-in partial prerender, /api/auth dynamic, /dev/outbox prerendered as notFound in production (guard checked).
- Playwright not run: `test/e2e/` has no specs yet; first smoke is in 1.9.
- No fixes needed. Follow-ups put into PLAN.md: sign-in honeypot/formToken -> 1.8; assignments in AuthContext, staff 12h re-auth, server-action rate-limit test -> Phase 2 outline; CSP headers, FIELD_ENC_OLD_KEYS, npm audit review -> Phase 8 outline.
- Phase 2 outline still fits Phase 0 (scoped repos, field crypto, audit, rate limit, email outbox all in place). Detailed Phase 2 tasks still written in 1.9.
- Files: docs/PLAN.md, docs/progress.md.

- 0.8 Rate limit + public-form guard - done 2026-10-19: fixed-window `checkRateLimit` (HMAC keys, TTL), `guardPublicForm` (honeypot, signed formToken, Origin); sign-in rate-limited. Sign-in honeypot/token and CSP still open.
- 0.7c Sign-in + outbox pages - done 2026-10-19: `/sign-in` magic-link form + server action, check-email page, dev-only `/dev/outbox`, "not configured" state.
- 0.7b Auth.js core - done 2026-10-19: Mongo adapter, DB sessions, email magic link, `user_roles` -> session roles, `getAuthContext()`.
- 0.7a Email transport - done 2026-10-19: `email_outbox` + TTL, `sendEmail` (Resend or dev outbox, refuses in prod without Resend), `EmailNotConfiguredError`.
- 0.6 Field encryption + audit + logger - done 2026-10-19: AES-256-GCM `encryptField`/`decryptField` with kid + aad, allowlisted logger, `recordAudit` with meta allowlist.
- 0.5 Authz core - done 2026-10-19: capability map, `AuthContext`, `requireUser`/`requireCapability`, `scopedCollection` + scopes; IDOR tests.
- 0.4 Mongo client + ensure - done 2026-10-19: `getDb()` cached client, registry + `ensureCollections`, zod + `$jsonSchema` by hand, `db:ensure` script; memory-server tests.
- 0.3 Env + config - done 2026-10-19: zod env in `src/server/config.ts` (`parseConfig`, `getConfig`, integration flags, `ConfigError` names keys only); vitest stubs `server-only`.
- 0.2 RESEARCH Pin versions - done 2026-10-19: all deps pinned exact in ADR 001; mongodb 6.21 (adapter peer), react-email 6.11.3, TS 5.9/ESLint 9 held; Auth.js v5 beta risk noted.
- 0.1 Scaffold - done 2026-10-19: Next 16.4.2 + React 19 scaffold, Vitest/Playwright configs, folder layout, `.env.example`; AGENTS.md not added; npm audit warnings unreviewed.
