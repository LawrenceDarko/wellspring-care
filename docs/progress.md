# Progress

Current task: 1.9d Services restyle (then 1.9e, then 1.9 GATE)

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 1.9c Home restyle - done 2026-10-19
- Done: full home redesign per ADR 006. Forest-band hero: tagline in `type-display`, lede, CTAs "Request spiritual care" (/services) + "Explore programs" (/programs) as plain wrapping links (old Button had `whitespace-nowrap`), pastoral-only note, then the life-seasons path: labelled `<ol>` of 5 season links with gold numbered markers (aria-hidden) joined by a gold rule (down on mobile, across from lg), DB categories listed under their season. Below: book-page `Section` (gold hairline, optional margin note, `wide` for lists): renewal formats `dl` + margin note, ceremonies/families/chaplaincy 2-col list, events rows, testimonials as quotes, mission + values `dl`. No cards.
- `src/domain/seasons.ts`: `SEASONS` (marriage, family, renewal, illness, loss; category slugs + href `/services#season-<key>`, marriage -> /weddings), `seasonForCategory`, `groupBySeason`.
- Header fix (1.9b file, user-reported overflow): nav on its own row from xl with nowrap labels; wordmark `text-lede` on mobile.
- Files: src/domain/seasons.ts, src/components/site/{home,site-header}.tsx, test/{home,seasons}.test.ts(x), docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/home.test.tsx test/seasons.test.ts test/site-shell.test.tsx` 15/15 pass; `check:copy` ok. Rendered on user's dev server (:3000) in Chrome at 360/768/1280: scrollWidth == viewport, no element past the edge.
- Open: rendered without DB (no categories under seasons, events/testimonials hidden). `/services#season-*` anchors land in 1.9d. CTA labels now sentence case (PRD §4.3 quotes title case). Tagline title case comes from settings data.

