# Codebase map

Max 60 lines. Each task updates this instead of future tasks exploring. One line per key module: path - purpose - main exports.

## Root config
- `package.json` - all deps pinned exact per `docs/adr/001-versions.md`. Scripts: dev, build, typecheck (`next typegen && tsc --noEmit`), test, test:e2e, db:ensure, db:seed. `"type": "module"`.
- `next.config.ts` - Next 16 (cacheComponents, partialPrefetching, Tailwind via turbopack loader).
- `tsconfig.json` - strict, `@/*` -> `src/*`, `allowImportingTsExtensions` (scripts run via Node type stripping).
- `eslint.config.mjs` - flat config, next core-web-vitals + typescript.
- `vitest.config.ts` - node env; includes `test/**/*.test.{ts,tsx}`, `src/**/*.test.{ts,tsx}`; excludes `test/e2e`; `@` alias; `server-only`, `next/font/google` -> stubs; inlines next-auth.
- `playwright.config.ts` - testDir `test/e2e`, chromium + mobile, webServer `npm run dev` (GATE only).
- `.env.example` - every env var with comments (PRD §17).

## src/
- `src/app/layout.tsx` - root layout; exports `metadata`; applies font variables from `src/app/fonts.ts` (Fraunces `--font-heading`, Source Sans 3 `--font-body`, ADR 002).
- `src/app/globals.css` - Tailwind v4 + shadcn; brand tokens (hex, light only) in :root, `@theme inline` mapping (`gold`, `font-display`); reduced-motion rule. Check with `npm run check:contrast`.
- `src/app/(public)/layout.tsx` - public shell: SkipLink, SiteHeader, `<main id="main">`, SiteFooter; settings via `"use cache"` tag `organization-settings` (defaults on ConfigError). Pages render `<div>`, not `<main>`.
- `src/app/(public)/page.tsx` - placeholder home with pastoral-care-only notice.
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js GET/POST handlers.
- `src/app/(public)/sign-in/` - magic-link form (`page.tsx`, server action `requestMagicLink` in `actions.ts`), `check-email/page.tsx`. "Not configured" state on missing env.
- `src/app/dev/outbox/page.tsx` - dev-only outbox viewer (404 in production). `src/app/dev/ui/page.tsx` - token + component preview (404 in production).
- `src/server/config.ts` - server-only zod env validation. Exports `parseConfig(env)`, `getConfig()` (cached), `ConfigError`, types `Env`, `Config` (`env`, `integrations.{stripe,email,googleCalendar}`).
- `src/server/db.ts` - server-only Mongo client cached on globalThis. Exports `getClient()`, `getDb()`. Only repositories in `src/server/data/` may call it.
- `src/server/auth/capabilities.ts` - pure role->capability map (PRD §2). Exports `ROLES`, `CAPABILITIES`, `ROLE_CAPABILITIES`, `capabilitiesFor(roles)`, `isRole`, types `Role`, `Capability`. Check capabilities, never role names.
- `src/server/auth/context.ts` - server-only. `AuthContext` type, `buildAuthContext`, `AuthError(401|403)`, `hasCapability`, `requireUser`, `requireCapability`.
- `src/server/auth/index.ts` - server-only Auth.js v5 (Mongo adapter, DB sessions, email magic link via sendEmail). `handlers`, `auth`, `signIn`, `signOut`, `getAuthContext()`, `createAuthConfig(deps)`, `magicLinkEmail`. Session has `user.{id, roles}`.
- `src/server/data/base.ts` - server-only scoped repo helper. `scopedCollection(db, name, scope)` (findOne/find/countDocuments/updateOne/deleteOne, all take ctx), scopes `ownerScope`, `assignedScope`, `capabilityScope`, `anyScope`, `UnscopedQueryError`. Every repository builds on this.
- `src/server/data/schemas/system.ts` - zod schemas + `$jsonSchema` validators (kept in step by hand) for organization_settings, audit_logs, rate_limits, email_outbox (`EMAIL_TEMPLATES`). Relative imports only (loaded by Node in scripts).
- `src/server/data/schemas/identity.ts` - `user_roles` zod + validator. Auth.js adapter collections (users, accounts, sessions, verification_tokens) have no validator.
- `src/server/data/user-roles.ts` - `listRolesForUser(db, userId)` (system-level, session callback only).
- `src/server/data/registry.ts` - `collections` (name, validator, named indexes) + `ensureCollections(db)` (idempotent). Add each new collection here.
- `src/server/crypto/field.ts` - server-only AES-256-GCM field encryption (PRD §13.3). `encryptField(pt, aad?)`, `decryptField(f, aad?)`, `createKeyring`, `getKeyring`, `needsRotation`, `FieldCryptoError`, type `EncryptedField`. Pass `aad` = `<collection>.<field>:<docId>`.
- `src/server/log.ts` - server-only structured logger, allowlisted primitive fields only. `log`, `createLogger(sink)`, `LOG_FIELDS`, `errorFields(err)`. Never log raw errors or user input.
- `src/server/audit.ts` - server-only `recordAudit(ctx|null, event, db?)`, `AUDIT_ACTIONS`, `AUDIT_META_FIELDS` (meta allowlist), `sanitizeAuditMeta`.
- `src/server/data/audit-logs.ts` - append-only `insertAuditLog(db, entry)`; used only by audit.ts. `src/server/data/email-outbox.ts` - dev outbox store: `insertOutboxEmail`, `listOutboxEmails` (system-level; only email transport + /dev/outbox).
- `src/server/email/index.ts` - server-only. `sendEmail(msg)` (Resend if configured, else `email_outbox` outside prod, else `EmailNotConfiguredError`), `selectTransport`, `emailAvailable`, `EMAIL_TEMPLATES`, type `EmailMessage`.
- `src/server/rate-limit.ts` - server-only PRD §13.5. `rateLimit(scope, id)`, `checkRateLimit`, `RATE_LIMITS`, `clientIp`, `guardPublicForm(form, {headers?})`, `publicFormToken()` (render as hidden `formToken`), `HONEYPOT_FIELD`. Store: `src/server/data/rate-limits.ts` `incrementRateLimit`.
- `src/server/payments/` - empty (.gitkeep).
- `src/components/site/` - `nav.ts` (`MAIN_NAV`, `LEGAL_NAV`), `site-header.tsx` (`SkipLink`, `SiteHeader`, `MAIN_CONTENT_ID`), `mobile-nav.tsx` (client Sheet), `site-footer.tsx` (`SiteFooter`, `EmergencyNotice` 911/988).
- `src/server/data/schemas/catalog.ts` - zod + validators for `service_categories`, `services`, `service_packages` (`CHANNELS`, cents). `src/server/data/catalog.ts` - public catalog read (active only): `listCategories`, `listServices({categorySlug?})`, `getServiceBySlug` (with active packages), types `Public*`.
- `src/server/data/settings.ts` - public `getSettings(db?)` (org settings merged over `SETTINGS_DEFAULTS`), type `SiteSettings`.
- `src/components/ui/` - shadcn (radix, `components.json`): button, card, input, label, textarea, select, dialog, badge, sheet. `cn` from package `cn` (also `@/lib/utils`). Keep focus rings solid (`ring-ring`, no `/50`).
- `src/domain/`, `src/content/`, `src/app/(portal)/`, `src/app/(staff)/` - empty (.gitkeep).

