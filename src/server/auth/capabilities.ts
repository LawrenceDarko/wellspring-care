// PRD §2: roles are bundles of capabilities. Checks use capabilities, never
// role names. Pure module (no server-only) so domain code and tests can use it.

export const ROLES = [
  "client",
  "facilitator",
  "chaplain",
  "prayer_team",
  "coordinator",
  "event_planner",
  "finance",
  "program_admin",
  "reporting",
  "super_admin",
] as const;
export type Role = (typeof ROLES)[number];

export const CAPABILITIES = [
  "program:facilitate",
  "attendance:write",
  "announce:cohort",
  "care:provide",
  "pastoral_notes:write",
  "pastoral_notes:read_assigned",
  "appointments:manage_own",
  "prayer:read_assigned",
  "bookings:manage",
  "venues:manage",
  "payments:read",
  "invoices:manage",
  "scholarships:decide",
  "programs:manage",
  "cohorts:manage",
  "resources:manage",
  "reports:read",
  // super_admin only
  "pastoral_notes:break_glass",
  "roles:grant",
  "audit:read",
  "settings:manage",
  "content:manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

// There is deliberately no capability for reading another user's private
// reflections: they are readable only by their owner (repository owner scope).
// Clients hold no capabilities; "own records only" is enforced by owner scope.
const STAFF_ROLE_CAPABILITIES = {
  client: [],
  facilitator: ["program:facilitate", "attendance:write", "announce:cohort"],
  chaplain: [
    "care:provide",
    "pastoral_notes:write",
    "pastoral_notes:read_assigned",
    "appointments:manage_own",
  ],
  prayer_team: ["prayer:read_assigned"],
  coordinator: ["bookings:manage"],
  event_planner: ["bookings:manage", "venues:manage"],
  finance: ["payments:read", "invoices:manage", "scholarships:decide"],
  program_admin: ["programs:manage", "cohorts:manage", "resources:manage"],
  reporting: ["reports:read"],
} as const satisfies Record<Exclude<Role, "super_admin">, readonly Capability[]>;

const SUPER_ADMIN_ONLY = [
  "pastoral_notes:break_glass",
  "roles:grant",
  "audit:read",
  "settings:manage",
  "content:manage",
] as const satisfies readonly Capability[];

export const ROLE_CAPABILITIES: Readonly<Record<Role, readonly Capability[]>> = {
  ...STAFF_ROLE_CAPABILITIES,
  super_admin: [
    ...new Set<Capability>([...Object.values(STAFF_ROLE_CAPABILITIES).flat(), ...SUPER_ADMIN_ONLY]),
  ],
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Union of capabilities for every role held. Unknown role strings grant nothing. */
export function capabilitiesFor(roles: readonly string[]): ReadonlySet<Capability> {
  const caps = new Set<Capability>();
  for (const role of roles) {
    if (!isRole(role)) continue;
    for (const cap of ROLE_CAPABILITIES[role]) caps.add(cap);
  }
  return caps;
}
