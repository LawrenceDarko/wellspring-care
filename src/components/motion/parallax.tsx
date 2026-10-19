"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";
import { useReducedMotion } from "./use-reduced-motion";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * Depth: share of the viewport height the layer drifts across its pass through the
   * screen. Positive moves slower than the page (far layers), negative faster. 0.1-0.3 reads as depth.
   */
  speed?: number;
};

/** Scroll-scrubbed vertical drift for art layers (ADR 007). Static under reduced motion. */
export function Parallax({ children, className, speed = 0.2 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current || speed === 0) return;
      const shift = () => (speed * window.innerHeight) / 2;
      gsap.fromTo(
        ref.current,
        { y: () => -shift() },
        {
          y: shift,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [reduced, speed], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
