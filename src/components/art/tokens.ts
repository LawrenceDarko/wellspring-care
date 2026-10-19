// Art palette (ADR 007 Vectors). The hex values live in globals.css `:root` as `--art-*`;
// components only ever reference them through `art()`, so the art follows the tokens.

export const ART_TOKENS = [
  "sky-high",
  "sky-low",
  "sky-dusk",
  "sky-night",
  "sun",
  "moon",
  "lamp",
  "hill-far",
  "hill-mid",
  "hill-near",
  "ground",
  "tree",
  "stone",
  "water",
  "water-light",
  "bird",
] as const;

export type ArtToken = (typeof ART_TOKENS)[number];

/** CSS value for an art token, for `style={{ fill }}` / `stopColor` (var() in style, not attributes). */
export function art(token: ArtToken): string {
  return `var(--art-${token})`;
}

/** Lens-shaped tree crown on a trunk, standing at (x, y). Shared by the landscape and vignettes. */
export function treePath(x: number, y: number, h: number, w: number): string {
  const top = y - h;
  const crownBase = y - h * 0.18;
  return [
    `M${x} ${crownBase}`,
    `C${x - w} ${crownBase - h * 0.3} ${x - w * 0.55} ${top + h * 0.1} ${x} ${top}`,
    `C${x + w * 0.55} ${top + h * 0.1} ${x + w} ${crownBase - h * 0.3} ${x} ${crownBase}`,
    `Z M${x - w * 0.06} ${crownBase - 2} H${x + w * 0.06} V${y} H${x - w * 0.06} Z`,
  ].join(" ");
}
