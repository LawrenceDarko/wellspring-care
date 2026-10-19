import Link from "next/link";
import { Landscape } from "@/components/art";
import { Reveal } from "@/components/motion";
import { groupBySeason } from "@/domain/seasons";
import type { PublicCategory } from "@/server/data/catalog";
import type { PublicEvent, PublicTestimonial } from "@/server/data/content";
import type { SiteSettings } from "@/server/data/settings";
import { HomeHero, SeasonsChapter, type ChapterSeason } from "./home-story";

// Home page (PRD §4.3) as the ADR 007 scroll story: the spring at dawn (pinned hero), downstream
// through the five seasons (forest chapter), the remaining sections as quiet book pages with
// reveals, and the still pool where the visitor asks for care. Pure props so it renders in tests
// without a DB; motion lives in the client islands and never hides content in the server HTML.
// Copy follows PRD §15.3: no promised outcomes, no "therapy", no invented facts.
// Events and testimonials sections are omitted entirely when there is no data.

export type HomeData = {
  settings: Pick<SiteSettings, "name" | "tagline" | "timezone">;
  categories: PublicCategory[];
  events: PublicEvent[];
  testimonials: PublicTestimonial[];
};

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const textLink = `font-medium text-primary underline decoration-gold underline-offset-4 hover:decoration-2 ${focus}`;
const cta = `inline-flex min-h-11 items-center justify-center rounded-md px-6 py-2 text-center font-medium ${focus}`;

