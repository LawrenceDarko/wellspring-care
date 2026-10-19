// Public site navigation (PRD §4.1). Some routes land in later Phase 1 tasks.

export type NavLink = { href: string; label: string };

export const MAIN_NAV: readonly NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/programs", label: "Programs" },
  { href: "/chaplaincy", label: "Chaplaincy" },
  { href: "/weddings", label: "Weddings" },
  { href: "/funerals", label: "Funerals & Memorials" },
  { href: "/events", label: "Events & Retreats" },
  { href: "/prayer", label: "Prayer Requests" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_NAV: readonly NavLink[] = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/cancellation", label: "Cancellation" },
  { href: "/legal/refund", label: "Refunds" },
  { href: "/legal/accessibility", label: "Accessibility" },
  { href: "/legal/service-scope", label: "Service scope" },
];
