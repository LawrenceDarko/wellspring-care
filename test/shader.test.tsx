// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { canRunShader, shaderPixelRatio, SHADER_MIN_WIDTH, type ShaderEnv } from "@/domain/shader";

// GSAP needs matchMedia at import; the shader only uses the reduced-motion check from the barrel.
vi.mock("@/components/motion", async () => ({
  Parallax: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  prefersReducedMotion: (await import("@/components/motion/use-reduced-motion")).prefersReducedMotion,
}));

const { WellspringShader } = await import("@/components/art");

const OK: ShaderEnv = { webgl2: true, reducedMotion: false, saveData: false, viewportWidth: 1280 };
const FALLBACK = <svg data-testid="fallback" />;

function stubBrowser({ reduce = false, width = 1280, webgl2 = true } = {}) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce") ? reduce : width >= SHADER_MIN_WIDTH,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal("innerWidth", width);
  if (webgl2) vi.stubGlobal("WebGL2RenderingContext", class {});
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("canRunShader (ADR 007 WebGL guards)", () => {
  it("runs only when every condition holds", () => {
    expect(canRunShader(OK)).toBe(true);
    expect(canRunShader({ ...OK, webgl2: false })).toBe(false);
    expect(canRunShader({ ...OK, reducedMotion: true })).toBe(false);
    expect(canRunShader({ ...OK, saveData: true })).toBe(false);
  });

  it("needs a viewport of at least 768px", () => {
    expect(canRunShader({ ...OK, viewportWidth: 767 })).toBe(false);
    expect(canRunShader({ ...OK, viewportWidth: 768 })).toBe(true);
    expect(canRunShader({ ...OK, viewportWidth: Number.NaN })).toBe(false);
  });

  it("caps the pixel ratio at 1.5 and never goes below 1", () => {
    expect(shaderPixelRatio(3)).toBe(1.5);
    expect(shaderPixelRatio(1.25)).toBe(1.25);
    expect(shaderPixelRatio(0.5)).toBe(1);
    expect(shaderPixelRatio(Number.NaN)).toBe(1);
  });
});

describe("WellspringShader", () => {
  it("server HTML is the aria-hidden fallback with no canvas", () => {
    stubBrowser();
    const html = renderToString(<WellspringShader fallback={FALLBACK} />);
    expect(html).toMatch(/^<div aria-hidden="true"/);
    expect(html).toContain('data-testid="fallback"');
    expect(html).not.toContain("<canvas");
  });

  it.each([
    ["reduced motion", { reduce: true }],
    ["a narrow viewport", { width: 767 }],
    ["no WebGL2", { webgl2: false }],
  ])("renders only the fallback under %s", (_, opts) => {
    stubBrowser(opts);
    const { container, getByTestId } = render(<WellspringShader fallback={FALLBACK} />);
    expect(getByTestId("fallback")).toBeTruthy();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders only the fallback when matchMedia is missing", () => {
    const { container, getByTestId } = render(<WellspringShader fallback={FALLBACK} />);
    expect(getByTestId("fallback")).toBeTruthy();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("mounts a hidden canvas when allowed and drops it if no context is created", async () => {
    stubBrowser({ webgl2: false });
    vi.stubGlobal("WebGL2RenderingContext", class {});
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container, getByTestId } = render(<WellspringShader fallback={FALLBACK} />);
    await act(async () => {});
    expect(getContext).toHaveBeenCalledWith("webgl2", expect.objectContaining({ alpha: false }));
    expect(container.querySelector("canvas")).toBeNull();
    expect(getByTestId("fallback")).toBeTruthy();
  });

  it("allowed: draws while visible, pauses offscreen, releases the context on unmount", async () => {
    stubBrowser();
    const gl = {
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      LINK_STATUS: 3,
      TRIANGLES: 4,
      createProgram: vi.fn(() => ({})),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn((_p: unknown, name: string) => name),
      uniform3fv: vi.fn(),
      uniform2f: vi.fn(),
      uniform1f: vi.fn(),
      viewport: vi.fn(),
      drawArrays: vi.fn(),
      getExtension: vi.fn(() => ({ loseContext })),
    };
    const loseContext = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as never);
    let observe: (entries: { isIntersecting: boolean }[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof observe) {
          observe = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    const cancel = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const { container, unmount } = render(<WellspringShader fallback={FALLBACK} />);
    await act(async () => {});
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("opacity-0");
    expect(frames).toHaveLength(0); // nothing drawn until it is on screen

    await act(async () => observe([{ isIntersecting: true }]));
    await act(async () => frames.shift()?.(16));
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 3);
    expect(gl.uniform3fv).toHaveBeenCalledTimes(4);
    expect(container.querySelector("canvas")?.className).toContain("opacity-100");
    expect(frames).toHaveLength(1); // next frame queued

    await act(async () => observe([{ isIntersecting: false }]));
    expect(cancel).toHaveBeenCalled();

    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(loseContext).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="fallback"]')).toBeNull();
  });
});
