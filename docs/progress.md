# Progress

Current task: 0.7 Auth.js wiring

<!-- Each entry max 12 lines: task, done, files touched, tests run (real results), open issues. Keep the last 5; collapse older to one line. -->

## 0.6 Field encryption + audit + logger - done 2026-10-19
- Done: `src/server/crypto/field.ts` (server-only): AES-256-GCM, 12-byte random IV, 16-byte tag, stored `{v:1,kid,iv,tag,ct}`. `createKeyring(currentKid, {kid: b64})` (multi-key for rotation), `getKeyring()` from FIELD_ENC_KEY/KID, `encryptField(pt, aad?, ring?)`, `decryptField(f, aad?, ring?)`, `needsRotation`. Optional `aad` binds ciphertext to record (e.g. `pastoral_notes.body:<id>`). `FieldCryptoError` messages never carry data.
- `src/server/log.ts`: `log`, `createLogger(sink)`, `LOG_FIELDS` allowlist, primitives only, route query stripped, strings capped 200, `dropped` count; `errorFields(err)` = name only.
- `src/server/audit.ts`: `recordAudit(ctx|null, {action, targetType?, targetId?, meta?}, db?)`, `AUDIT_ACTIONS` (PRD §13.6 list), `AUDIT_META_FIELDS` allowlist. Writes via `src/server/data/audit-logs.ts` `insertAuditLog` (append-only, zod-validated).
- Files: src/server/{crypto/field,log,audit}.ts, src/server/data/audit-logs.ts, test/crypto/field.test.ts, test/log-audit.test.ts, docs. Removed `src/server/{audit,crypto}/.gitkeep` (audit is a file, not a dir).
- Tests: typecheck pass; eslint clean; `npx vitest run test/crypto test/log-audit.test.ts` 14/14 pass (round trip, fresh IV, tamper ct/tag/iv, unknown kid, wrong key, aad mismatch, rotation, stored doc no plaintext, logger drops non-allowlisted/objects/errors, audit meta allowlist, null system actor, unknown action rejected).
- Open: only one key from env today; retired keys for rotation need a config key (e.g. FIELD_ENC_OLD_KEYS) when rotation is first needed. Log/audit allowlists are my choice; extend per task. No audit read path yet (PRD §12.3, needs `audit:read`).

