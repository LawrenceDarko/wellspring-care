import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { slugParam, ServiceDetail } from "@/components/site/services";
import { ConfigError } from "@/server/config";
import { getServiceBySlug, type PublicServiceDetail } from "@/server/data/catalog";
import { errorFields, log } from "@/server/log";

async function loadService(slug: string): Promise<PublicServiceDetail | null> {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  try {
    return await getServiceBySlug(slug);
  } catch (err) {
    // No DB configured: every service is unavailable.
    if (!(err instanceof ConfigError)) throw err;
    log.warn("service.defaults", errorFields(err));
    return null;
  }
}

/** Same slug rule as categories; malformed slugs never reach the DB. */
async function serviceFor(params: PageProps<"/services/[slug]">["params"]) {
  const slug = slugParam((await params).slug);
  return slug ? loadService(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = await serviceFor(params);
  return service ? { title: service.name, description: service.summary } : {};
}

async function Detail({ params }: { params: PageProps<"/services/[slug]">["params"] }) {
  const service = await serviceFor(params);
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}

export default function ServicePage({ params }: PageProps<"/services/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-14">Loading service...</div>}>
      <Detail params={params} />
    </Suspense>
  );
}