## scripts/
- `scripts/db-ensure.ts` - applies registry via `ensureCollections`; needs only MONGODB_URI/MONGODB_DB (`.env.local` auto-loaded).
- `scripts/db-seed.ts` - `npm run db:seed [-- --activate-packages]` (flag dev only). `scripts/seed/catalog.ts` - `CATALOG_SEED`, `seedCatalog(db, opts)` ($setOnInsert only, packages inactive).
- `scripts/check-contrast.ts` - WCAG check of token pairs in globals.css (`PAIRS`, `checkContrast`, `contrastRatio`).

## test/
- `test/smoke.test.ts` - alias + metadata smoke test. `test/config.test.ts` - config parsing, integration booleans, required-key errors.
- `test/db-ensure.test.ts` - ensure idempotency, TTL, validator accept/reject.
- `test/authz/` - capability map + scoped-collection IDOR tests (PRD §13.1 IDOR suite lives here).
- `test/crypto/field.test.ts`, `test/log-audit.test.ts` - encryption (tamper/kid/aad/rotation/no plaintext), logger allowlist, audit writes.
- `test/auth.test.ts` - Auth.js email sign-in end to end via handlers (token, outbox, session, roles).
- `test/rate-limit.test.ts` - fixed window limit/reset/concurrency, honeypot, form token, Origin. `test/email.test.ts` - transport selection, production refusal, outbox write/TTL/validators.
- `test/helpers/mongo.ts` - `startMongo()` -> `{ uri, client, db, stop }` on MongoMemoryReplSet. `test/helpers/server-only.ts`, `test/helpers/next-font.ts` - stubs vitest aliases `server-only` / `next/font/google` to.
- `test/contrast.test.ts` - token contrast pairs, light only, solid focus ring in ui components.
- `test/catalog.test.ts` (seed idempotent, inactive hidden), `test/settings.test.ts`, `test/site-shell.test.tsx` - settings defaults/merge; shell keyboard + footer (jsdom + Testing Library, `// @vitest-environment jsdom`).
- `test/e2e/` - Playwright specs (empty).
