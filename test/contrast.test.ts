import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLOBALS_CSS, checkContrast, contrastRatio, parseTokens } from "../scripts/check-contrast.ts";

const css = readFileSync(GLOBALS_CSS, "utf8");

describe("design token contrast (PRD §4.4)", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("every token pair in globals.css meets its minimum", () => {
    const failed = checkContrast(css).filter((r) => !r.ok);
    expect(failed).toEqual([]);
  });

  it("flags a failing pair and an undefined token", () => {
    const bad = ":root { --a: #777777; --b: #ffffff; }";
    expect(checkContrast(bad, [{ fg: "a", bg: "b", min: 4.5, use: "t" }])[0].ok).toBe(false);
    expect(() => checkContrast(bad, [{ fg: "missing", bg: "b", min: 3, use: "t" }])).toThrow(/--missing/);
  });

  it("tokens are hex and light only (no dark overrides)", () => {
    const tokens = parseTokens(css);
    expect(tokens.get("background")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(css).not.toMatch(/\.dark\s*\{/);
  });

  it("generated components keep a solid focus ring (translucent ring fails 3:1)", () => {
    const dir = new URL("../src/components/ui/", import.meta.url);
    for (const file of readdirSync(dir)) {
      expect(readFileSync(new URL(file, dir), "utf8"), file).not.toMatch(/(ring|outline)-ring\/\d+/);
    }
  });
});
