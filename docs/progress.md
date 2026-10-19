# Progress

Current task: 1.10b Motion foundation (then 1.10c-i, GATE, then 2.1)

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 1.10a RESEARCH Motion + imagery direction - done 2026-10-19
- Done: user found the UI flat and the header broken (wordmark row + second row of ten links) and asked for a scroll-story redesign. User chose GSAP + Lenis, original vectors + licensed stock, one hero shader. ADR 007: "wellspring" story (spring -> five seasons downstream -> still pool CTA), progressive enhancement + reduced-motion = static, raw WebGL2 shader with guards, stock rules (no faces beside quotes), one-row grouped nav with "Request care". Supersedes ADR 006 rules 1 and 5 on public pages.
- Installed exact: gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.26 (ADR 001 row). No OGL/three.js.
- PLAN.md: Phase 1.10 tasks 1.10b-h + GATE inserted before Phase 2.
- Files: package.json, package-lock.json, docs/adr/{001,006,007,README}, docs/{PLAN,progress,MAP}.md.
- Tests: `npm ls gsap @gsap/react lenis` clean; `npm run typecheck` pass. No code changed, no vitest run.
- Open: nav grouping and "Request care" -> /services need user/org confirmation. Stock picks are sourced in 1.10g (RESEARCH). Install still blocks esbuild/fsevents/unrs-resolver/mongodb-memory-server scripts (as before).

