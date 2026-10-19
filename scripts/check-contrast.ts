// WCAG 2.2 contrast check for design token pairs in src/app/globals.css (PRD §4.4).
// Text pairs need >= 4.5:1, UI pairs (control boundaries, focus ring, icons) >= 3:1.
// Run: npm run check:contrast. Tokens must be 6-digit hex so they can be checked here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type Pair = { fg: string; bg: string; min: 4.5 | 3; use: string };
export type PairResult = Pair & { ratio: number; ok: boolean };

const TEXT = 4.5;
const UI = 3;

// "#ffffff" is a literal colour (destructive button uses text-white), not a token.
export const PAIRS: Pair[] = [
  { fg: "foreground", bg: "background", min: TEXT, use: "body text" },
  { fg: "foreground", bg: "muted", min: TEXT, use: "text on muted surface" },
  { fg: "card-foreground", bg: "card", min: TEXT, use: "card text" },
  { fg: "popover-foreground", bg: "popover", min: TEXT, use: "popover text" },
  { fg: "primary-foreground", bg: "primary", min: TEXT, use: "primary button" },
  { fg: "primary", bg: "background", min: TEXT, use: "links, link buttons" },
  { fg: "primary", bg: "card", min: TEXT, use: "links on cards" },
  { fg: "secondary-foreground", bg: "secondary", min: TEXT, use: "secondary button, badge" },
  { fg: "muted-foreground", bg: "background", min: TEXT, use: "helper text" },
  { fg: "muted-foreground", bg: "card", min: TEXT, use: "helper text on cards" },
  { fg: "muted-foreground", bg: "muted", min: TEXT, use: "helper text on muted" },
  { fg: "accent-foreground", bg: "accent", min: TEXT, use: "hover/selected item" },
  { fg: "gold-foreground", bg: "gold", min: TEXT, use: "gold badge" },
  { fg: "destructive", bg: "background", min: TEXT, use: "error text" },
  { fg: "destructive", bg: "card", min: TEXT, use: "error text on cards" },
  { fg: "#ffffff", bg: "destructive", min: TEXT, use: "destructive button" },
  { fg: "sidebar-foreground", bg: "sidebar", min: TEXT, use: "staff sidebar text" },
  { fg: "sidebar-primary-foreground", bg: "sidebar-primary", min: TEXT, use: "sidebar active item" },
  { fg: "sidebar-accent-foreground", bg: "sidebar-accent", min: TEXT, use: "sidebar hover item" },
  { fg: "input", bg: "background", min: UI, use: "form control border" },
  { fg: "input", bg: "card", min: UI, use: "form control border on cards" },
  { fg: "ring", bg: "background", min: UI, use: "focus ring" },
  { fg: "ring", bg: "card", min: UI, use: "focus ring on cards" },
  { fg: "gold", bg: "background", min: UI, use: "gold icons and rules" },
  { fg: "primary", bg: "secondary", min: TEXT, use: "forest text on moss" },
  { fg: "band-foreground", bg: "band", min: TEXT, use: "text on forest band" },
  { fg: "band-muted", bg: "band", min: TEXT, use: "secondary text on forest band" },
  { fg: "band-gold", bg: "band", min: UI, use: "season markers on forest band" },
];

/** Reads `--name: #rrggbb;` declarations from the first `:root { ... }` block. */
export function parseTokens(css: string): Map<string, string> {
  const root = /:root\s*\{([^}]*)\}/.exec(css);
  if (!root) throw new Error("No :root block found");
  const tokens = new Map<string, string>();
  for (const m of root[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) tokens.set(m[1], m[2].trim());
  return tokens;
}

function channel(hex: string, i: number): number {
  const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function checkContrast(css: string, pairs: Pair[] = PAIRS): PairResult[] {
  const tokens = parseTokens(css);
  const resolve = (name: string) => {
    if (name.startsWith("#")) return name;
    const v = tokens.get(name);
    if (!v) throw new Error(`Token --${name} not defined in :root`);
    return v;
  };
  return pairs.map((p) => {
    const ratio = Math.floor(contrastRatio(resolve(p.fg), resolve(p.bg)) * 100) / 100;
    return { ...p, ratio, ok: ratio >= p.min };
  });
}

export const GLOBALS_CSS = fileURLToPath(new URL("../src/app/globals.css", import.meta.url));

if (import.meta.main) {
  const results = checkContrast(readFileSync(GLOBALS_CSS, "utf8"));
  for (const r of results) {
    console.log(`${r.ok ? "ok  " : "FAIL"} ${r.ratio.toFixed(2).padStart(5)} >= ${r.min}  ${r.fg} on ${r.bg} (${r.use})`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `check:contrast: ${failed} pair(s) below minimum.` : `check:contrast: ${results.length} pairs pass.`);
  if (failed) process.exitCode = 1;
}
