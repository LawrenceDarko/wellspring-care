// jsdom has no matchMedia, and GSAP's ScrollTrigger (pulled in by Reveal/Parallax) needs one
// at import. Import this first in any jsdom test that renders motion islands. `motion.reduce`
// flips the reduced-motion answer per test (default: reduced, so islands stay static).
export const motion = { reduce: true };

window.matchMedia = ((query: string) => ({
  matches: motion.reduce && query.includes("prefers-reduced-motion: reduce"),
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
})) as unknown as typeof window.matchMedia;
window.scrollTo = () => {}; // ScrollTrigger.refresh calls it; jsdom only logs "not implemented"
