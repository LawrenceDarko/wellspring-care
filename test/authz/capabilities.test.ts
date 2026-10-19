import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { CAPABILITIES, capabilitiesFor, ROLE_CAPABILITIES, ROLES } from "@/server/auth/capabilities";
import { AuthError, buildAuthContext, requireCapability, requireUser } from "@/server/auth/context";

describe("capability resolution", () => {
  it("maps each staff role to its PRD §2 capabilities", () => {
    expect([...capabilitiesFor(["facilitator"])].sort()).toEqual(
      ["announce:cohort", "attendance:write", "program:facilitate"].sort(),
    );
    expect([...capabilitiesFor(["finance"])].sort()).toEqual(
      ["invoices:manage", "payments:read", "scholarships:decide"].sort(),
    );
    expect(capabilitiesFor(["prayer_team"]).has("prayer:read_assigned")).toBe(true);
    expect(capabilitiesFor(["reporting"]).has("reports:read")).toBe(true);
  });

  it("gives clients and unknown roles no capabilities", () => {
    expect(capabilitiesFor(["client"]).size).toBe(0);
    expect(capabilitiesFor(["root", "admin", "__proto__"]).size).toBe(0);
    expect(capabilitiesFor([]).size).toBe(0);
  });

  it("unions capabilities across multiple roles", () => {
    const caps = capabilitiesFor(["chaplain", "coordinator", "event_planner"]);
    expect(caps.has("pastoral_notes:write")).toBe(true);
    expect(caps.has("bookings:manage")).toBe(true);
    expect(caps.has("venues:manage")).toBe(true);
    expect(caps.has("payments:read")).toBe(false);
    expect(caps.size).toBe(ROLE_CAPABILITIES.chaplain.length + 2);
  });

  it("super_admin holds every staff capability plus break-glass", () => {
    const admin = capabilitiesFor(["super_admin"]);
    for (const role of ROLES) for (const cap of ROLE_CAPABILITIES[role]) expect(admin.has(cap)).toBe(true);
    expect(admin.has("pastoral_notes:break_glass")).toBe(true);
    expect(admin.has("roles:grant")).toBe(true);
  });

  it("super_admin lacks any reflection read capability", () => {
    const admin = [...capabilitiesFor(["super_admin"])];
    expect(admin.some((c) => c.includes("reflection"))).toBe(false);
    // and no capability for reading reflections exists at all
    expect(CAPABILITIES.some((c) => c.includes("reflection"))).toBe(false);
  });

  it("break-glass is super_admin only", () => {
    for (const role of ROLES.filter((r) => r !== "super_admin")) {
      expect(ROLE_CAPABILITIES[role]).not.toContain("pastoral_notes:break_glass");
    }
  });
});

describe("requireUser / requireCapability", () => {
  const ctx = buildAuthContext({ userId: new ObjectId(), roles: ["chaplain"] });

  it("401 without a user", () => {
    expect(() => requireUser(null)).toThrow(AuthError);
    expect(() => requireCapability(undefined, "care:provide")).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("403 without the capability, passes with it", () => {
    expect(requireCapability(ctx, "care:provide")).toBe(ctx);
    expect(() => requireCapability(ctx, "payments:read")).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
});
