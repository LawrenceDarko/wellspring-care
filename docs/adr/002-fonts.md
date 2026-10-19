# 002 Fonts and UI kit (2026-10-19)
## Context
PRD §4.4: serif display + humanist sans body, ivory/forest green/gold/charcoal. Task 1.1, no research.
## Decision
- Display: Fraunces (variable, `opsz` + `SOFT` axes): warm, old-style serif that stays readable at heading sizes. Body: Source Sans 3 (variable): humanist sans, wide language coverage, good at small sizes.
- Loaded with `next/font/google` in `src/app/fonts.ts` (self-hosted at build, no visitor requests to Google, `display: swap`). Exposed as `--font-heading` / `--font-body`, mapped to Tailwind `font-display` / `font-sans`. h1-h3 use display by default.
- shadcn init (radix base, new-york style). It installed, now pinned exact: radix-ui 1.8.1, class-variance-authority 0.7.1, cn 0.5.0 (shadcn's own clsx + tailwind-merge replacement), tw-animate-css 1.4.0 (dev).
- Tokens are hex in `:root` so `scripts/check-contrast.ts` can verify them; light only (no `.dark` block).
- Focus ring: shadcn's `ring-ring/50` gave ~2.5:1 on ivory; changed to solid `ring-ring` (9:1). Keep this when adding components.
## Consequences
`next build`/`next dev` need network for the first font download. Vitest aliases `next/font/google` to `test/helpers/next-font.ts`; add new font loaders there. Re-run `npm run check:contrast` after any token change.
