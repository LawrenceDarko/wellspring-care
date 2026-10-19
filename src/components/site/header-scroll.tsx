"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { OnRouteChange } from "@/components/motion/on-route-change";

/** Scroll distance (px) before direction changes count; stops jitter on trackpads. */
const DIRECTION_SLOP = 6;

/**
 * Sticky header shell (ADR 007 Nav). Sets attributes only; CSS does the rest:
 * - `data-over-hero` while a `[data-hero]` element is still under the header, set to the hero's
 *   tone: `light` for `data-hero="light"` (the home dawn sky), otherwise `band` (forest band),
 * - `data-scrolled` once the page has moved,
 * - `data-hidden` on scroll down, cleared on scroll up, on focus inside, or while a menu is open.
 * A passive scroll listener batched to one frame; no GSAP. Lenis (MotionProvider) moves native
 * window scroll, so this listener sees smooth scrolling too.
 * Without JS the header stays solid and visible.
 */
export function HeaderScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const updateRef = useRef<() => void>(undefined);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      const height = header.offsetHeight;
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero && hero.getBoundingClientRect().bottom > height) header.dataset.overHero = hero.dataset.hero === "light" ? "light" : "band";
      else header.removeAttribute("data-over-hero");
      header.toggleAttribute("data-scrolled", y > 0);

      if (Math.abs(y - lastY) < DIRECTION_SLOP) return;
      const engaged = header.contains(document.activeElement) || header.querySelector('[data-state="open"]');
      header.toggleAttribute("data-hidden", y > lastY && y > height * 2 && !engaged);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reveal = () => header.removeAttribute("data-hidden");

    update();
    updateRef.current = () => {
      lastY = window.scrollY;
      update();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", reveal);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", reveal);
      updateRef.current = undefined;
    };
  }, []);

  return (
    <header ref={ref} className={className}>
      {children}
      {/* New page: re-detect the hero under the header. */}
      <OnRouteChange onChange={() => updateRef.current?.()} />
    </header>
  );
}