## 1.9b Shell restyle - done 2026-10-19
- Done: header wordmark in Fraunces (`text-h3`, SOFT 50), quiet desktop nav (muted, gold hover underline, 44px targets) now from `xl` (10 links don't fit at 1024); below `xl` a ghost "Menu" button opens a linen sheet (site name title, 44px rows, pale-moss hover). Footer is a forest `band`: name + tagline + pastoral-only line, gold hairlines, three sections (Contact + "Send us a message" link, "If it is urgent" with EmergencyNotice, Policies legal nav), copyright. `<main>` gets bottom padding so pages don't butt the band.
- Files: src/components/site/{site-header,mobile-nav,site-footer}.tsx, src/app/(public)/layout.tsx, test/site-shell.test.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/site-shell.test.tsx test/contrast.test.ts test/home.test.tsx test/content-pages.test.tsx` 21/21 pass (skip link first focusable; new: footer has `band` + every footer link has `focus-visible:outline-2 outline-ring`; nav/menu 44px). `check:contrast` 28/28; `check:copy` ok.
- Open: not rendered (class-level checks only; real focus visibility + 360/1280 layout in 1.9 GATE Playwright). No `aria-current` on nav (header is a server component). Sign-in link not in header yet.

## 1.9a Design direction - done 2026-10-19
- Done: ADR 006 (life-seasons path as the one signature device, refined PRD palette, book-page layout, 8 UI rules) from `.claude/skills/frontend-design` (installed from anthropics/skills). Tokens: linen bg `#f6f5ef`, charcoal `#262624`, moss secondary, pale-moss accent (gold now rules/markers only), new `band`/`band-foreground`/`band-muted`/`band-gold`. Type scale in `@theme` (`text-body` 17px/1.65, `text-lede`, `text-h3..h1`, fluid `text-display`), `max-w-measure` 65ch, `type-display` + `band` utilities (band swaps focus ring to linen). Body defaults to `text-body`; headings `text-wrap: balance`.
- PLAN.md: tasks 1.9b-e added before 1.9 GATE. ADR README lists 006 (003 stays reserved for installments).
- Files: src/app/globals.css, scripts/check-contrast.ts, src/app/dev/ui/page.tsx, docs/adr/{006-design-direction.md,README.md}, docs/{PLAN,progress,MAP}.md, .claude/skills/frontend-design/.
- Tests: typecheck pass; eslint clean; `check:contrast` 28/28; `npx vitest run test/contrast.test.ts test/site-shell.test.tsx test/home.test.tsx` 14/14 pass.
- Open: CLAUDE.md is read-only on disk, so the "UI design" rule is in MAP.md, not CLAUDE.md (user to add). Not rendered in dev server (new tokens shift all pages slightly; checked in 1.9 GATE). Existing pages still use old card-grid layouts until 1.9b-e.

## 1.8 Contact + general inquiry - done 2026-10-19
- Done: `/contact` page (EmergencyNotice, link to /services for care requests) with RHF + zod client form (`contact-form.tsx`, `useActionState`, posts without JS too) -> server action `sendContactMessage` -> `submitContactForm` (`src/server/contact.ts`): guard (honeypot looks like success, stores nothing; bad/too-fast/expired token -> "form expired") -> validate (`contactInputSchema` in `src/domain/contact.ts`) -> rate limit per IP and per email (`publicForm` rule, scopes contactIp/contactEmail) -> `insertContactMessage` -> generic "inquiry_received" email (no name/message); missing/failing email transport only skips the receipt.
- New collection `contact_messages` (name, email, message, status new/closed, closedAt?, timestamps; strict zod + `additionalProperties: false`). Token minted per request (`connection()`); missing AUTH_SECRET -> "not configured".
- Sign-in follow-up: `FormGuardFields` (`src/components/site/form-guard.tsx`, honeypot + `formToken`) on the sign-in form; `requestMagicLink` guards first (honeypot -> check-email, else `?error=FormExpired`).
- Files: src/domain/contact.ts, src/server/data/{schemas/contact.ts,contact-messages.ts,registry.ts}, src/server/contact.ts, src/components/site/form-guard.tsx, src/app/(public)/contact/{page.tsx,contact-form.tsx,actions.ts}, src/app/(public)/sign-in/{page.tsx,actions.ts}, test/{contact.test.ts,form-guard.test.tsx}, docs. (~11 files, over the ~6 guideline; small each.)
- Tests: typecheck pass; eslint clean; `npx vitest run test/contact.test.ts test/form-guard.test.tsx test/rate-limit.test.ts test/db-ensure.test.ts test/auth.test.ts` 21/21 pass (valid stores exactly allowlisted keys + generic email, outbox write, no-email still stores, honeypot, forged/fast/missing token, field errors, IP + email limits, hashed keys). `check:copy` ok.
- Open: ContactForm client + sign-in action guard not exercised in tests (no render of server-action modules); verify in 1.9 Playwright (contact submit must wait >3s MIN_FILL_MS). Sign-in submitted within 3s shows "form expired". No staff read of contact_messages yet; retention purge not built.

## 1.7 Legal + scope pages - done 2026-10-19
- Done: six MDX drafts in `src/content/legal/` (privacy, terms, cancellation, refund, accessibility, service-scope) at `/legal/<slug>` (matches `LEGAL_NAV`). `LegalPage` wrapper (`src/components/site/content.tsx`) renders `DraftBanner` "Draft - requires legal review" in every environment above the body. Org/counsel facts (entity, governing law, notice windows, refund rules, confidentiality limits, state privacy rights) are `TodoOrg`. Service scope renders `EmergencyNotice`.
- `scripts/copy-check.ts` (`npm run check:copy`): rules for therapy/psychotherapy, clinical/professional counseling, guarantee, cure, healing, promise, proven/miracle, HIPAA compliance claims, credential words (certified, accredited, endorsed by), inaccurate faith names. Allowed when a negation precedes it in the same sentence. Skips `TodoOrg` blocks and code comments. Requires `<EmergencyNotice` in prayer + service-scope. Scans `src/content`, `src/components/site`, `src/app/(public)` (.mdx/.tsx).
- Files: src/components/site/content.tsx, src/content/legal/*.mdx (6), src/app/(public)/legal/*/page.tsx (6), scripts/copy-check.ts, test/legal-pages.test.tsx, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/legal-pages.test.tsx test/content-pages.test.tsx` 25/25 pass (banner before body, every LEGAL_NAV route + MDX exists, copy-check passes on all content, 8 banned phrases flagged, negation scoped to sentence, TodoOrg/comments skipped, emergency notice required). `npm run check:copy` -> ok.
- Open: MDX pages not rendered (no dev server/build until 1.9 GATE). Retention periods quote PRD §13.7 defaults (ADR not written yet). Copy-check is a heuristic: a negation anywhere earlier in the sentence excuses a phrase. Contact page (1.8) is .tsx and is in scan scope; emergency notice on Contact is not enforced by the script.

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
