# Progress

Current task: 2.1

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 1.11 Home motion + season photos (user request) - done 2026-10-19
- Done: hero intro (layers settle by depth, headline rises word by word via `HeroWords`, copy staggers in), pointer depth drift on fine pointers md+ (`data-drift`, quickTo), stronger pinned scrub (zoom by depth, birds lift, dawn bloom, scroll cue). Fixed pin: parent is flex so ScrollTrigger had `pinSpacing` off and the seasons chapter slid over the pinned hero (since 1.10f); now explicit.
- Seasons: vector vignettes replaced by season photos (`SEASON_MEDIA` in media.ts). lg story: sticky photo stage, scrubbed clip-path wipe up per scene + previous photo lifts away, slow settle, numbered caption swap, 5-segment progress; per-scene copy rises in (ends opacity 1). Below lg / reduced: inline photo with slow Parallax. Still-pool band: stillLake photo with parallax instead of the vector landscape.
- Files: src/components/site/home-story.tsx, home.tsx, src/content/media.ts, test/home.test.tsx, docs.
- Tests: typecheck pass; eslint clean; vitest home/media/art/motion/site-shell 54/54; Playwright story + smoke 9/9 (run off-GATE: this task changes what story.spec covers); screenshots checked by eye at 1440 and 390.
- Open: service detail headers still use season vignettes (`PageHeader season`); not checked on Safari/real GPU.

## 1.10 GATE - done 2026-10-19
- Done: full suite, `next build`, Playwright. New `test/e2e/story.spec.ts`: header menus by keyboard at 1280 (Tab order skip link -> wordmark -> Care, Enter opens, Escape closes + focus back, Tab into menu + Enter follows), mobile menu by keyboard at 360 (focus trapped, Escape returns focus, link closes overlay), home under `reducedMotion: 'reduce'` at 360/1280 (every own-text element in main visible at opacity 1 without scrolling, 5 seasons, no canvas, no `data-story`), home with motion at 1280 (story on, all text opacity 1 after wheel-scrolling through, no page errors), no horizontal scroll on 12 public routes at 360/1280.
- Fix: `/sign-in` minted `publicFormToken()` (`new Date()`) during prerender (dev error); now `await connection()` first, like contact.
- First-load JS for `/` (prod build, scripts in the prerendered HTML): 11 files, 814.6 KB raw, 263.9 KB gzip (largest chunks 224 / 156 / 132 / 110 KB raw).
- Files: test/e2e/story.spec.ts, src/app/(public)/sign-in/page.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run` 194/194 (26 files); `next build` ok; `npm run test:e2e` 9/9; after the fix auth + form-guard 3/3, build + e2e 9/9 rerun.
- Open: not checked on a real GPU/Safari or by eye in this gate (visual drift edges, sticky offset, hero contrast over the shader, LCP). Home JS is heavy (GSAP + Lenis + shader); a later task could split the story islands. Contact page still has no header (stillLake reserved).

## 1.10h Services + content treatments - done 2026-10-19
- Done: `src/components/site/page-header.tsx` `PageHeader({media} | {season})`: full-width band (clamp 11rem/34svh/22rem, gold hairline) with a `MEDIA` photo via `next/image` (`fill`, `preload`, 100vw) or a decorative season vignette, oversized layer in `Parallax` (0.1). `ContentPage({media?})` header slot: about chapelCross, chaplaincy heldHands, weddings weddingHands, funerals candle, programs forestPath, prayer teaLights (legal pages none). Services directory riverDawn; service detail its season vignette (none if the category maps to no season).
- Season sections' content in `Reveal` (section + anchor id stay outside). Margin notes `lg:sticky` below the header (content pages, service detail). Package cards lift + gold top border on hover/focus-within (`--ease-story`), `motion-reduce` off.
- `test/helpers/match-media.ts` shared jsdom matchMedia stub (`motion.reduce` toggle); imported first by services, content-pages, media, legal-pages tests (content.tsx now pulls GSAP).
- Files: src/components/site/{page-header,services,content}.tsx, src/app/(public)/{about,chaplaincy,weddings,funerals,programs,prayer}/page.tsx (one prop each), test/{services,content-pages,media,legal-pages}.test.tsx, test/helpers/match-media.ts, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/services.test.tsx test/content-pages.test.tsx test/media.test.tsx test/legal-pages.test.tsx test/home.test.tsx test/motion.test.tsx test/site-shell.test.tsx test/art.test.tsx` 98/98 (new: header photo/vignette + order, no header without media/season, sticky notes, card motion classes, reduced vs motion render identical text/links/alts while motion adds reveal opacity + parallax transform).
- Open: not run in a browser: header drift edges, sticky offset vs hiding header, image LCP/`preload` on content pages, 360 px. Contact page has no header yet (stillLake reserved). Check all in 1.10 GATE.

