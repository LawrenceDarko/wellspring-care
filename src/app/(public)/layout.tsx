import { cacheLife, cacheTag } from "next/cache";
import { SiteFooter } from "@/components/site/site-footer";
import { MAIN_CONTENT_ID, SiteHeader, SkipLink } from "@/components/site/site-header";
import { ConfigError } from "@/server/config";
import { errorFields, log } from "@/server/log";
import { getSettings, SETTINGS_DEFAULTS, type SiteSettings } from "@/server/data/settings";

async function loadSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("organization-settings");
  try {
    const settings = await getSettings();
    cacheLife("hours");
    return settings;
  } catch (err) {
    // No DB configured (e.g. build without MONGODB_URI): render defaults, retry soon.
    if (!(err instanceof ConfigError)) throw err;
    log.warn("settings.defaults", errorFields(err));
    cacheLife("minutes");
    return { ...SETTINGS_DEFAULTS };
  }
}

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await loadSettings();
  return (
    <>
      <SkipLink />
      <SiteHeader siteName={settings.name} />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
