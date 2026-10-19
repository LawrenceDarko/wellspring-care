"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANDSCAPE_LAYERS, WellspringShader, art } from "@/components/art";
import { ScrollTrigger, gsap, useGSAP } from "@/components/motion/gsap";
import { Parallax, useReducedMotion } from "@/components/motion";
import { MEDIA, SEASON_MEDIA } from "@/content/media";
import type { SeasonKey } from "@/domain/seasons";

// Home scroll story (ADR 007 Story): the spring at dawn, then downstream through the five seasons.
// Rule 1: server HTML is the finished, readable page; JS only adds intro, pin/scrub and the photo stage.
// Rule 2: reduced motion (and the server render) never runs any of it.
// Rule 3: text always ends fully opaque; only aria-hidden art and photos move out of view.

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const bandLink = `underline decoration-band-gold underline-offset-4 hover:decoration-2 ${focus}`;

/** Foreground layers grow most as the scene "walks" toward the water; the sky stays put. */
const zoom = (depth: number) => 1 + Math.max(0.3 - depth, 0) * 0.9;
/** Pointer drift in px per layer: near layers follow the pointer most. */
const DRIFT: Record<string, number> = { sky: 6, "far-hills": 14, "near-hills": 24, water: 24, trees: 40, birds: 30 };

const photo = (key: SeasonKey) => MEDIA[SEASON_MEDIA[key]];

/**
 * Hero words, each in its own clip so the intro can rise them in line by line.
 * Plain text in the server HTML; the accessible name is unchanged.
 */
export function HeroWords({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, i) =>
    /^\s+$/.test(part) || part === "" ? (
      part
    ) : (
      <span key={i} className="-mb-[0.14em] inline-block max-w-full overflow-hidden pb-[0.14em] align-bottom">
        <span data-word className="inline-block max-w-full break-words">
          {part}
        </span>
      </span>
    ),
  );
}

/**
 * Pinned hero: the dawn landscape (shader sky over the SVG) behind the copy.
 * With motion: an intro where the layers settle by depth and the headline rises word by word;
 * on fine pointers from md the layers drift against the pointer; from md the hero pins for a
 * scrub while the layers close in by depth, the birds lift, and the dawn light blooms.
 */