## 1.9 GATE + write Phase 2 tasks - done 2026-10-19
- Done: GATE on the ADR 006 UI. First Playwright spec `test/e2e/smoke.spec.ts`: home -> "Request spiritual care" -> /services -> first service detail -> /contact submit (waits 3.5s for the form guard), at 360 and 1280 px, asserting no horizontal scroll on each page.
- E2E is hermetic: `test/e2e/server.ts` starts MongoMemoryReplSet, `ensureCollections`, `seedCatalog({activatePackages})`, then `next dev --port 3100` with throwaway AUTH_SECRET/FIELD_ENC_KEY, Resend blanked (dev outbox). `distDir` via `E2E_DIST_DIR` (`.next-e2e`) because Next 16 allows one `next dev` per dir (user's :3000 server was running). Config: one chromium project, `reuseExistingServer: false`. tsconfig gains `.next-e2e` type globs (Next adds them otherwise).
- PLAN.md: Phase 2 tasks 2.1-2.10 written (outline line removed).
- Files: test/e2e/{server,smoke.spec}.ts, playwright.config.ts, next.config.ts, tsconfig.json, .gitignore, docs.
- Tests: typecheck pass; `npx eslint src test scripts` clean; `npx vitest run` 134/134 (22 files); `next build` ok (23 routes, built without env so home/settings use defaults); `npm run test:e2e` 2/2 pass (run twice). Playwright chromium-headless-shell 1248 downloaded (pinned 1.64.1 needed it).
- Open: smoke covers only one service and Chromium; no 768 px check; IDOR suite has no Phase 2 repos yet. 1.9b-e "not rendered" items now covered only by the no-scroll check, not visual review. New capability `requests:triage` (2.7) is not in PRD §2: confirm with the org.

## 1.9e Content, legal, contact, sign-in restyle - done 2026-10-19
- Done: `ContentPage` is a book page (max-w-6xl grid, article at `max-w-measure`, first `p` after h1 is `text-lede`, optional `note` in a 15rem margin column, first in DOM so it reads first on mobile). `contentComponents`: h1/h2/h3 on the type scale, h2 opens with a gold hairline, gold list markers. `TodoOrg` no all-caps. `LegalPage` puts `DraftBanner` (same text + role/label) in the margin note.
- Contact: book-page header (h1, lede) + EmergencyNotice in the margin, form below a hairline; alerts as destructive left-rule, sent/not-configured states on pale moss. `CONTACT_MESSAGES` now say what happened and what to do (expired also covers "sent too quickly").
- Sign-in: shadcn Input/Label/Button (old black button gone), error alert linked via `aria-describedby`, `EmailSignin` message added, clearer InvalidEmail/FormExpired copy. Check-email restyled.
- Files: src/components/site/content.tsx, src/app/(public)/contact/{page,contact-form}.tsx, src/app/(public)/sign-in/{page,check-email/page}.tsx, src/server/contact.ts, test/{content-pages,legal-pages}.test.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/content-pages.test.tsx test/legal-pages.test.tsx test/form-guard.test.tsx test/contact.test.ts test/site-shell.test.tsx test/contrast.test.ts` 48/48 pass (new: measure/lede/hairline, margin note order, no all-caps, draft notice in margin). `check:copy` ok.
- Open: not rendered in a browser (360/1280 in 1.9 GATE). Content pages pass no `note` yet. Sign-in page not unit tested (async server component).

## 1.9d Services restyle - done 2026-10-19
- Done: directory per ADR 006: book-page header (h1, lede, scope note in margin column), quiet category filter (rounded-md, pale-moss selected, same `?category=` hrefs + `aria-current`). "All" view grouped by life season (`groupServicesBySeason` in services.tsx: season order, unmapped -> "Other care" last, empty seasons dropped), each a `<section id="season-<key>">` with gold numbered marker (aria-hidden, number = position in SEASONS) + season line; services as rows (name, summary, category, price), no cards. Filtered view: category h2 + summary + rows.
- Detail: main column (breadcrumb, h1, summary, price, CTA as plain link, no nowrap Button) + margin aside "Who this is for" (eligibility + pastoral-care note), packages below a gold hairline as the only `rounded-lg` cards (2 col max).
- Files: src/components/site/services.tsx, src/app/(public)/services/[slug]/page.tsx (fallback padding), test/services.test.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/services.test.tsx test/home.test.tsx test/seasons.test.ts` 16/16 pass (new: season grouping order + anchors + no cards in directory; aside holds eligibility + scope note; package card is the only card). `check:copy` ok.
- Open: not rendered in a browser (360/1280 checked in 1.9 GATE). Marriage season has no categories, so `#season-marriage` never renders (home links it to /weddings). Category chips not ordered by season.

## 1.9c Home restyle - done 2026-10-19
- Done: full home redesign per ADR 006. Forest-band hero: tagline in `type-display`, lede, CTAs "Request spiritual care" (/services) + "Explore programs" (/programs) as plain wrapping links (old Button had `whitespace-nowrap`), pastoral-only note, then the life-seasons path: labelled `<ol>` of 5 season links with gold numbered markers (aria-hidden) joined by a gold rule (down on mobile, across from lg), DB categories listed under their season. Below: book-page `Section` (gold hairline, optional margin note, `wide` for lists): renewal formats `dl` + margin note, ceremonies/families/chaplaincy 2-col list, events rows, testimonials as quotes, mission + values `dl`. No cards.
- `src/domain/seasons.ts`: `SEASONS` (marriage, family, renewal, illness, loss; category slugs + href `/services#season-<key>`, marriage -> /weddings), `seasonForCategory`, `groupBySeason`.
- Header fix (1.9b file, user-reported overflow): nav on its own row from xl with nowrap labels; wordmark `text-lede` on mobile.
- Files: src/domain/seasons.ts, src/components/site/{home,site-header}.tsx, test/{home,seasons}.test.ts(x), docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/home.test.tsx test/seasons.test.ts test/site-shell.test.tsx` 15/15 pass; `check:copy` ok. Rendered on user's dev server (:3000) in Chrome at 360/768/1280: scrollWidth == viewport, no element past the edge.
- Open: rendered without DB (no categories under seasons, events/testimonials hidden). `/services#season-*` anchors land in 1.9d. CTA labels now sentence case (PRD §4.3 quotes title case). Tagline title case comes from settings data.

- 1.9b Shell restyle - done 2026-10-19: Fraunces wordmark header, nav from `xl`, linen Sheet menu below `xl`, forest band footer (contact, emergency, legal); 44px targets, focus on band.
- 1.9a Design direction - done 2026-10-19: ADR 006 (life-seasons path, refined palette, book-page layout, 8 UI rules), linen/charcoal/moss tokens + `band*`, type scale + `max-w-measure`, PLAN tasks 1.9b-e.
- 1.8 Contact + general inquiry - done 2026-10-19: `/contact` RHF form -> `submitContactForm` (guard, validate, IP+email rate limit, `contact_messages`, generic receipt email); `FormGuardFields` on sign-in. Contact submit must wait >3s.
- 1.7 Legal + scope pages - done 2026-10-19: six legal MDX drafts at `/legal/<slug>` in `LegalPage` + `DraftBanner`, org facts as `TodoOrg`, `npm run check:copy` (PRD §15.3 banned phrases, emergency notice required).
- 1.6 Content pages - done 2026-10-19: MDX via `@next/mdx`, six pages in `ContentPage`, `TodoOrg` pending blocks (hidden in production), `contentComponents`.
- 1.5 Services directory + detail - done 2026-10-19: `/services` (category chips, `?category=`) + `/services/[slug]` with packages, `startingPrice`, `slugParam`; request href `/request/<slug>` (404 until Phase 2).
- 1.4 Home page - done 2026-10-19: `HomeSections` per PRD §4.3, `events`/`testimonials` collections (publish needs consent), cached loader with defaults on ConfigError.
- 1.3 Catalog data + seed - done 2026-10-19: catalog zod + validators, public `listCategories`/`listServices`/`getServiceBySlug`, `seedCatalog` (20 services, packages inactive, $setOnInsert), `db:seed`.
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