function Section({
  id,
  title,
  note,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  /** Side note: margin column on desktop, below the section on mobile. */
  note?: React.ReactNode;
  /** Lists and grids use the full width; prose stays at reading measure. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-6 border-t border-gold/40 py-12 first:border-t-0 md:py-16 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16"
    >
      <Reveal className={`flex min-w-0 flex-col gap-5 ${wide ? "lg:col-span-2" : "max-w-measure"}`}>
        <h2 id={id} className="text-h2 font-medium">
          {title}
        </h2>
        {children}
      </Reveal>
      {note ? (
        <Reveal delay={0.15} className="self-start lg:mt-16">
          <aside className="border-l-2 border-gold pl-4 text-[0.9375rem] text-muted-foreground">{note}</aside>
        </Reveal>
      ) : null}
    </section>
  );
}

function chapterSeasons(categories: PublicCategory[]): ChapterSeason[] {
  return groupBySeason(categories).seasons.map(({ season, items }) => ({
    key: season.key,
    name: season.name,
    line: season.line,
    href: season.href,
    categories: items.map(({ id, slug, name }) => ({ id, slug, name })),
  }));
}

function formatEventDate(event: PublicEvent, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  return fmt.format(event.startsAt);
}

const ways = [
  {
    title: "Weddings",
    href: "/weddings",
    text: "Officiants and ceremonies shaped around your faith tradition and your story.",
  },
  {
    title: "Funerals and memorials",
    href: "/funerals",
    text: "Officiants for funerals, memorials and graveside services, and care for the family.",
  },
  {
    title: "Family and marriage",
    href: "/services#season-family",
    text: "Pastoral support for couples, parents and families, with referral to licensed providers when needed.",
  },
  {
    title: "Chaplaincy",
    href: "/chaplaincy",
    text: "Chaplains for hospice, healthcare and community settings, alongside the clinical team.",
  },
] as const;

const values = [
  { term: "Presence", text: "We listen first and walk alongside, without pressure." },
  { term: "Integrity", text: "Clear boundaries, honest pricing and confidentiality." },
  { term: "Partnership", text: "We work alongside licensed and clinical care, never in place of it." },
] as const;

export function HomeSections({ settings, categories, events, testimonials }: HomeData) {
  return (
    <div className="flex flex-col">
      <HomeHero labelledBy="home-hero">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 id="home-hero" className="type-display break-words">
            {settings.tagline ?? settings.name}
          </h1>
          <p className="max-w-measure text-lede">
            {settings.name} offers Christian chaplaincy, pastoral and spiritual care, renewal programs, and
            ceremonies for weddings, funerals and memorials.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/services" className={`${cta} bg-primary text-primary-foreground hover:bg-primary/90`}>
              Request spiritual care
            </Link>
            <Link
              href="/programs"
              className={`${cta} border border-foreground/70 bg-background/70 hover:bg-background`}
            >
              Explore programs
            </Link>
          </div>
          <p className="max-w-measure text-[0.9375rem]">
            Pastoral and spiritual care only. We are not a medical, mental-health or emergency provider.
          </p>
        </div>
      </HomeHero>

      <SeasonsChapter seasons={chapterSeasons(categories)} />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <Section
          id="home-renewal"
          title="Spiritual Renewal Journey"
          note="A spiritual program, not a treatment for trauma. It does not replace licensed mental-health care."
        >
          <p className="text-lede">
            A guided program of scripture, prayer, reflection and facilitated sessions, in two formats.
          </p>
          <dl className="flex flex-col divide-y divide-border border-y border-border">
            <div className="grid gap-1 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
              <dt className="font-display text-lede font-medium">4 weeks</dt>
              <dd>A focused month of weekly sessions and daily reflection.</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
              <dt className="font-display text-lede font-medium">8 weeks</dt>
              <dd>A fuller journey at a gentler pace, with room for group and individual sessions.</dd>
            </div>
          </dl>
          <Link href="/programs" className={`self-start ${textLink}`}>
            Compare the 4- and 8-week formats
          </Link>
        </Section>

        <Section id="home-ways" title="Ceremonies, families and chaplaincy" wide>
          <ul className="grid border-t border-border md:grid-cols-2 md:gap-x-12">
            {ways.map((w) => (
              <li key={w.href} className="flex flex-col gap-1 border-b border-border py-5">
                <h3 className="text-h3 font-medium">
                  <Link href={w.href} className={textLink}>
                    {w.title}
                  </Link>
                </h3>
                <p className="max-w-measure">{w.text}</p>
              </li>
            ))}
          </ul>
        </Section>

        {events.length > 0 ? (
          <Section
            id="home-events"
            title="Upcoming events and retreats"
            note={
              <Link href="/events" className={textLink}>
                All events and retreats
              </Link>
            }
          >
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {events.map((e) => (
                <li key={e.id} className="grid gap-1 py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                  <time dateTime={e.startsAt.toISOString()} className="font-medium">
                    {formatEventDate(e, settings.timezone)}
                  </time>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-h3 font-medium">{e.title}</h3>
                    <p className="text-muted-foreground">{e.locationText}</p>
                    <p>{e.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {testimonials.length > 0 ? (
          <Section id="home-testimonials" title="In their words" wide>
            <ul className="grid gap-8 md:grid-cols-2 md:gap-x-12">
              {testimonials.map((t) => (
                <li key={t.id}>
                  <figure className="flex flex-col gap-2 border-l-2 border-gold pl-5">
                    <blockquote>
                      <p className="font-display text-lede">{t.quote}</p>
                    </blockquote>
                    <figcaption className="text-muted-foreground">{t.attribution}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section id="home-mission" title="Our mission and values" wide>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-16">
            <div className="flex max-w-measure flex-col gap-5">
              <p className="text-lede">
                We offer Christ-centered presence and care to people in every season of life, respecting each
                person&apos;s tradition, pace and choices.
              </p>
              <Link href="/about" className={`self-start ${textLink}`}>
                Read about who we are
              </Link>
            </div>
            <dl className="flex flex-col divide-y divide-border border-y border-border">
              {values.map((v) => (
                <div key={v.term} className="grid gap-1 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-display text-lede font-medium">{v.term}</dt>
                  <dd>{v.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      </div>

      <section aria-labelledby="home-still-pool" className="band">
        <Landscape parallax className="h-40 md:h-64" />
        <Reveal className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 md:px-6 md:py-20">
          <h2 id="home-still-pool" className="text-h2 font-medium">
            When you are ready, ask for care
          </h2>
          <p className="max-w-measure text-lede text-band-muted">
            Choose the care that fits your season and send a short request. You decide what to share, and
            asking costs nothing.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/services" className={`${cta} bg-band-foreground text-band hover:bg-secondary`}>
              Find care by season
            </Link>
            <Link href="/contact" className={`${cta} border border-band-foreground/70 hover:bg-band-foreground/10`}>
              Contact us
            </Link>
          </div>
          <p className="max-w-measure text-[0.9375rem] text-band-muted">
            Pastoral and spiritual care only. In an emergency, call 911.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