## 1.10g RESEARCH Stock media - done 2026-10-19
- Done: ADR 008. Nine Unsplash photos (Unsplash License, free tier only) in `public/media/*.webp`, 1600x1067 landscape crops from the Unsplash CDN, 2.9 MB total (largest 763 KB): river-dawn, wedding-hands, family-path (from behind), forest-path, held-hands, candle, tea-lights, chapel-cross, still-lake. No faces (contact-sheet review). No video (Unsplash has none, Pexels needs an API key).
- `src/content/media.ts` `MEDIA`/`MEDIA_LIST` (src, alt, credit, sourceUrl, licence, width, height, people, use). `PhotoCredits` (content.tsx) at the end of /about.
- Files: public/media/*, src/content/media.ts, src/components/site/content.tsx, src/app/(public)/about/page.tsx, test/media.test.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/media.test.tsx test/content-pages.test.tsx` 30/30 (budget <= 10, fields per entry, files exist < 1 MB, no unregistered files, no faces, credits list + licence link). `check:copy` ok.
- Open: images not placed on pages yet (1.10h). Unsplash search pages are bot-walled for curl; picks were found via WebFetch and downloaded from images.unsplash.com.

## 1.10f Home story - done 2026-10-19
- Done: `src/components/site/home-story.tsx` client islands. `HomeHero`: light dawn hero (`data-hero="light"`), `LANDSCAPE_LAYERS` full-bleed with `WellspringShader` as the sky (SVG `Sky` fallback); from md + motion, pinned 60% scrub: layers scale by depth (foreground most), birds rise, copy drifts up (never fades). `SeasonsChapter`: forest band, `<ol>` of five seasons each with inline vignette, line, category links; from lg + motion (`story` state) items become 60svh scenes, sticky stage crossfades the active vignette (ScrollTrigger per scene), gold stream line scrubbed, active marker filled. `home.tsx`: hero -> chapter -> book-page `Section`s wrapped in `Reveal` -> closing still-pool band (`Landscape parallax` strip, "Find care by season" /services, "Contact us"). Data unchanged.
- Header: `HeaderScroll` sets `data-over-hero="light|band"` from the hero; light = see-through with linen tokens (charcoal on the dawn sky), band = existing `header-over-hero`.
- Files: src/components/site/{home.tsx,home-story.tsx,header-scroll.tsx,site-header.tsx}, test/{home,site-shell}.test.tsx, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/home.test.tsx test/site-shell.test.tsx test/art.test.tsx test/shader.test.tsx test/motion.test.tsx test/contrast.test.ts` 47/47 (home 8: CTAs, light hero no canvas under reduced motion, five season links in order in an `<ol>` with line + vignette, no story attrs without motion, still-pool CTA, server HTML holds all text with no inline from-states, empty sections hidden; site-shell: light tone). `check:copy` ok.
- Open: not run in a browser (no dev server in this task): pin + scene timing, hero copy contrast over the shader light, and 360 px layout to check in 1.10 GATE. Hero pin is md+ only; mobile has reveals and inline vignettes. `home.test` stubs matchMedia (gsap needs it at import).

- 1.10e Hero shader - done 2026-10-19: raw WebGL2 water + light sky (`WellspringShader`) over the SVG fallback, guards in `src/domain/shader.ts` (WebGL2, reduced motion, saveData, >=768px, DPR <= 1.5), pause offscreen/hidden.
- 1.10d Vector art set - done 2026-10-19: `src/components/art/` landscape layers (viewBox 1440x900, `LANDSCAPE_LAYERS` depths) + five season vignettes, 16 `--art-*` tokens via `art()`, /dev/ui specimen; 16/16.
- 1.10c Motion foundation - done 2026-10-19: `src/components/motion/` (gsap tokens, `useReducedMotion` server=reduced, `MotionProvider` Lenis on GSAP ticker, `Reveal`, `Parallax`), mounted on the public layout; 28/28.
- 1.10b Header + nav redesign - done 2026-10-19: `NAV_GROUPS` + flat `MAIN_NAV`, shadcn navigation-menu, one-row sticky header from lg (`HeaderScroll` over-hero/hidden attrs), forest mobile Dialog overlay, footer Explore nav; 58/58.
- 1.10a RESEARCH Motion + imagery direction - done 2026-10-19: ADR 007 wellspring story, GSAP + Lenis + one raw WebGL2 shader, stock rules, one-row grouped nav; gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.26 pinned; PLAN 1.10b-h + GATE.
- 1.9 GATE + write Phase 2 tasks - done 2026-10-19: first Playwright smoke (home -> services -> detail -> contact at 360/1280, no horizontal scroll), hermetic `test/e2e/server.ts`, Phase 2 tasks 2.1-2.10 written; 134/134 vitest, build ok, e2e 2/2.
- 1.9e Content, legal, contact, sign-in restyle - done 2026-10-19: `ContentPage` book page (measure, lede, gold hairline h2, margin note), `LegalPage` draft notice in margin, contact book-page + clearer `CONTACT_MESSAGES`, sign-in on shadcn inputs.
- 1.9d Services restyle - done 2026-10-19: directory grouped by life season (`groupServicesBySeason`, `#season-<key>`, gold markers, rows not cards), quiet category filter, detail with margin aside + package cards.
- 1.9c Home restyle - done 2026-10-19: forest-band hero (tagline, CTAs, pastoral-only note) + life-seasons `<ol>` path (`src/domain/seasons.ts`), book-page `Section`s below, no cards; header nav on its own row from xl.
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
