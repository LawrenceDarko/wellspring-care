// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

const lenis = vi.hoisted(() => ({
  ctor: vi.fn(),
  on: vi.fn(),
  raf: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("lenis", () => ({
  default: class {
    constructor(opts: unknown) {
      lenis.ctor(opts);
    }
    on = lenis.on;
    raf = lenis.raf;
    stop = lenis.stop;
    start = lenis.start;
    destroy = lenis.destroy;
  },
}));

// jsdom has no matchMedia; ScrollTrigger needs one at registration, so stub before importing.
let reduce = false;
const matchMedia = (query: string) => ({
  matches: reduce && query.includes("prefers-reduced-motion: reduce"),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
});
window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
window.scrollTo = () => {}; // ScrollTrigger.refresh calls it; jsdom only logs "not implemented"

const { MotionProvider, Parallax, Reveal, prefersReducedMotion } =
  await import("@/components/motion");

function stubReducedMotion(value: boolean) {
  reduce = value;
}

function Story() {
  return (
    <>
      <Reveal>
        <p>Season copy</p>
        <a href="#care">Request care</a>
      </Reveal>
      <Parallax speed={0.3}>
        <p>Far hills</p>
      </Parallax>
    </>
  );
}

const motionStyle = (el: HTMLElement) =>
  [el.style.opacity, el.style.transform, el.style.translate].join("");

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  reduce = false;
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  document.body.removeAttribute("data-scroll-locked");
});

describe("motion islands without JS", () => {
  it("server HTML carries no hidden from-state", () => {
    const html = renderToString(
      <MotionProvider>
        <Story />
      </MotionProvider>,
    );
    expect(html).toContain("Season copy");
    expect(html).toContain("Far hills");
    expect(html).not.toMatch(/style=|opacity|transform/);
  });
});

describe("reduced motion", () => {
  it("treats a missing matchMedia as reduced", () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
  });

  it("leaves reveal and parallax content untouched", () => {
    stubReducedMotion(true);
    render(<Story />);
    const reveal = screen.getByText("Season copy").parentElement!;
    const layer = screen.getByText("Far hills").parentElement!;
    expect(motionStyle(reveal)).toBe("");
    expect(motionStyle(layer)).toBe("");
  });

  it("does not start Lenis", () => {
    stubReducedMotion(true);
    render(<MotionProvider />);
    expect(lenis.ctor).not.toHaveBeenCalled();
  });
});

describe("motion allowed", () => {
  it("JS sets the reveal from-state with opacity, never visibility", () => {
    stubReducedMotion(false);
    render(<Story />);
    const reveal = screen.getByText("Season copy").parentElement!;
    expect(reveal.style.opacity).toBe("0");
    expect(reveal.style.visibility).not.toBe("hidden");
  });

  it("starts Lenis on the GSAP ticker, pauses it under a scroll lock, destroys it on unmount", async () => {
    stubReducedMotion(false);
    const { unmount } = render(<MotionProvider />);
    expect(lenis.ctor).toHaveBeenCalledWith(
      expect.objectContaining({ autoRaf: false }),
    );
    expect(lenis.on).toHaveBeenCalledWith("scroll", expect.any(Function));

    lenis.stop.mockClear();
    document.body.setAttribute("data-scroll-locked", "1");
    await new Promise((r) => setTimeout(r, 0));
    expect(lenis.stop).toHaveBeenCalled();

    unmount();
    expect(lenis.destroy).toHaveBeenCalledOnce();
  });
});
