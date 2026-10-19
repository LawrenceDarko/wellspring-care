"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function canQuery() {
  return (
    typeof window !== "undefined" && typeof window.matchMedia === "function"
  );
}

/** True when the user asked for reduced motion, or when we cannot tell (server, no matchMedia). */
export function prefersReducedMotion(): boolean {
  return !canQuery() || window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void) {
  if (!canQuery()) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * ADR 007 rule 2. Server and hydration render as reduced (static), so motion only
 * starts after hydration and never changes the server HTML. Follows OS changes live.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
