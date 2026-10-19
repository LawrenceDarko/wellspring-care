import Link from "next/link";
import { Reveal } from "@/components/motion";
import { PageHeader } from "@/components/site/page-header";
import { SEASONS, seasonForCategory, type Season } from "@/domain/seasons";
import type { Money, PublicCategory, PublicPackage, PublicService, PublicServiceDetail } from "@/server/data/catalog";
import type { Channel, DepositRule } from "@/server/data/schemas/catalog";

// Services directory and detail (PRD §4.1, §5.2, ADR 006). Pure props so they render in
// tests without a DB. The only URL parameter is the category slug; nothing a
// visitor types ever goes into a URL. The directory is grouped by life season
// (anchors `#season-<key>`, linked from the home path); package cards on the detail
// page are the only cards, since they are what a person chooses between.
// Motion (ADR 007): photo/vignette header band, season sections reveal, margin notes stay
// in view on desktop, package cards lift on hover/focus. Content is the same without it.

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const linkClass = `font-medium text-primary underline decoration-gold underline-offset-4 hover:decoration-2 ${focus}`;
const cta = `inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-primary-foreground hover:bg-primary/90 ${focus}`;
const marginNote = "self-start border-l-2 border-gold pl-4 text-[0.9375rem] text-muted-foreground";
const stickyNote = "lg:sticky lg:top-[calc(var(--header-h)+2rem)]";
const page = "mx-auto w-full max-w-6xl px-4 md:px-6";
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

export type SeasonGroup = { key: string; season?: Season; services: PublicService[] };

/** Services grouped by the season of their category, in season order; unmapped last as `other`. Empty groups dropped. */
export function groupServicesBySeason(services: readonly PublicService[]): SeasonGroup[] {
  const groups: SeasonGroup[] = [
    ...SEASONS.map((season) => ({ key: season.key, season, services: [] as PublicService[] })),
    { key: "other", services: [] },
  ];
  for (const s of services) {
    const key = seasonForCategory(s.category.slug)?.key ?? "other";
    groups.find((g) => g.key === key)!.services.push(s);
  }
  return groups.filter((g) => g.services.length > 0);
}

