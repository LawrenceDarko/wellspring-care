import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { slugParam, ServicesDirectory, type ServicesDirectoryData } from "@/components/site/services";
import { ConfigError } from "@/server/config";
import { listCategories, listServices } from "@/server/data/catalog";
import { errorFields, log } from "@/server/log";

export const metadata: Metadata = { title: "Services" };

async function loadDirectory(categorySlug: string | undefined): Promise<ServicesDirectoryData> {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  try {
    const categories = await listCategories();
    const selected = categories.find((c) => c.slug === categorySlug)?.slug;
    const services = await listServices({ categorySlug: selected });
    return { categories, services, selected, unknownCategory: categorySlug !== undefined && !selected };
  } catch (err) {
    // No DB configured (e.g. build without MONGODB_URI): render the empty directory.
    if (!(err instanceof ConfigError)) throw err;
    log.warn("services.defaults", errorFields(err));
    return { categories: [], services: [] };
  }
}

async function Directory({ searchParams }: { searchParams: PageProps<"/services">["searchParams"] }) {
  const { category } = await searchParams;
  return <ServicesDirectory {...await loadDirectory(slugParam(category))} />;
}

export default function ServicesPage({ searchParams }: PageProps<"/services">) {
  return (
    <Suspense fallback={<ServicesDirectory categories={[]} services={[]} />}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}