## 0.5 Authz core - done 2026-10-19
- Done: `src/server/auth/capabilities.ts` (pure): `ROLES`, `CAPABILITIES`, `ROLE_CAPABILITIES` per PRD §2, `capabilitiesFor(roles)` union (unknown roles grant nothing). super_admin = all staff caps + break_glass, roles:grant, audit:read, settings:manage, content:manage. No reflection capability exists at all (owner scope only).
- `src/server/auth/context.ts` (server-only): `AuthContext { userId: ObjectId, capabilities: Set, assignments: {cohort|care_request|prayer_request|booking: ObjectId[]} }`, `buildAuthContext`, `AuthError(401|403)`, `hasCapability`, `requireUser`, `requireCapability`.
- `src/server/data/base.ts` (server-only): `scopedCollection(db, name, scope)` -> findOne/find (limit cap 500)/countDocuments/updateOne/deleteOne, each `$and`s scope with caller filter; empty scope throws `UnscopedQueryError`, null scope = deny. Scopes: `ownerScope`, `assignedScope(cap, kind, field)`, `capabilityScope`, `anyScope`.
- Files: src/server/auth/{capabilities,context}.ts, src/server/data/base.ts, test/authz/{capabilities,base}.test.ts, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/authz` 14/14 pass (role map, multi-role union, super_admin no reflection cap, 401/403, IDOR null, filter can't widen scope, out-of-scope writes no-op, unscoped refused, assigned needs cap+assignment).
- Open: `requireUser` takes a ctx; session -> AuthContext loader (Auth.js + user_roles + assignments) comes with the auth task. No scoped insert helper yet (inserts must stamp owner in each repo). Extra super_admin caps (audit/settings/content/roles) are my naming, not in PRD table.

## 0.4 Mongo client + ensure script - done 2026-10-19
- Done: `src/server/db.ts` (server-only) `getClient()`/`getDb()` cached on `globalThis` (connect promise reset on failure). `src/server/data/schemas/system.ts`: zod schema + hand-written `$jsonSchema` (strict, `additionalProperties: false`) for `organization_settings` (singleton via `key: "default"` + unique index), `audit_logs`, `rate_limits` (TTL `expiresAt`, unique key+window). `src/server/data/registry.ts`: `collections` + `ensureCollections(db)` (createCollection or collMod, named indexes). `scripts/db-ensure.ts` reads only MONGODB_URI/MONGODB_DB; `db:ensure` loads `.env.local` if present.
- Files: src/server/db.ts, src/server/data/{registry.ts,schemas/system.ts}, scripts/db-ensure.ts, test/helpers/mongo.ts, test/db-ensure.test.ts, package.json, docs.
- Tests: typecheck pass; eslint clean; `npx vitest run test/db-ensure.test.ts` 4/4 pass (ensure x2 idempotent, TTL, valid insert ok, invalid + duplicate singleton rejected); config+smoke 8/8. Script without URI exits 1 (imports resolve under Node).
- Open: zod and `$jsonSchema` are maintained by hand side by side (no generator); keep in step. Script not run against a real Atlas/local mongod. mongodb-memory-server downloaded MongoDB 8.2.6 on first run (~77 MB, cached).

## 0.3 Env + config - done 2026-10-19
- Done: `src/server/config.ts` (`import "server-only"`): zod schema for every `.env.example` key; "" treated as unset; required MONGODB_URI (mongodb[+srv]://), AUTH_SECRET (>=32 chars), FIELD_ENC_KEY (base64, 32 bytes); defaults APP_URL/MONGODB_DB/FIELD_ENC_KID. `parseConfig(env)` pure, `getConfig()` cached from process.env. `integrations.{stripe,email,googleCalendar}` true only when all their keys set. `ConfigError` lists key names only, never values.
- Vitest aliases `server-only` to `test/helpers/server-only.ts` (real package throws outside RSC builds).
- Files: src/server/config.ts, test/config.test.ts, test/helpers/server-only.ts, vitest.config.ts, docs/MAP.md, docs/progress.md.
- Tests: typecheck pass; eslint clean; `npx vitest run test/config.test.ts test/smoke.test.ts` 8/8 pass.
- Open: config not yet called at boot (first consumer: 0.4 `getDb()`). Stripe needs all 3 keys incl. publishable to count as configured.

## 0.2 RESEARCH Pin versions - done 2026-10-19
- Done: versions from npm registry (dist-tags + peers), all pinned exact; `docs/adr/001-versions.md` written. Installed zod, RHF, resolvers, mongodb, next-auth v5 beta, adapter, stripe, resend, react-email, date-fns(+tz), lucide-react, server-only; dev shadcn, mongodb-memory-server. react 19.3.0 -> 19.3.1.
- Deviations: mongodb 6.21.0 not 7.7.0 (adapter peers ^6). `react-email@6.11.3` replaces deprecated `@react-email/components` (PLAN named the old package). TS 5.9.3 / ESLint 9.39.5 held (TS 7, ESLint 10 out).
- Files: package.json, package-lock.json, docs/adr/001-versions.md, docs/MAP.md, docs/progress.md.
- Tests: `npm ls` no peer errors; typecheck pass; eslint clean; `npx vitest run test/smoke.test.ts` 1/1 pass; `npm audit --omit=dev` 0.
- Open: Auth.js v5 still beta, maintenance-only (risk in ADR). 9 high dev-only audit warnings. mongodb-memory-server postinstall blocked: binary downloads on first use (0.4).

- 0.1 Scaffold - done 2026-10-19: Next 16.4.2 + React 19 scaffold, Vitest/Playwright configs, folder layout, `.env.example`; AGENTS.md not added; npm audit warnings unreviewed.
