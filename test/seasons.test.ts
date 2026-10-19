import { describe, expect, it } from "vitest";
import { groupBySeason, SEASONS, seasonForCategory } from "@/domain/seasons";

describe("life seasons", () => {
  it("follows the life course in order with unique keys", () => {
    expect(SEASONS.map((s) => s.key)).toEqual(["marriage", "family", "renewal", "illness", "loss"]);
  });

  it("maps every seeded category to exactly one season", () => {
    const seeded = ["spiritual-care", "chaplaincy", "grief-and-hard-times", "marriage-and-family", "ministry-and-leadership"];
    for (const slug of seeded) expect(seasonForCategory(slug)).toBeDefined();
    const all = SEASONS.flatMap((s) => s.categorySlugs);
    expect(new Set(all).size).toBe(all.length);
  });

  it("groups categories in season order and keeps unmapped ones aside", () => {
    const { seasons, other } = groupBySeason([
      { slug: "grief-and-hard-times" },
      { slug: "spiritual-care" },
      { slug: "unknown" },
    ]);
    expect(seasons.map((g) => g.season.key)).toEqual(SEASONS.map((s) => s.key));
    expect(seasons.find((g) => g.season.key === "renewal")!.items).toEqual([{ slug: "spiritual-care" }]);
    expect(seasons.find((g) => g.season.key === "loss")!.items).toEqual([{ slug: "grief-and-hard-times" }]);
    expect(other).toEqual([{ slug: "unknown" }]);
  });
});