function ServiceRows({ services, showCategory }: { services: PublicService[]; showCategory: boolean }) {
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {services.map((s) => (
        <li key={s.id} className="grid gap-1.5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
          <div className="flex min-w-0 max-w-measure flex-col gap-1.5">
            <h3 className="text-lede font-medium">
              <Link href={`/services/${s.slug}`} className={linkClass}>
                {s.name}
              </Link>
            </h3>
            <p>{s.summary}</p>
            {showCategory ? <p className="text-[0.9375rem] text-muted-foreground">{s.category.name}</p> : null}
          </div>
          <p className="text-[0.9375rem] font-medium sm:pt-1 sm:text-right">
            {s.startingPrice ? `From ${formatMoney(s.startingPrice)}` : "Pricing on request"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SeasonSection({ group, number }: { group: SeasonGroup; number?: number }) {
  const titleId = `season-${group.key}-title`;
  return (
    <section
      id={`season-${group.key}`}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-gold/40 py-10 md:py-12"
    >
      <Reveal className="flex flex-col gap-6">
        <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-4">
          {number ? (
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full border border-gold font-display text-gold"
            >
              {number}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-h2 font-medium">
              {group.season?.name ?? "Other care"}
            </h2>
            {group.season ? <p className="max-w-measure text-muted-foreground">{group.season.line}</p> : null}
          </div>
        </div>
        <ServiceRows services={group.services} showCategory />
      </Reveal>
    </section>
  );
}

function CategoryFilter({ categories, current }: { categories: PublicCategory[]; current?: PublicCategory }) {
  return (
    <nav aria-label="Service categories">
      <ul className="flex flex-wrap gap-2">
        {[{ slug: undefined, name: "All services" }, ...categories].map((c) => {
          const active = c.slug === current?.slug;
          return (
            <li key={c.slug ?? "all"}>
              <Link
                href={c.slug ? `/services?category=${c.slug}` : "/services"}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md border px-4 text-[0.9375rem] ${focus} ${
                  active
                    ? "border-primary bg-accent font-medium text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ServicesDirectory({ categories, services, selected, unknownCategory = false }: ServicesDirectoryData) {
  const current = categories.find((c) => c.slug === selected);
  const empty = <p className="max-w-measure">No services are listed here yet. Please check back soon or contact us.</p>;
  return (
    <>
      <PageHeader media="riverDawn" />
      <div className={`${page} pb-6`}>
        <header className="grid gap-6 pt-12 pb-10 md:pt-16 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16">
          <div className="flex max-w-measure flex-col gap-5">
            <h1 className="text-h1 font-medium">Services</h1>
            <p className="text-lede">
              Christian pastoral and spiritual care for individuals, couples and families, arranged by the season of
              life you are in. Choose a service to see what it includes and how to request it.
            </p>
          </div>
          <aside className={`${marginNote} lg:mt-16`}>{SCOPE_NOTE}</aside>
        </header>

        <div className="flex flex-col gap-6 pb-10">
          {categories.length > 0 ? <CategoryFilter categories={categories} current={current} /> : null}
          {unknownCategory ? (
            <p role="status" className="max-w-measure rounded-md bg-secondary p-4 text-secondary-foreground">
              That category is not available. Showing all services.
            </p>
          ) : null}
        </div>

        {current ? (
          <section
            aria-labelledby="services-list"
            className="flex flex-col gap-6 border-t border-gold/40 py-10 md:py-12"
          >
            <div className="flex max-w-measure flex-col gap-2">
              <h2 id="services-list" className="text-h2 font-medium">
                {current.name}
              </h2>
              {current.summary ? <p className="text-muted-foreground">{current.summary}</p> : null}
            </div>
            {services.length > 0 ? <ServiceRows services={services} showCategory={false} /> : empty}
          </section>
        ) : services.length > 0 ? (
          groupServicesBySeason(services).map((g) => (
            <SeasonSection
              key={g.key}
              group={g}
              number={g.season ? SEASONS.findIndex((s) => s.key === g.key) + 1 : undefined}
            />
          ))
        ) : (
          <section aria-label="All services" className="border-t border-gold/40 py-10">
            {empty}
          </section>
        )}
      </div>
    </>
  );
}

function PackageCard({ pkg }: { pkg: PublicPackage }) {
  const deposit = depositText(pkg.depositRule, pkg.currency);
  return (
    <li
      data-package-card
      className="flex flex-col gap-4 rounded-lg border border-border border-t-gold/40 bg-card p-6 text-card-foreground transition-[translate,box-shadow,border-color] duration-(--duration-menu) ease-(--ease-story) focus-within:-translate-y-1 focus-within:border-t-gold focus-within:shadow-md hover:-translate-y-1 hover:border-t-gold hover:shadow-md motion-reduce:translate-none motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lede font-medium">{pkg.name}</h3>
        <p className="font-display text-h2 font-medium">{formatMoney({ cents: pkg.priceCents, currency: pkg.currency })}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.9375rem]">
        <dt className="text-muted-foreground">Sessions</dt>
        <dd>
          {pkg.sessionCount} x {pkg.minutesPerSession} minutes
        </dd>
        <dt className="text-muted-foreground">Duration</dt>
        <dd>
          {pkg.durationWeeks} {pkg.durationWeeks === 1 ? "week" : "weeks"}
        </dd>
        <dt className="text-muted-foreground">Meets by</dt>
        <dd>{pkg.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}</dd>
        <dt className="text-muted-foreground">Response</dt>
        <dd>{pkg.responseTimeText}</dd>
      </dl>
      {pkg.includedItems.length > 0 ? (
        <ul className="list-disc border-t border-border pt-3 pl-5 text-[0.9375rem]">
          {pkg.includedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {deposit || pkg.installmentsAllowed ? (
        <p className="mt-auto text-[0.9375rem] text-muted-foreground">
          {[deposit, pkg.installmentsAllowed ? "Installments available" : null].filter(Boolean).join(". ")}
        </p>
      ) : null}
    </li>
  );
}

export function ServiceDetail({ service }: { service: PublicServiceDetail }) {
  const season = seasonForCategory(service.category.slug);
  return (
    <>
      {season ? <PageHeader season={season.key} /> : null}
      <div className={`${page} py-12 md:py-16`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16">
          <div className="flex min-w-0 flex-col gap-5 lg:col-start-1">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-2 text-[0.9375rem]">
                <li>
                  <Link href="/services" className={linkClass}>
                    Services
                  </Link>
                  <span aria-hidden="true" className="text-muted-foreground">
                    {" "}
                    /
                  </span>
                </li>
                <li>
                  <Link href={`/services?category=${service.category.slug}`} className={linkClass}>
                    {service.category.name}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="max-w-measure text-h1 font-medium">{service.name}</h1>
            <p className="max-w-measure text-lede">{service.summary}</p>
            <p className="font-medium">
              {service.startingPrice ? `Starting at ${formatMoney(service.startingPrice)}` : "Pricing on request"}
            </p>
            <div>
              <Link href={requestHref(service.slug)} className={cta}>
                Request this service
              </Link>
            </div>
          </div>

          <aside
            aria-labelledby="service-eligibility"
            className={`${marginNote} ${stickyNote} flex flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-12`}
          >
            <h2 id="service-eligibility" className="font-display text-lede font-medium text-foreground">
              Who this is for
            </h2>
            {service.eligibility ? <p className="text-foreground">{service.eligibility}</p> : null}
            <p>{SCOPE_NOTE}</p>
          </aside>

          <section
            aria-labelledby="service-packages"
            className="flex min-w-0 flex-col gap-6 border-t border-gold/40 pt-10 lg:col-start-1"
          >
            <h2 id="service-packages" className="text-h2 font-medium">
              Options and pricing
            </h2>
            {service.packages.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {service.packages.map((p) => (
                  <PackageCard key={p.id} pkg={p} />
                ))}
              </ul>
            ) : (
              <p className="max-w-measure">
                Pricing for this service is being finalized. You can still send a request and we will follow up with
                options.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
