"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// One place registers plugins, so any motion island works whichever mounts first.
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Motion tokens for GSAP. Keep in step with `--ease-story` / `--duration-*` in globals.css:
 * `power3.out` is GSAP's quart-out, the same curve as `cubic-bezier(0.25, 1, 0.5, 1)`.
 */
export const MOTION = {
  ease: "power3.out",
  reveal: { duration: 0.9, rise: 24, start: "top 85%" },
} as const;

export { gsap, ScrollTrigger, useGSAP };
