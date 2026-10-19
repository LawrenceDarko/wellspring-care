# Progress

Current task: 1.3 Catalog data + seed

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

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

## 0.8 Rate limit + public-form guard - done 2026-10-19
- Done: `src/server/data/rate-limits.ts` `incrementRateLimit` (upsert `$inc` on key+windowStart, retries once on E11000 race). `src/server/rate-limit.ts` (server-only): `checkRateLimit(scope, id, rule, deps)` fixed window, increment-then-check, `expiresAt` = window end (TTL index); `rateLimitKey` = HMAC-SHA256(AUTH_SECRET) of scope+lowercased id, so no raw IP/email stored; `RATE_LIMITS` (signInEmail 5/15m, signInIp 20/15m, publicForm 10/h), `rateLimit(scope, id)`, `clientIp(headers)`.
- `guardPublicForm(form, opts)`: honeypot `website` must be empty; `formToken` = signed server render time (`publicFormToken()`), min fill 3s, max age 24h; Origin vs APP_URL only when `headers` passed (route handlers). Returns `{ok}` or `{ok:false, reason}` (loggable code).
- Sign-in action now rate-limited by IP then email -> `?error=RateLimited` (generic message on page).
- Files: src/server/{rate-limit,data/rate-limits}.ts, test/rate-limit.test.ts, src/app/(public)/sign-in/{actions.ts,page.tsx}, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/rate-limit.test.ts` 7/7 pass (limit, reset next window, per-id buckets, hashed key + TTL expiry, 5 concurrent first hits -> count 5 / 3 allowed, honeypot, too fast/expired/missing/forged token, Origin).
- Open: sign-in form has no honeypot/token yet (needs page hidden fields; apply with first public form). Sign-in limit not exercised through the action (no test of the server action). `clientIp` trusts x-forwarded-for: fine behind Vercel/proxy, spoofable if exposed directly. CSP headers (PRD §13.5) not done: not in any task yet.

## 0.7c Sign-in + outbox pages - done 2026-10-19
- Done: `/sign-in` (server component, Suspense): email form -> server action `requestMagicLink` (zod email, `signIn("email")`, callbackUrl limited to same-origin relative paths, Auth.js errors -> `?error=EmailSignin`, logged by `errorName` only). Generic messages per `?error=` code. Shows "Sign-in is not configured" when env is missing (ConfigError) or no email transport. `/sign-in/check-email` static page. `/dev/outbox`: `notFound()` in production, else `listOutboxEmails` newest first, links clickable, noindex.
- Files: src/app/(public)/sign-in/{page,actions}.ts(x), src/app/(public)/sign-in/check-email/page.tsx, src/app/dev/outbox/page.tsx, docs.
- Tests: typecheck pass; eslint clean. Dev server (port 3123, start/curl/kill): /sign-in 200 with form when MONGODB_URI+AUTH_SECRET+FIELD_ENC_KEY set; "not configured" when FIELD_ENC_KEY missing; `?error=Verification` shows expired-link message; /sign-in/check-email 200.
- Open: /dev/outbox not exercised (no local mongod); no automated test for the pages or action. No rate limit on sign-in yet (0.8). Unstyled until 1.1 tokens/shadcn. Sign-in submit not tried end to end in a browser.

- 0.7b Auth.js core - done 2026-10-19: Mongo adapter, DB sessions, email magic link, `user_roles` -> session roles, `getAuthContext()`.
- 0.7a Email transport - done 2026-10-19: `email_outbox` + TTL, `sendEmail` (Resend or dev outbox, refuses in prod without Resend), `EmailNotConfiguredError`.
- 0.6 Field encryption + audit + logger - done 2026-10-19: AES-256-GCM `encryptField`/`decryptField` with kid + aad, allowlisted logger, `recordAudit` with meta allowlist.
- 0.5 Authz core - done 2026-10-19: capability map, `AuthContext`, `requireUser`/`requireCapability`, `scopedCollection` + scopes; IDOR tests.
- 0.4 Mongo client + ensure - done 2026-10-19: `getDb()` cached client, registry + `ensureCollections`, zod + `$jsonSchema` by hand, `db:ensure` script; memory-server tests.
- 0.3 Env + config - done 2026-10-19: zod env in `src/server/config.ts` (`parseConfig`, `getConfig`, integration flags, `ConfigError` names keys only); vitest stubs `server-only`.
- 0.2 RESEARCH Pin versions - done 2026-10-19: all deps pinned exact in ADR 001; mongodb 6.21 (adapter peer), react-email 6.11.3, TS 5.9/ESLint 9 held; Auth.js v5 beta risk noted.
- 0.1 Scaffold - done 2026-10-19: Next 16.4.2 + React 19 scaffold, Vitest/Playwright configs, folder layout, `.env.example`; AGENTS.md not added; npm audit warnings unreviewed.
