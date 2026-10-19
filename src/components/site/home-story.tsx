"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANDSCAPE_LAYERS, SeasonArt, WellspringShader, art } from "@/components/art";
import { ScrollTrigger, gsap, useGSAP } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion";
import type { SeasonKey } from "@/domain/seasons";

// Home scroll story (ADR 007 Story): the spring at dawn, then downstream through the five seasons.
// Rule 1: server HTML is the finished, readable page; JS only adds pin/scrub and the scene stage.
// Rule 2: reduced motion (and the server render) never runs any of it.

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const bandLink = `underline decoration-band-gold underline-offset-4 hover:decoration-2 ${focus}`;

/** Foreground layers grow most as the scene "walks" toward the water; the sky stays put. */
const zoom = (depth: number) => 1 + Math.max(0.3 - depth, 0) * 0.5;

/**
 * Pinned hero: the dawn landscape (shader sky over the SVG) behind the copy. From md, with motion,
 * the hero pins for a short scrub while the layers close in by depth and the copy drifts up.
 * Copy stays fully opaque, so it reads at every scroll position (rule 3).
 */
export function HomeHero({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const hero = ref.current;
      if (reduced || !hero) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: hero, start: "top top", end: "+=60%", pin: true, scrub: true },
        });
        for (const el of gsap.utils.toArray<HTMLElement>("[data-depth]", hero)) {
          const depth = Number(el.dataset.depth);
          tl.to(el, { scale: zoom(depth), yPercent: el.dataset.layer === "birds" ? -12 : 0, transformOrigin: "50% 100%" }, 0);
        }
        tl.to("[data-hero-copy]", { yPercent: -18 }, 0);
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    // `data-hero="light"`: the sticky header goes see-through over the dawn sky but keeps linen tokens.
    <section
      ref={ref}
      aria-labelledby={labelledBy}
      data-hero="light"
      className="relative isolate -mt-header flex min-h-svh flex-col overflow-hidden pt-header"
      style={{ backgroundColor: art("sky-high") }}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {LANDSCAPE_LAYERS.map(({ key, Layer, speed }) => (
          <div key={key} data-layer={key} data-depth={speed} className="absolute inset-0">
            {key === "sky" ? <WellspringShader className="size-full" fallback={<Layer />} /> : <Layer />}
          </div>
        ))}
      </div>
      <div data-hero-copy className="mx-auto w-full max-w-6xl px-4 pt-10 pb-[42svh] md:px-6 md:pt-16 lg:pb-[38svh]">
        {children}
      </div>
    </section>
  );
}

export type ChapterSeason = {
  key: SeasonKey;
  name: string;
  line: string;
  href: string;
  categories: { id: string; slug: string; name: string }[];
};

/**
 * "Downstream" chapter: the five seasons as an ordered list, each with its vignette inline.
 * From lg, with motion (`story`): each item becomes into a tall scene, a sticky stage swaps
 * the vignette for the scene in view, and a gold stream line is scrubbed down the path.
 */
export function SeasonsChapter({ seasons }: { seasons: ChapterSeason[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [story, setStory] = useState(false);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const root = ref.current;
      if (reduced || !root) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        setStory(true);
        return () => {
          setStory(false);
          setActive(0);
        };
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  // Triggers are measured after the story layout (tall scenes) has rendered.
  useGSAP(
    () => {
      const root = ref.current;
      if (!story || !root) return;
      gsap.utils.toArray<HTMLElement>("[data-scene]", root).forEach((li, i) =>
        ScrollTrigger.create({
          trigger: li,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        }),
      );
      gsap.fromTo(
        "[data-stream]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-path]", start: "top center", end: "bottom center", scrub: true },
        },
      );
    },
    { scope: ref, dependencies: [story], revertOnUpdate: true },
  );

  useEffect(() => {
    if (story) ScrollTrigger.refresh();
  }, [story]);

  return (
    <section
      ref={ref}
      aria-labelledby="home-seasons"
      data-story={story ? "on" : undefined}
      className="group/story band"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:gap-x-16">
        <div className="flex max-w-measure flex-col gap-4 lg:col-span-2">
          <h2 id="home-seasons" className="text-h2 font-medium">
            Care for each season of life
          </h2>
          <p className="text-lede text-band-muted">
            Follow the stream down from the spring. Each season of life has its own kind of care, and you can
            begin at any of them.
          </p>
        </div>

        <div
          aria-hidden="true"
          className={`sticky top-[calc(var(--header-h)+2rem)] self-start overflow-hidden rounded-lg border border-band-gold/40 ${story ? "block" : "hidden"}`}
        >
          <div className="relative aspect-[8/5]">
            {seasons.map((s, i) => (
              <div
                key={s.key}
                className={`absolute inset-0 transition-[opacity,scale] duration-(--duration-reveal) ease-(--ease-story) ${
                  i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
                }`}
              >
                <SeasonArt season={s.key} className="size-full" />
              </div>
            ))}
          </div>
        </div>

        <div className={`relative min-w-0 ${story ? "" : "lg:col-span-2"}`}>
          {/* The stream: a quiet rule joining the markers, and (story on) its scrubbed gold course. */}
          <div aria-hidden="true" className="absolute top-5 bottom-5 left-5 w-px bg-band-gold/35" />
          <div
            aria-hidden="true"
            data-stream
            className={`absolute top-5 bottom-5 left-5 w-px origin-top bg-band-gold ${story ? "block" : "hidden"}`}
          />
          <ol aria-labelledby="home-seasons" data-path className="relative flex flex-col gap-12">
            {seasons.map((s, i) => (
              <li
                key={s.key}
                data-scene
                data-active={story && i === active ? "" : undefined}
                className={`group/scene grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 ${story ? "min-h-[60svh] content-center" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-10 items-center justify-center rounded-full border border-band-gold bg-band font-display text-band-gold transition-colors duration-300 group-data-active/scene:bg-band-gold group-data-active/scene:text-band"
                >
                  {i + 1}
                </span>
                <div className={`flex min-w-0 flex-col gap-3 ${story ? "" : "md:grid md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:content-start md:gap-x-8"}`}>
                  <div
                    aria-hidden="true"
                    className={`max-w-sm overflow-hidden rounded-lg border border-band-gold/40 md:row-span-3 ${story ? "hidden" : ""}`}
                  >
                    <SeasonArt season={s.key} />
                  </div>
                  <Link
                    href={s.href}
                    className={`self-start font-display text-h3 font-medium leading-tight ${bandLink}`}
                  >
                    {s.name}
                  </Link>
                  <p className="max-w-measure text-band-muted">{s.line}</p>
                  {s.categories.length > 0 ? (
                    <ul className="flex flex-col gap-1 text-[0.9375rem]">
                      {s.categories.map((c) => (
                        <li key={c.id}>
                          <Link href={`/services?category=${c.slug}`} className={bandLink}>
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
