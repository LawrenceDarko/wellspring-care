# 006 Design direction (2026-10-19)
## Context
PRD §4.4 fixes the palette family (ivory, forest, restrained gold, charcoal), serif display + humanist sans, rounded-lg, no SaaS look. Phase 1 UI followed it but defaulted to generic patterns (card grids, cream page). Task 1.9a applies `.claude/skills/frontend-design` to set one direction for all UI, now and later.
## Options
- Keep tokens, restyle per page ad hoc: inconsistent, drifts back to defaults.
- New palette: violates PRD §4.4.
- Same hues refined + one signature device + structural rules (chosen).
## Decision
- Signature: the life-seasons path. Services follow a real life course (marriage, family, renewal, illness and hospice, loss and memorial), so it is a true sequence. It opens the home hero (typeset in Fraunces on a forest band, gold markers) and groups the services directory. It is the only bold element; everything else stays quiet.
- Color (hex in `:root`): linen `#f6f5ef` page, forest `#1f4d3a` primary and full-width bands, moss `#dfe7dd` quiet surfaces, gold `#8a6a1f` (`#d2b46a` on band) for rules and markers only, charcoal `#262624` text. Hover/selected surfaces are pale moss, not gold.
- Calibration: ivory + serif + warm accent is close to the stock generated look. Countered by forest as the dominant mass (bands), a cooler linen, gold never as a fill.
- Type: Fraunces (ADR 002) as the display voice: `type-display` utility (SOFT 50, -0.02em). Source Sans 3 body at 17px/1.65. Scale ratio 1.25: `text-body`, `text-lede`, `text-h3`, `text-h2`, `text-h1`, `text-display`. Measure `max-w-measure` (65ch).
- Layout: left aligned, book page. Desktop: a narrow margin column holds side notes (eligibility, pastoral-care-only line, emergency notice); mobile stacks to one column. Sections separated by space and a gold hairline, not boxes.
- Surfaces: `band` utility = forest background, linen text, linen focus ring (forest ring is invisible on forest).
## Rules for every UI task
1. One bold element per page at most; the seasons path is the site's.
2. Sentence case. No all-caps labels, no eyebrow labels above headings, no single accented word in a headline, no `→` in buttons, no `A · B · C` meta strings.
3. Cards only for things a person chooses between (packages, cohorts). Lists, definition lists or tables otherwise. Radius: controls `rounded-md`, chosen objects `rounded-lg`.
4. Numbered markers only for real sequences (seasons, enrollment steps, timelines).
5. No motion on page load. Motion only answers an action (open, expand, confirm); `prefers-reduced-motion` already enforced.
6. Copy: plain verbs, active voice, a CTA names what happens; errors say what went wrong and how to fix it; empty states invite the next action.
7. Staff/portal UI: same tokens, denser and calmer; no bands, no display type.
8. Quality floor: 360/768/1280 px, 44px targets, visible focus, `npm run check:contrast` after any token change.
## Verification
`npm run check:contrast` 28/28 pairs incl. band pairs. `/dev/ui` shows scale and band.
## Consequences
Tasks 1.9b-e restyle existing pages to these rules before the 1.9 GATE. Future UI tasks cite this ADR. Token values changed, so screenshots from before 1.9a are stale.
