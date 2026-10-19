"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./use-reduced-motion";

/** Radix scroll lock (dialogs, mobile nav) marks the body; Lenis must not scroll the page behind it. */
const SCROLL_LOCK_ATTR = "data-scroll-locked";

/**
 * Public-site motion root (ADR 007). Lenis smooth scroll runs on the GSAP ticker and feeds
 * ScrollTrigger; off entirely under reduced motion. ScrollTriggers re-measure on route change.
 * Lenis drives native window scroll, so plain scroll listeners (header) keep working.
 */
export function MotionProvider({ children }: { children?: ReactNode }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: false });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const syncLock = () =>
      document.body.hasAttribute(SCROLL_LOCK_ATTR)
        ? lenis.stop()
        : lenis.start();
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [SCROLL_LOCK_ATTR],
    });
    syncLock();

    return () => {
      observer.disconnect();
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reduced]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return children;
}
