import { cacheLife, cacheTag } from "next/cache";
import { HomeSections, type HomeData } from "@/components/site/home";
import { ConfigError } from "@/server/config";
import { listCategories } from "@/server/data/catalog";
import { listPublishedTestimonials, listUpcomingEvents } from "@/server/data/content";
import { errorFields, log } from "@/server/log";
import { getSettings, SETTINGS_DEFAULTS } from "@/server/data/settings";

async function loadHome(): Promise<HomeData> {
  "use cache";
  cacheTag("organization-settings", "catalog", "events", "testimonials");
  try {
    const [settings, categories, events, testimonials] = await Promise.all([
      getSettings(),
      listCategories(),
      listUpcomingEvents({ limit: 3 }),
      listPublishedTestimonials({ limit: 3 }),
    ]);
    // Minutes, not hours: past events must drop off and revoked consent must hide quickly.
    cacheLife("minutes");
    return { settings, categories, events, testimonials };
  } catch (err) {
    // No DB configured (e.g. build without MONGODB_URI): render without DB sections.
    if (!(err instanceof ConfigError)) throw err;
    log.warn("home.defaults", errorFields(err));
    cacheLife("minutes");
    return { settings: { ...SETTINGS_DEFAULTS }, categories: [], events: [], testimonials: [] };
  }
}

export default async function HomePage() {
  return <HomeSections {...(await loadHome())} />;
}
