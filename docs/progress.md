# Progress

Current task: 0.9 GATE + plan Phase 2 detail check

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

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

## 0.7b Auth.js core - done 2026-10-19
- Done: `src/server/auth/index.ts` (server-only): `createAuthConfig(deps)` = MongoDB adapter (users/accounts/sessions/verification_tokens), `session.strategy: "database"`, email provider (15 min) sending `magicLinkEmail()` (generic subject, template `magic_link`) via `sendEmail()`, secure cookies forced in prod, pages signIn/error `/sign-in`, verifyRequest `/sign-in/check-email`. Session callback reads `user_roles` -> `session.user.{id, roles}`. `NextAuth(() => config)` lazy (no env at import): `handlers, auth, signIn, signOut`; `getAuthContext()` (React `cache`) -> `AuthContext | null`.
- `user_roles` zod + `$jsonSchema` (schemas/identity.ts, role enum = ROLES), registry (unique userId+role); `src/server/data/user-roles.ts` `listRolesForUser` (system-level). Route `src/app/api/auth/[...nextauth]/route.ts`. Vitest inlines next-auth (its `next/server` import fails under plain Node ESM).
- Files: src/server/auth/index.ts, src/server/data/{user-roles,registry,schemas/identity}.ts, src/app/api/auth/[...nextauth]/route.ts, test/auth.test.ts, vitest.config.ts, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/auth.test.ts test/db-ensure.test.ts test/email.test.ts test/authz` 26/26 pass. auth.test: CSRF -> signin/email -> 1 hashed verification token + 1 outbox mail -> callback consumes token, creates user + DB session -> /session returns roles from user_roles; DB rejects unknown role.
- Open: assignments in AuthContext empty until those collections exist. Staff 12h re-auth (PRD §13.2) not done. Google provider not added (optional). Production should set AUTH_URL (Auth.js trusts Host otherwise only outside prod). `/sign-in`, `/sign-in/check-email` pages come in 0.7c. Not tried with real Resend.

## 0.7a Email transport - done 2026-10-19
- Split: 0.7 was ~10 files, split (user approved) into 0.7a email transport, 0.7b Auth.js core, 0.7c sign-in + /dev/outbox pages (PLAN.md updated).
- Done: `email_outbox` zod + `$jsonSchema` in schemas/system.ts (`EMAIL_TEMPLATES` = PRD §14 list, `OUTBOX_TTL_MS` 7 days), registry entry (createdAt_desc, expiresAt TTL). `src/server/data/email-outbox.ts`: `insertOutboxEmail`, `listOutboxEmails` (system-level, no AuthContext, dev only). `src/server/email/index.ts`: `selectTransport(config)` = Resend if configured, outbox outside production, else null; `sendEmail(msg, transport?)` throws `EmailNotConfiguredError` when null; `emailAvailable()`; `EmailSendError` carries no content.
- Files: src/server/data/{schemas/system,registry,email-outbox}.ts, src/server/email/index.ts (removed .gitkeep), test/email.test.ts, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/email.test.ts test/db-ensure.test.ts` 10/10 pass (selection x3 incl. production refusal, outbox write + TTL index, newest first, app + DB validators reject bad template/recipient).
- Open: Resend transport not exercised against the real API (no key). No React Email templates yet; callers pass text/html. Outbox bodies hold sign-in links in dev: only /dev/outbox (0.7c) may read them.

## 0.6 Field encryption + audit + logger - done 2026-10-19
- Done: `src/server/crypto/field.ts` (server-only): AES-256-GCM, 12-byte random IV, 16-byte tag, stored `{v:1,kid,iv,tag,ct}`. `createKeyring(currentKid, {kid: b64})` (multi-key for rotation), `getKeyring()` from FIELD_ENC_KEY/KID, `encryptField(pt, aad?, ring?)`, `decryptField(f, aad?, ring?)`, `needsRotation`. Optional `aad` binds ciphertext to record (e.g. `pastoral_notes.body:<id>`). `FieldCryptoError` messages never carry data.
- `src/server/log.ts`: `log`, `createLogger(sink)`, `LOG_FIELDS` allowlist, primitives only, route query stripped, strings capped 200, `dropped` count; `errorFields(err)` = name only.
- `src/server/audit.ts`: `recordAudit(ctx|null, {action, targetType?, targetId?, meta?}, db?)`, `AUDIT_ACTIONS` (PRD §13.6 list), `AUDIT_META_FIELDS` allowlist. Writes via `src/server/data/audit-logs.ts` `insertAuditLog` (append-only, zod-validated).
- Files: src/server/{crypto/field,log,audit}.ts, src/server/data/audit-logs.ts, test/crypto/field.test.ts, test/log-audit.test.ts, docs. Removed `src/server/{audit,crypto}/.gitkeep` (audit is a file, not a dir).
- Tests: typecheck pass; eslint clean; `npx vitest run test/crypto test/log-audit.test.ts` 14/14 pass (round trip, fresh IV, tamper ct/tag/iv, unknown kid, wrong key, aad mismatch, rotation, stored doc no plaintext, logger drops non-allowlisted/objects/errors, audit meta allowlist, null system actor, unknown action rejected).
- Open: only one key from env today; retired keys for rotation need a config key (e.g. FIELD_ENC_OLD_KEYS) when rotation is first needed. Log/audit allowlists are my choice; extend per task. No audit read path yet (PRD §12.3, needs `audit:read`).

- 0.5 Authz core - done 2026-10-19: capability map, `AuthContext`, `requireUser`/`requireCapability`, `scopedCollection` + scopes; IDOR tests.
- 0.4 Mongo client + ensure - done 2026-10-19: `getDb()` cached client, registry + `ensureCollections`, zod + `$jsonSchema` by hand, `db:ensure` script; memory-server tests.
- 0.3 Env + config - done 2026-10-19: zod env in `src/server/config.ts` (`parseConfig`, `getConfig`, integration flags, `ConfigError` names keys only); vitest stubs `server-only`.
- 0.2 RESEARCH Pin versions - done 2026-10-19: all deps pinned exact in ADR 001; mongodb 6.21 (adapter peer), react-email 6.11.3, TS 5.9/ESLint 9 held; Auth.js v5 beta risk noted.
- 0.1 Scaffold - done 2026-10-19: Next 16.4.2 + React 19 scaffold, Vitest/Playwright configs, folder layout, `.env.example`; AGENTS.md not added; npm audit warnings unreviewed.
