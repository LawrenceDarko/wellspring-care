import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parseTokens } from "../scripts/check-contrast";
import { SEASONS } from "@/domain/seasons";

// Parallax is a GSAP client island (covered in motion.test.tsx); here it only marks its depth.
vi.mock("@/components/motion", () => ({
  Parallax: ({ children, speed }: { children: React.ReactNode; speed: number }) => (
    <div data-speed={speed}>{children}</div>
  ),
}));

const { ART_TOKENS, LANDSCAPE_LAYERS, Landscape, SEASON_ART, SeasonArt } = await import("@/components/art");

const HEX = /#[0-9a-f]{3,8}\b/i;
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const SOURCES = ["landscape.tsx", "seasons-art.tsx", "tokens.ts"].map((f) => [f, read(`../src/components/art/${f}`)]);

/** Every <svg> in the markup, as its opening tag. */
const svgTags = (html: string) => html.match(/<svg[^>]*>/g) ?? [];

describe("vector art (ADR 007 Vectors)", () => {
  it("every art token is defined as hex in globals.css and used through var()", () => {
    const tokens = parseTokens(read("../src/app/globals.css"));
    for (const t of ART_TOKENS) expect(tokens.get(`art-${t}`), t).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("source has no hard-coded colours outside the tokens", () => {
    for (const [file, src] of SOURCES) {
      expect(src, file).not.toMatch(HEX);
      expect(src, file).not.toMatch(/\b(rgb|hsl|oklch)a?\(/);
      for (const [, name] of src.matchAll(/var\(--art-([\w-]+)\)/g)) expect(ART_TOKENS, file).toContain(name);
    }
  });

  it("each landscape layer is its own aria-hidden svg on one viewBox", () => {
    const html = renderToStaticMarkup(<Landscape />);
    const tags = svgTags(html);
    expect(tags).toHaveLength(LANDSCAPE_LAYERS.length);
    expect(LANDSCAPE_LAYERS.map((l) => l.key)).toEqual(["sky", "far-hills", "near-hills", "water", "trees", "birds"]);
    for (const tag of tags) {
      expect(tag).toContain('aria-hidden="true"');
      expect(tag).toContain('focusable="false"');
      expect(tag).toContain('viewBox="0 0 1440 900"');
    }
    expect(html).toMatch(/^<div aria-hidden="true"/);
    expect(html).not.toMatch(HEX);
    expect(html).not.toContain("data-speed");
  });

  it("parallax wraps every moving layer at its depth; the foreground stays put", () => {
    const html = renderToStaticMarkup(<Landscape parallax />);
    const speeds = [...html.matchAll(/data-speed="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(speeds).toEqual(LANDSCAPE_LAYERS.filter((l) => l.speed !== 0).map((l) => l.speed));
    expect(LANDSCAPE_LAYERS.find((l) => l.key === "trees")?.speed).toBe(0);
  });

  it("there is one aria-hidden vignette per life season, with unique gradient ids", () => {
    expect(Object.keys(SEASON_ART)).toEqual(SEASONS.map((s) => s.key));
    const html = renderToStaticMarkup(
      <>
        {SEASONS.map((s) => (
          <SeasonArt key={s.key} season={s.key} />
        ))}
      </>,
    );
    const tags = svgTags(html);
    expect(tags).toHaveLength(SEASONS.length);
    for (const tag of tags) {
      expect(tag).toContain('aria-hidden="true"');
      expect(tag).toContain('viewBox="0 0 320 200"');
    }
    expect(html).not.toMatch(HEX);
    expect(html).not.toMatch(/<(title|text)\b/);
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
  });
});
