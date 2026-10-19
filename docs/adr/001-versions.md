# 001 Pinned versions (2026-10-19)
## Context
Task 0.2: pin current stable, mutually compatible versions. Source: npm registry (`npm view <pkg> dist-tags peerDependencies engines`), checked 2026-10-19. Node runtime >=20.19 (mongodb, mongodb-memory-server engines); dev machine Node 26.11. All pins exact (`--save-exact`).
## Options / Decision
| Package | Version | Why |
|---|---|---|
| next / eslint-config-next | 16.4.2 | `latest`; React ^19 peer |
| react / react-dom | 19.3.1 | `latest`; @types/react{,-dom} 19.3.0 |
| tailwindcss / @tailwindcss/turbopack | 4.3.3 | `latest` v4 |
| shadcn (CLI, dev) | 4.22.1 | `latest`; run via `npx shadcn add` |
| zod | 4.6.7 | `latest` v4 |
| react-hook-form | 7.90.0 | `latest` stable (v8 still beta) |
| @hookform/resolvers | 6.0.0 | `latest`; peers zod ^4, RHF ^7.55 |
| mongodb | 6.21.0 | NOT 7.x: @auth/mongodb-adapter peers `mongodb ^6` |
| mongodb-memory-server (dev) | 11.3.0 | `latest`; driver-independent |
| next-auth | 5.0.0-beta.32 | v5 still beta; v4 is pages-era. v5 is the App Router API |
| @auth/mongodb-adapter | 3.11.3 | `latest` |
| stripe | 23.0.0 | `latest`; set `apiVersion` explicitly in client |
| resend | 6.34.1 | `latest`; peer @react-email/render (via react-email) |
| react-email | 6.11.3 | replaces `@react-email/components`, deprecated on npm; v6 exports Html, Button, Tailwind... |
| date-fns / @date-fns/tz | 4.4.0 / 1.5.0 | `latest` |
| lucide-react | 1.59.0 | `latest`; React ^19 peer |
| vitest / @playwright/test (dev) | 5.0.5 / 1.64.1 | `latest`; Playwright satisfies next peer ^1.51 |
| typescript / eslint (dev) | 5.9.3 / 9.39.5 | Held: TS 7 (native) and ESLint 10 not yet adopted by next lint plugins; revisit later |
| server-only | 0.0.1 | only release |
| @testing-library/react / dom / user-event, jsdom (dev) | 16.3.3 / 10.4.2 / 14.6.8 / 30.1.3 | Added 2026-10-19 (task 1.2, user approved): component + keyboard tests. RTL peers React ^19, dom ^10. jsdom per file via `// @vitest-environment jsdom` |
| @next/mdx / @mdx-js/loader / @mdx-js/react, @types/mdx (dev) | 16.4.2 / 3.1.1 / 3.1.1 / 2.0.14 | Added 2026-10-19 (task 1.6, user approved): content pages from `src/content/*.mdx` (PRD §4.2). @next/mdx tracks next; peers loader/react >=0.15. No remark/rehype plugins (Turbopack needs serializable options) |
## Risks
- Auth.js v5 has been beta since 2023 (last beta 2026-07-20); the project now sits under Better Auth and gets maintenance/security fixes only. Mitigation: exact pin, keep Auth.js inside `src/server/auth/`, so swapping it touches only that folder.
- mongodb held at 6.x until the adapter allows ^7. Driver 6.21 is still maintained (`6x` tag).
- react-email 6 bundles its CLI (esbuild, socket.io) as a runtime dependency. Heavy, but these deps don't end up in the client bundle.
## Verification
`npm ls --depth=0` no invalid/missing peers; `npm run typecheck` pass; eslint clean; `npx vitest run test/smoke.test.ts` 1/1; `npm audit --omit=dev` 0 vulnerabilities (9 high are dev-only, not reviewed).
## Consequences
Upgrades are deliberate: bump here first, then install. Blocked install scripts: fsevents, unrs-resolver, mongodb-memory-server (its binary downloads on first use instead).