export function HomeHero({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const hero = ref.current;
      if (reduced || !hero) return;
      const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", hero);

      // Intro: dawn opens. Near layers travel furthest, then the headline and the rest of the copy.
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(layers, {
          y: (_i: number, el: HTMLElement) => 40 + (0.4 - Number(el.dataset.depth)) * 160,
          duration: 2.2,
          stagger: 0.07,
        })
        .from("[data-word]", { yPercent: 110, duration: 1.3, stagger: 0.06 }, 0.25)
        .from("[data-hero-rise]", { y: 28, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.7)
        .from("[data-cue]", { opacity: 0, duration: 1 }, 1.4);

      const cue = gsap.to("[data-cue-dot]", { y: 18, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          // pinSpacing explicit: ScrollTrigger turns it off when the parent is flex (HomeSections is),
          // which let the seasons chapter slide up over the pinned hero.
          scrollTrigger: { trigger: hero, start: "top top", end: "+=90%", pin: true, pinSpacing: true, scrub: 0.6 },
        });
        for (const el of layers) {
          const depth = Number(el.dataset.depth);
          const isBirds = el.dataset.layer === "birds";
          tl.to(
            el,
            {
              scale: zoom(depth),
              yPercent: isBirds ? -30 : depth * 12,
              xPercent: isBirds ? 8 : 0,
              transformOrigin: "50% 100%",
            },
            0,
          );
        }
        tl.to("[data-hero-copy]", { yPercent: -22 }, 0)
          .to("[data-bloom]", { opacity: 1 }, 0)
          .to("[data-cue]", { opacity: 0, duration: 0.2 }, 0);
      });

      mm.add("(min-width: 768px) and (pointer: fine)", () => {
        const movers = gsap.utils.toArray<HTMLElement>("[data-drift]", hero).map((el) => ({
          d: DRIFT[el.dataset.drift ?? ""] ?? 0,
          x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3" }),
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          for (const m of movers) {
            m.x(-nx * m.d);
            m.y(-ny * m.d * 0.4);
          }
        };
        hero.addEventListener("pointermove", onMove);
        return () => hero.removeEventListener("pointermove", onMove);
      });

      return () => cue.kill();
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
            {/* Oversized so the pointer drift never shows an edge. */}
            <div data-drift={key} className="absolute -inset-x-[4%] top-0 -bottom-8">
              {key === "sky" ? <WellspringShader className="size-full" fallback={<Layer />} /> : <Layer />}
            </div>
          </div>
        ))}
        <div
          data-bloom
          className="absolute inset-0 opacity-0"
          style={{
            background: `radial-gradient(70% 55% at 50% 28%, color-mix(in oklab, ${art("sun")} 45%, transparent), transparent 72%)`,
          }}
        />
      </div>
      <div data-hero-copy className="mx-auto w-full max-w-6xl px-4 pt-10 pb-[42svh] md:px-6 md:pt-16 lg:pb-[38svh]">
        {children}
      </div>
      <div
        aria-hidden="true"
        data-cue
        className="absolute bottom-6 left-1/2 hidden h-12 w-7 -translate-x-1/2 justify-center rounded-full border-2 border-band-foreground/80 pt-2 drop-shadow md:flex"
      >
        <span data-cue-dot className="size-1.5 rounded-full bg-band-foreground" />
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
 * "Downstream" chapter: the five seasons as an ordered list, each with its photo inline.
 * With motion, each season's copy rises in as it enters. From lg (`story`): each item becomes a
 * tall scene beside a sticky photo stage. Scrolling into a scene wipes its photo up over the last
 * one, which drifts away, while the photo in view slowly settles (scrubbed), a numbered caption
 * swaps, and progress fills along the stage and down the gold stream line.
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
      for (const li of gsap.utils.toArray<HTMLElement>("[data-scene]", root)) {
        gsap.from(li.querySelectorAll("[data-scene-part]"), {
          opacity: 0,
          y: 36,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: li, start: "top 80%", once: true },
        });
      }
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

  // Triggers are measured after the story layout (tall scenes, stage) has rendered.
  useGSAP(
    () => {
      const root = ref.current;
      if (!story || !root) return;
      const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root);
      const frames = gsap.utils.toArray<HTMLElement>("[data-frame]", root);
      const images = frames.map((f) => f.querySelector<HTMLElement>("[data-frame-img]")!);
      const segments = gsap.utils.toArray<HTMLElement>("[data-segment]", root);

      scenes.forEach((li, i) => {
        ScrollTrigger.create({
          trigger: li,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });

        // Wipe in over the previous photo, which lifts away beneath it.
        if (i > 0) {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: li, start: "top bottom", end: "top center", scrub: 0.6 },
            })
            .fromTo(frames[i], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
            .fromTo(images[i], { scale: 1.35, yPercent: 8 }, { scale: 1.12, yPercent: 0 }, 0)
            .fromTo(images[i - 1], { yPercent: 0 }, { yPercent: -14, immediateRender: false }, 0);
        }

        // Slow settle while the scene is in view.
        gsap.fromTo(
          images[i],
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            immediateRender: i === 0,
            scrollTrigger: { trigger: li, start: "top center", end: "bottom center", scrub: 0.6 },
          },
        );
        gsap.fromTo(
          segments[i],
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: li, start: "top center", end: "bottom center", scrub: true },
          },
        );
      });

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
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-x-16">
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
          className={`sticky top-[calc(var(--header-h)+1.5rem)] h-[calc(100svh-var(--header-h)-3rem)] self-start overflow-hidden rounded-xl bg-black/30 shadow-2xl ring-1 ring-band-gold/30 ${story ? "block" : "hidden"}`}
        >
          {seasons.map((s, i) => (
            <div key={s.key} data-frame className="absolute inset-0 overflow-hidden" style={{ zIndex: i }}>
              <div data-frame-img className="absolute inset-0 will-change-transform">
                <Image src={photo(s.key).src} alt="" fill sizes="(min-width: 1024px) 90vw, 100vw" className="object-cover" />
              </div>
            </div>
          ))}
          <div className="absolute inset-0 z-10 bg-linear-to-t from-black/75 via-black/10 to-black/30" />
          <div className="absolute inset-x-6 top-6 z-10 flex gap-1.5">
            {seasons.map((s) => (
              <span key={s.key} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                <span data-segment className="block size-full origin-left bg-band-gold" />
              </span>
            ))}
          </div>
          <div className="absolute inset-x-8 bottom-8 z-10 h-28 overflow-hidden text-white">
            {seasons.map((s, i) => (
              <div
                key={s.key}
                className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 transition-[translate,opacity] duration-(--duration-reveal) ease-(--ease-story) ${
                  i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
                }`}
              >
                <span className="font-display text-sm tracking-[0.3em] text-band-gold">
                  {String(i + 1).padStart(2, "0")} / {String(seasons.length).padStart(2, "0")}
                </span>
                <span className="font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-none font-medium">{s.name}</span>
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
          <ol aria-labelledby="home-seasons" data-path className="relative flex flex-col gap-14">
            {seasons.map((s, i) => (
              <li
                key={s.key}
                data-scene
                data-active={story && i === active ? "" : undefined}
                className={`group/scene grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 ${story ? "min-h-[80svh] content-center" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-10 items-center justify-center rounded-full border border-band-gold bg-band font-display text-band-gold transition-[background-color,color,scale] duration-300 group-data-active/scene:scale-110 group-data-active/scene:bg-band-gold group-data-active/scene:text-band"
                >
                  {i + 1}
                </span>
                <div className={`flex min-w-0 flex-col gap-3 ${story ? "" : "md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:content-start md:gap-x-8"}`}>
                  <div
                    aria-hidden="true"
                    data-scene-part
                    className={`relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-lg ring-1 ring-band-gold/30 md:row-span-4 ${story ? "hidden" : ""}`}
                  >
                    <Parallax speed={0.08} className="absolute inset-x-0 -inset-y-[12%]">
                      <Image src={photo(s.key).src} alt="" fill sizes="(min-width: 768px) 20rem, 100vw" className="object-cover" />
                    </Parallax>
                  </div>
                  <span
                    aria-hidden="true"
                    data-scene-part
                    className={`font-display text-sm tracking-[0.3em] text-band-gold ${story ? "" : "hidden md:block"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div data-scene-part className="self-start">
                    <Link href={s.href} className={`font-display text-h3 font-medium leading-tight ${bandLink}`}>
                      {s.name}
                    </Link>
                  </div>
                  <p data-scene-part className="max-w-measure text-band-muted">
                    {s.line}
                  </p>
                  {s.categories.length > 0 ? (
                    <ul data-scene-part className="flex flex-col gap-1 text-[0.9375rem]">
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
