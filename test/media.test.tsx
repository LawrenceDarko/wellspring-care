// @vitest-environment jsdom
import "./helpers/match-media";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MEDIA, MEDIA_LIST } from "@/content/media";

const PUBLIC_DIR = path.resolve(__dirname, "../public");
const MEDIA_DIR = path.join(PUBLIC_DIR, "media");

describe("stock media registry", () => {
  it("stays within the ADR 007 budget of 10 images", () => {
    expect(MEDIA_LIST.length).toBeGreaterThan(0);
    expect(MEDIA_LIST.length).toBeLessThanOrEqual(10);
  });

  it.each(Object.entries(MEDIA))("%s has alt, credit, source, licence and real size", (_key, m) => {
    expect(m.alt.trim().length).toBeGreaterThan(15);
    expect(m.credit.trim()).not.toBe("");
    expect(m.sourceUrl).toMatch(/^https:\/\/unsplash\.com\/photos\/[\w-]+$/);
    expect(m.licence).toBe("Unsplash License");
    expect(m.width).toBeGreaterThan(0);
    expect(m.height).toBeGreaterThan(0);
  });

  it.each(Object.entries(MEDIA))("%s file exists in public/media and is under 1 MB", (_key, m) => {
    const file = path.join(PUBLIC_DIR, m.src);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(1024 * 1024);
  });

  it("has no unregistered or duplicate files in public/media", () => {
    const registered = MEDIA_LIST.map((m) => path.basename(m.src));
    expect(new Set(registered).size).toBe(registered.length);
    expect(readdirSync(MEDIA_DIR).sort()).toEqual([...registered].sort());
  });

  it("never shows a face (people only as hands or from behind)", () => {
    for (const m of MEDIA_LIST) expect(["none", "hands", "from-behind"]).toContain(m.people);
  });
});

