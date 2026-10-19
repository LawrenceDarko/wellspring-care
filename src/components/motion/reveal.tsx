"use client";

import { useRef, type ReactNode } from "react";
import { MOTION, gsap, useGSAP } from "./gsap";
import { useReducedMotion } from "./use-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait after entering, for a short sequence of reveals. */
  delay?: number;
};

/**
 * Fades and rises its content in when it scrolls into view (ADR 007 rules 1-2).
 * Server HTML has no hidden state; JS sets the from-state, and only when motion is allowed.
 * Opacity only (never visibility), so links inside stay focusable before they reveal.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      gsap.from(ref.current, {
        opacity: 0,
        y: MOTION.reveal.rise,
        duration: MOTION.reveal.duration,
        ease: MOTION.ease,
        delay,
        scrollTrigger: {
          trigger: ref.current,
          start: MOTION.reveal.start,
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [reduced, delay], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
