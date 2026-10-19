// Public site navigation (PRD §4.1, ADR 007 Nav). Some routes land in later Phase 1 tasks.

export type NavLink = { href: string; label: string; description?: string };
export type NavGroup = { label: string; links: readonly NavLink[] };
export type NavEntry = NavLink | NavGroup;

export const isNavGroup = (entry: NavEntry): entry is NavGroup => "links" in entry;

/** Header order. Groups follow need (receive care / gather and grow), not org structure. */
export const NAV_GROUPS: readonly NavEntry[] = [
  {
    label: "Care",
    links: [
      { href: "/services", label: "Services", description: "Every kind of care we offer, by life season." },
      { href: "/chaplaincy", label: "Chaplaincy", description: "Spiritual presence in hospice, hospitals and care homes." },
      { href: "/weddings", label: "Weddings", description: "Christian ceremonies, from vow renewals to church weddings." },
      {
        href: "/funerals",
        label: "Funerals & memorials",
        description: "Honoring the person you love, at your pace.",
      },
    ],
  },
  {
    label: "Programs & events",
    links: [
      { href: "/programs", label: "Programs", description: "Scripture, prayer and reflection for a season of strain." },
      { href: "/events", label: "Events & retreats", description: "Gatherings, retreats and quiet days." },
      { href: "/resources", label: "Resources", description: "Readings and devotional plans." },
    ],
  },
  { href: "/prayer", label: "Prayer" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Primary action: every request belongs to a service, so it opens the season-grouped directory. */
export const REQUEST_CARE: NavLink = { href: "/services", label: "Request care" };

/** Flat list of every header destination (footer, sitemap). */
export const MAIN_NAV: readonly NavLink[] = NAV_GROUPS.flatMap((entry) =>
  isNavGroup(entry) ? entry.links : [entry],
);

export const LEGAL_NAV: readonly NavLink[] = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/cancellation", label: "Cancellation" },
  { href: "/legal/refund", label: "Refunds" },
  { href: "/legal/accessibility", label: "Accessibility" },
  { href: "/legal/service-scope", label: "Service scope" },
];
