# Progress

Current task: 1.8 Contact + general inquiry

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 1.7 Legal + scope pages - done 2026-10-19
- Done: six MDX drafts in `src/content/legal/` (privacy, terms, cancellation, refund, accessibility, service-scope) at `/legal/<slug>` (matches `LEGAL_NAV`). `LegalPage` wrapper (`src/components/site/content.tsx`) renders `DraftBanner` "Draft - requires legal review" in every environment above the body. Org/counsel facts (entity, governing law, notice windows, refund rules, confidentiality limits, state privacy rights) are `TodoOrg`. Service scope renders `EmergencyNotice`.
- `scripts/copy-check.ts` (`npm run check:copy`): rules for therapy/psychotherapy, clinical/professional counseling, guarantee, cure, healing, promise, proven/miracle, HIPAA compliance claims, credential words (certified, accredited, endorsed by), inaccurate faith names. Allowed when a negation precedes it in the same sentence. Skips `TodoOrg` blocks and code comments. Requires `<EmergencyNotice` in prayer + service-scope. Scans `src/content`, `src/components/site`, `src/app/(public)` (.mdx/.tsx).
- Files: src/components/site/content.tsx, src/content/legal/*.mdx (6), src/app/(public)/legal/*/page.tsx (6), scripts/copy-check.ts, test/legal-pages.test.tsx, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/legal-pages.test.tsx test/content-pages.test.tsx` 25/25 pass (banner before body, every LEGAL_NAV route + MDX exists, copy-check passes on all content, 8 banned phrases flagged, negation scoped to sentence, TodoOrg/comments skipped, emergency notice required). `npm run check:copy` -> ok.
- Open: MDX pages not rendered (no dev server/build until 1.9 GATE). Retention periods quote PRD §13.7 defaults (ADR not written yet). Copy-check is a heuristic: a negation anywhere earlier in the sentence excuses a phrase. Contact page (1.8) is .tsx and is in scan scope; emergency notice on Contact is not enforced by the script.

## 1.6 Content pages - done 2026-10-19
- Done: MDX via `@next/mdx` (`next.config.ts` `createMDX({})`, `src/mdx-components.tsx`). Six pages import `src/content/<page>.mdx` into `<ContentPage>`: /about, /chaplaincy, /weddings, /funerals, /programs, /prayer (static explainer, form in Phase 2, emergency notice). `src/components/site/content.tsx`: `TodoOrg` (pending block "Content pending - TODO(org)", optional section heading; returns null when NODE_ENV=production), `contentComponents` (styled headings/lists, internal links via next/link, `TodoOrg`, `EmergencyNotice`).
- TodoOrg placeholders: mission/vision, history, leadership, credentials, statement of faith, ethics/reporting duties, facilities served, community settings, officiants, ceremony types, hardship policy, cohorts/prices.
- New deps (user approved, ADR 001 row): @next/mdx 16.4.2, @mdx-js/loader 3.1.1, @mdx-js/react 3.1.1, @types/mdx 2.0.14 (dev).
- Files: next.config.ts, src/mdx-components.tsx, src/components/site/content.tsx, src/content/*.mdx (6), src/app/(public)/{about,chaplaincy,weddings,funerals,programs,prayer}/page.tsx, test/content-pages.test.tsx, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/content-pages.test.tsx` 5/5 pass (pending block shown in development/test, nothing incl. heading in production, MDX component map + override, internal/external links).
- Open: MDX compile not exercised (vitest tests components, not .mdx; no dev server/build until 1.9 GATE). Copy is draft for org review (1.7 copy-check should scan src/content). Links to /contact and /services only; no renewal landing or prayer form yet. About ethics section mentions reporting duties generically pending counsel.

## 1.5 Services directory + detail - done 2026-10-19
- Done: `/services` directory (category chips, `?category=<slug>` is the only param, `aria-current` on filter, unknown category -> status note + all services, "From $X" or "Pricing on request") and `/services/[slug]` detail (breadcrumb, starting price, eligibility + pastoral-care-only note, package cards: price, sessions, duration, channels, response time, inclusions, deposit/installments, "Request this service" -> `/request/<slug>`). Both pages: Suspense + `"use cache"` tag `catalog`, cacheLife minutes, ConfigError -> empty/404.
- Repository: `startingPrice(packages)`; `listServices` and `getServiceBySlug` add `startingPrice` (cheapest active package; absent when none). `slugParam` rejects malformed slugs before any DB read.
- Files: src/server/data/catalog.ts, src/components/site/services.tsx, src/app/(public)/services/{page.tsx,[slug]/page.tsx}, test/{services.test.tsx,catalog.test.ts}, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/services.test.tsx test/catalog.test.ts test/home.test.tsx` 19/19 pass (slug param validation, directory links/filter/empty/unknown, detail packages/price/eligibility/request href, inactive package excluded from starting price).
- Open: not rendered with dev server or `next build` (Suspense + params under cacheComponents unverified until 1.9 GATE). `/request/<slug>` 404s until Phase 2 intake (route name chosen here, Phase 2 should use it). Price is per package currency; mixed currencies not compared. Admin catalog writes must `revalidateTag("catalog")`.

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

- 1.2 Site shell - done 2026-10-19: `getSettings` over defaults, public layout (skip link, header, mobile Sheet nav, footer with 911/988 + legal links), Testing Library + jsdom dev deps.
- 1.1 Design tokens + fonts - done 2026-10-19: brand tokens + `@theme inline`, Fraunces/Source Sans 3 (ADR 002), shadcn init + 9 components, solid focus rings, `check:contrast` 25/25.
- 0.9 GATE + Phase 2 detail check - done 2026-10-19: typecheck/eslint/55 tests/`next build` pass; Playwright deferred to 1.9; follow-ups added to PLAN.md.
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
