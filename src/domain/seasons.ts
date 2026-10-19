// Life seasons (ADR 006): the site's one signature device. Services follow a real
// life course, so the order here is meaningful and is rendered as an ordered list.
// Pure data + lookups; the home hero and the services directory (1.9d) group by it.

export type SeasonKey = "marriage" | "family" | "renewal" | "illness" | "loss";

export type Season = {
  key: SeasonKey;
  name: string;
  /** One short line, shown under the name on the path. */
  line: string;
  /** Service category slugs that belong to this season (may be empty). */
  categorySlugs: readonly string[];
  /** Where the season links: a page, or its group on the services directory. */
  href: string;
};

export const SEASONS: readonly Season[] = [
  {
    key: "marriage",
    name: "Marriage",
    line: "Preparing to marry and planning the ceremony.",
    categorySlugs: [],
    href: "/weddings",
  },
  {
    key: "family",
    name: "Family",
    line: "Care for couples, parents and the whole household.",
    categorySlugs: ["marriage-and-family"],
    href: "/services#season-family",
  },
  {
    key: "renewal",
    name: "Renewal",
    line: "Spiritual direction, renewal and rest for those who serve.",
    categorySlugs: ["spiritual-care", "ministry-and-leadership"],
    href: "/services#season-renewal",
  },
  {
    key: "illness",
    name: "Illness and hospice",
    line: "Chaplaincy for patients, caregivers and families.",
    categorySlugs: ["chaplaincy"],
    href: "/services#season-illness",
  },
  {
    key: "loss",
    name: "Loss and memorial",
    line: "Grief care, funerals and memorial services.",
    categorySlugs: ["grief-and-hard-times"],
    href: "/services#season-loss",
  },
];

const BY_CATEGORY = new Map(SEASONS.flatMap((s) => s.categorySlugs.map((slug) => [slug, s] as const)));

/** The season a service category belongs to, or undefined for unmapped categories. */
export function seasonForCategory(categorySlug: string): Season | undefined {
  return BY_CATEGORY.get(categorySlug);
}

/** Groups items with a category slug by season, in season order. Unmapped items go to `other`. */
export function groupBySeason<T extends { slug: string }>(
  categories: readonly T[],
): { seasons: { season: Season; items: T[] }[]; other: T[] } {
  const seasons = SEASONS.map((season) => ({ season, items: [] as T[] }));
  const other: T[] = [];
  for (const c of categories) {
    const s = seasonForCategory(c.slug);
    if (s) seasons.find((g) => g.season.key === s.key)!.items.push(c);
    else other.push(c);
  }
  return { seasons, other };
}
