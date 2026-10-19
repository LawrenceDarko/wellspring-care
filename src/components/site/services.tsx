import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Money, PublicCategory, PublicPackage, PublicService, PublicServiceDetail } from "@/server/data/catalog";
import type { Channel, DepositRule } from "@/server/data/schemas/catalog";

// Services directory and detail (PRD §4.1, §5.2). Pure props so they render in
// tests without a DB. The only URL parameter is the category slug; nothing a
// visitor types ever goes into a URL.

const linkClass = "font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A route or `?category=` value, only when it is a well-formed slug; anything else is ignored. */
export function slugParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length <= 80 && SLUG_RE.test(v) ? v : undefined;
}

/** Intake for a service; the intake engine arrives in Phase 2. */
export function requestHref(serviceSlug: string) {
  return `/request/${serviceSlug}`;
}

export function formatMoney({ cents, currency }: Money) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const CHANNEL_LABELS: Record<Channel, string> = { in_person: "In person", video: "Video", phone: "Phone" };

function depositText(rule: DepositRule, currency: string) {
  if (rule.type === "percent") return `${rule.percent}% deposit to reserve`;
  if (rule.type === "fixed") return `${formatMoney({ cents: rule.amountCents, currency })} deposit to reserve`;
  return null;
}

function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-semibold md:text-5xl">{title}</h1>
      {children}
    </div>
  );
}

const SCOPE_NOTE =
  "Pastoral and spiritual care only. We are not a medical, mental-health or emergency provider.";

export type ServicesDirectoryData = {
  categories: PublicCategory[];
  services: PublicService[];
  /** Selected category slug, if it is an active category. */
  selected?: string;
  /** A category was requested but is not available. */
  unknownCategory?: boolean;
};

export function ServicesDirectory({ categories, services, selected, unknownCategory = false }: ServicesDirectoryData) {
  const current = categories.find((c) => c.slug === selected);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14">
      <PageHeader title="Services">
        <p className="max-w-3xl text-lg">
          Christian pastoral and spiritual care for individuals, couples and families. Choose a service to see
          what it includes and how to request it.
        </p>
        <p className="max-w-3xl text-sm">{SCOPE_NOTE}</p>
      </PageHeader>

      {categories.length > 0 ? (
        <nav aria-label="Service categories">
          <ul className="flex flex-wrap gap-2">
            {[{ slug: undefined, name: "All services" }, ...categories].map((c) => {
              const active = c.slug === current?.slug;
              return (
                <li key={c.slug ?? "all"}>
                  <Link
                    href={c.slug ? `/services?category=${c.slug}` : "/services"}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:bg-accent"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {unknownCategory ? (
        <p role="status" className="rounded-md border border-border bg-secondary p-4 text-secondary-foreground">
          That category is not available. Showing all services.
        </p>
      ) : null}

      <section aria-labelledby="services-list" className="flex flex-col gap-4">
        <h2 id="services-list" className="text-2xl font-semibold">
          {current ? current.name : "All services"}
        </h2>
        {current?.summary ? <p className="max-w-3xl">{current.summary}</p> : null}
        {services.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 text-card-foreground">
                <p className="text-sm">{s.category.name}</p>
                <h3 className="text-lg font-semibold">
                  <Link href={`/services/${s.slug}`} className={linkClass}>
                    {s.name}
                  </Link>
                </h3>
                <p>{s.summary}</p>
                <p className="mt-auto text-sm font-medium">
                  {s.startingPrice ? `From ${formatMoney(s.startingPrice)}` : "Pricing on request"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No services are listed here yet. Please check back soon or contact us.</p>
        )}
      </section>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PublicPackage }) {
  const deposit = depositText(pkg.depositRule, pkg.currency);
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h3 className="text-lg font-semibold">{pkg.name}</h3>
      <p className="text-2xl font-semibold">{formatMoney({ cents: pkg.priceCents, currency: pkg.currency })}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">Sessions</dt>
        <dd>
          {pkg.sessionCount} x {pkg.minutesPerSession} minutes
        </dd>
        <dt className="font-medium">Duration</dt>
        <dd>
          {pkg.durationWeeks} {pkg.durationWeeks === 1 ? "week" : "weeks"}
        </dd>
        <dt className="font-medium">Meets by</dt>
        <dd>{pkg.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}</dd>
        <dt className="font-medium">Response</dt>
        <dd>{pkg.responseTimeText}</dd>
      </dl>
      {pkg.includedItems.length > 0 ? (
        <ul className="list-disc pl-5 text-sm">
          {pkg.includedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {deposit || pkg.installmentsAllowed ? (
        <p className="text-sm">{[deposit, pkg.installmentsAllowed ? "Installments available" : null].filter(Boolean).join(". ")}</p>
      ) : null}
    </li>
  );
}

export function ServiceDetail({ service }: { service: PublicServiceDetail }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2 text-sm">
          <li>
            <Link href="/services" className={linkClass}>
              Services
            </Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li>
            <Link href={`/services?category=${service.category.slug}`} className={linkClass}>
              {service.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <PageHeader title={service.name}>
        <p className="max-w-3xl text-lg">{service.summary}</p>
        <p className="text-lg font-medium">
          {service.startingPrice ? `Starting at ${formatMoney(service.startingPrice)}` : "Pricing on request"}
        </p>
        <div>
          <Button asChild size="lg">
            <Link href={requestHref(service.slug)}>Request this service</Link>
          </Button>
        </div>
      </PageHeader>

      <section aria-labelledby="service-eligibility" className="flex flex-col gap-3">
        <h2 id="service-eligibility" className="text-2xl font-semibold">
          Who this is for
        </h2>
        {service.eligibility ? <p className="max-w-3xl">{service.eligibility}</p> : null}
        <p className="max-w-3xl text-sm">{SCOPE_NOTE}</p>
      </section>

      <section aria-labelledby="service-packages" className="flex flex-col gap-4">
        <h2 id="service-packages" className="text-2xl font-semibold">
          Options and pricing
        </h2>
        {service.packages.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {service.packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </ul>
        ) : (
          <p className="max-w-3xl">
            Pricing for this service is being finalized. You can still send a request and we will follow up with
            options.
          </p>
        )}
      </section>
    </div>
  );
}
