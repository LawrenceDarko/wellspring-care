import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicCategory } from "@/server/data/catalog";
import type { PublicEvent, PublicTestimonial } from "@/server/data/content";
import type { SiteSettings } from "@/server/data/settings";

// Home page sections (PRD §4.3). Pure props so it renders in tests without a DB.
// Copy follows PRD §15.3: no promised outcomes, no "therapy", no invented facts.
// Events and testimonials sections are omitted entirely when there is no data.

export type HomeData = {
  settings: Pick<SiteSettings, "name" | "tagline" | "timezone">;
  categories: PublicCategory[];
  events: PublicEvent[];
  testimonials: PublicTestimonial[];
};

const linkClass = "font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";

function Section({
  id,
  title,
  children,
  tinted = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section aria-labelledby={id} className={tinted ? "bg-secondary text-secondary-foreground" : undefined}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14">
        <h2 id={id} className="text-2xl font-semibold md:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Feature({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p>{children}</p>
      <Link href={href} className={`mt-auto ${linkClass}`}>
        {linkLabel}
      </Link>
    </div>
  );
}

function formatEventDate(event: PublicEvent, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  return fmt.format(event.startsAt);
}

export function HomeSections({ settings, categories, events, testimonials }: HomeData) {
  return (
    <div className="flex flex-col">
      <section aria-labelledby="home-hero">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 md:py-20">
          <h1 id="home-hero" className="max-w-3xl text-4xl font-semibold md:text-5xl">
            {settings.tagline ?? settings.name}
          </h1>
          <p className="max-w-2xl text-lg">
            {settings.name} offers Christian chaplaincy, pastoral and spiritual care, renewal programs, and
            ceremonies for weddings, funerals and memorials.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/services">Request Spiritual Care</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/programs">Explore Programs</Link>
            </Button>
          </div>
          <p className="max-w-2xl text-sm">
            Pastoral and spiritual care only. We are not a medical, mental-health or emergency provider.
          </p>
        </div>
      </section>

      <Section id="home-services" title="How we can walk with you" tinted>
        {categories.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 text-card-foreground">
                <h3 className="text-lg font-semibold">
                  <Link href={`/services?category=${c.slug}`} className={linkClass}>
                    {c.name}
                  </Link>
                </h3>
                <p>{c.summary}</p>
              </li>
            ))}
          </ul>
        ) : null}
        <Link href="/services" className={linkClass}>
          View all services
        </Link>
      </Section>

      <Section id="home-renewal" title="Spiritual Renewal Journey">
        <p className="max-w-3xl">
          A guided program of scripture, prayer, reflection and facilitated sessions, offered in 4-week and
          8-week formats. It is not a treatment for trauma and does not replace licensed mental-health care.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Feature title="4-week renewal" href="/programs" linkLabel="See the 4-week format">
            A focused month of weekly sessions and daily reflection.
          </Feature>
          <Feature title="8-week renewal" href="/programs" linkLabel="See the 8-week format">
            A fuller journey at a gentler pace, with room for group and individual sessions.
          </Feature>
        </div>
      </Section>

      <Section id="home-ceremonies" title="Weddings, funerals and memorials" tinted>
        <div className="grid gap-4 md:grid-cols-2">
          <Feature title="Weddings" href="/weddings" linkLabel="Plan a wedding ceremony">
            Officiants and ceremonies shaped around your faith tradition and your story.
          </Feature>
          <Feature title="Funerals and memorials" href="/funerals" linkLabel="Arrange a funeral or memorial">
            Compassionate officiants for funerals, memorials and graveside services.
          </Feature>
        </div>
      </Section>

      <Section id="home-family" title="Family and marriage">
        <div className="grid gap-4 md:grid-cols-2">
          <Feature title="Family and couples care" href="/services" linkLabel="Explore family and couples care">
            Pastoral support for couples, parents and families, with referral to licensed providers when needed.
          </Feature>
          <Feature title="Chaplaincy" href="/chaplaincy" linkLabel="Learn about chaplaincy">
            Chaplains for hospice, healthcare and community settings, alongside the clinical team.
          </Feature>
        </div>
      </Section>

      {events.length > 0 ? (
        <Section id="home-events" title="Upcoming events and retreats" tinted>
          <ul className="grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 text-card-foreground">
                <h3 className="text-lg font-semibold">{e.title}</h3>
                <p className="text-sm">
                  <time dateTime={e.startsAt.toISOString()}>{formatEventDate(e, settings.timezone)}</time>
                  {" · "}
                  {e.locationText}
                </p>
                <p>{e.summary}</p>
              </li>
            ))}
          </ul>
          <Link href="/events" className={linkClass}>
            All events and retreats
          </Link>
        </Section>
      ) : null}

      {testimonials.length > 0 ? (
        <Section id="home-testimonials" title="In their words">
          <ul className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.id}>
                <figure className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
                  <blockquote>
                    <p>{t.quote}</p>
                  </blockquote>
                  <figcaption className="mt-auto text-sm">{t.attribution}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="home-mission" title="Our mission and values" tinted={events.length === 0 || testimonials.length > 0}>
        <p className="max-w-3xl">
          We offer Christ-centered presence and care to people in every season of life, respecting each
          person&apos;s tradition, pace and choices.
        </p>
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold">Presence</h3>
            <p>We listen first and walk alongside, without pressure.</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold">Integrity</h3>
            <p>Clear boundaries, honest pricing and confidentiality.</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold">Partnership</h3>
            <p>We work alongside licensed and clinical care, never in place of it.</p>
          </li>
        </ul>
        <Link href="/about" className={linkClass}>
          About us
        </Link>
      </Section>
    </div>
  );
}
