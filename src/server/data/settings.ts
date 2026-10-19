import "server-only";
import type { Db } from "mongodb";
import { getDb } from "../db";
import type { OrganizationSettings } from "./schemas/system";

// organization_settings singleton (PRD §1.2). Public read: every field here is
// shown on the public site (name, contact, hours), so no AuthContext is needed.
// Writes (admin, audit logged) come with the settings admin task.

export type SiteSettings = Omit<OrganizationSettings, "_id" | "key" | "createdAt" | "updatedAt">;

/** Used when the singleton doc is missing. Working name only; trademark check pending (PRD §1.2). */
export const SETTINGS_DEFAULTS: SiteSettings = Object.freeze({
  name: "Wellspring Holistic Chaplaincy & Family Care",
  tagline: "Walking With You Through Every Season of Life.",
  timezone: "America/New_York",
  currency: "USD",
});

const PUBLIC_FIELDS = {
  _id: 0,
  name: 1,
  tagline: 1,
  logoFileId: 1,
  contactEmail: 1,
  contactPhone: 1,
  address: 1,
  businessHours: 1,
  timezone: 1,
  currency: 1,
  legalEntityName: 1,
} as const;

/** Stored settings merged over `SETTINGS_DEFAULTS`; defaults alone when the doc is missing. */
export async function getSettings(db?: Db): Promise<SiteSettings> {
  const database = db ?? (await getDb());
  const doc = await database
    .collection<OrganizationSettings>("organization_settings")
    .findOne({ key: "default" }, { projection: PUBLIC_FIELDS });
  if (!doc) return { ...SETTINGS_DEFAULTS };
  const stored = Object.fromEntries(
    Object.entries(doc).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return { ...SETTINGS_DEFAULTS, ...stored } as SiteSettings;
}
