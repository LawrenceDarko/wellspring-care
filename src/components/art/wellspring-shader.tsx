"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/components/motion";
import { canRunShader, SHADER_MIN_WIDTH, shaderPixelRatio } from "@/domain/shader";
import { Sky } from "./landscape";
import type { ArtToken } from "./tokens";

// The one hero shader (ADR 007 WebGL): the dawn sky of `Sky`, with slow light rays from the
// sun and light moving like water over the low sky. Raw WebGL2, one full-screen triangle,
// no buffers. The SVG `fallback` is always rendered underneath (it stays the LCP element);
// the canvas only mounts when `canRunShader` allows and fades in after its first frame.
// Any failure (no context, compile error) removes the canvas silently.

type Connection = EventTarget & { saveData?: boolean };
const connection = (): Connection | undefined =>
  (navigator as Navigator & { connection?: Connection }).connection;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const WIDTH_QUERY = `(min-width: ${SHADER_MIN_WIDTH}px)`;

function allowed(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return canRunShader({
    webgl2: typeof window.WebGL2RenderingContext === "function",
    reducedMotion: prefersReducedMotion(),
    saveData: connection()?.saveData === true,
    viewportWidth: window.innerWidth,
  });
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const queries = [REDUCE_QUERY, WIDTH_QUERY].map((q) => window.matchMedia(q));
  const conn = connection();
  for (const mq of queries) mq.addEventListener("change", onChange);
  conn?.addEventListener?.("change", onChange);
  return () => {
    for (const mq of queries) mq.removeEventListener("change", onChange);
    conn?.removeEventListener?.("change", onChange);
  };
}

/** Live guard; false on the server and during hydration, so the server HTML is the fallback. */
function useShaderAllowed(): boolean {
  return useSyncExternalStore(subscribe, allowed, () => false);
}

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Coordinates follow the SVG layers: viewBox 1440x900, bottom-centre, cover (xMidYMax slice),
// so the sun sits exactly where `Sky` and the hills expect it.
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_skyHigh;
uniform vec3 u_skyLow;
uniform vec3 u_sun;
uniform vec3 u_light;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  float scale = max(u_res.x / 1440.0, u_res.y / 900.0);
  vec2 p = vec2((gl_FragCoord.x - u_res.x * 0.5) / scale + 720.0, 900.0 - gl_FragCoord.y / scale);

  vec3 col = mix(u_skyHigh, u_skyLow, clamp(p.y / 620.0, 0.0, 1.0));

  vec2 sun = vec2(720.0, 548.0);
  vec2 toSun = p - sun;
  float d = length(toSun);
  float glow = smoothstep(420.0, 0.0, d);
  float a = atan(toSun.y, toSun.x);
  float rays = 0.5 + 0.5 * sin(a * 13.0 + u_time * 0.12) * sin(a * 7.0 - u_time * 0.08);
  col = mix(col, u_sun, glow * glow * 0.55 + glow * rays * 0.1);

  // Light moving like water: stretched noise bands drifting sideways over the low sky.
  float band = smoothstep(260.0, 540.0, p.y);
  float n = noise(vec2(p.x * 0.004 + u_time * 0.03, p.y * 0.035));
  float ripple = sin(p.y * 0.16 + n * 6.2831 + u_time * 0.5) * 0.5 + 0.5;
  col = mix(col, u_light, band * smoothstep(0.72, 1.0, ripple) * 0.28);

  col = mix(col, u_sun, smoothstep(63.0, 61.0, d));
  outColor = vec4(col, 1.0);
}`;

const PALETTE: Record<string, ArtToken> = {
  u_skyHigh: "sky-high",
  u_skyLow: "sky-low",
  u_sun: "sun",
  u_light: "water-light",
};

/** `--art-*` token as 0..1 rgb; the shader follows the same tokens as the SVG. */
function tokenRgb(el: Element, token: ArtToken): [number, number, number] {
  const value = getComputedStyle(el).getPropertyValue(`--art-${token}`).trim().replace(/^#/, "");
  const n = Number.parseInt(value.length === 3 ? value.replace(/./g, "$&$&") : value, 16);
  if (!Number.isFinite(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGL2RenderingContext): WebGLProgram | null {
  const program = gl.createProgram();
  const shaders = (
    [
      [gl.VERTEX_SHADER, VERTEX],
      [gl.FRAGMENT_SHADER, FRAGMENT],
    ] as const
  ).map(([type, source]) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    return shader;
  });
  gl.linkProgram(program);
  for (const s of shaders) if (s) gl.deleteShader(s);
  if (shaders.includes(null) || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

type Callbacks = { onReady: () => void; onFail: () => void };

/** Runs the shader on `canvas` until the returned cleanup is called. */
function startShader(canvas: HTMLCanvasElement, { onReady, onFail }: Callbacks): () => void {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    onFail();
    return () => {};
  }

  let program: WebGLProgram | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let frame = 0;
  let visible = false;
  let lost = false;
  let ready = false;
  const start = performance.now();

  const init = () => {
    program = compile(gl);
    if (!program) return false;
    gl.useProgram(program);
    uniforms = Object.fromEntries(
      ["u_res", "u_time", ...Object.keys(PALETTE)].map((u) => [u, gl.getUniformLocation(program!, u)]),
    );
    for (const [u, token] of Object.entries(PALETTE)) gl.uniform3fv(uniforms[u], tokenRgb(canvas, token));
    return true;
  };

  const resize = () => {
    const ratio = shaderPixelRatio(window.devicePixelRatio);
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const draw = (now: number) => {
    frame = 0;
    if (!program || lost) return;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time, ((now - start) / 1000) % 3600);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!ready) {
      ready = true;
      onReady();
    }
    schedule();
  };

  const running = () => visible && !lost && !document.hidden;
  function schedule() {
    if (!frame && running()) frame = requestAnimationFrame(draw);
  }
  const pause = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  const update = () => (running() ? schedule() : pause());

  const onLost = (e: Event) => {
    e.preventDefault(); // allows webglcontextrestored
    lost = true;
    program = null;
    pause();
  };
  const onRestored = () => {
    lost = false;
    if (init()) update();
    else onFail();
  };

  if (!init()) {
    onFail();
    return () => {};
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    update();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", update);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return () => {
    pause();
    io.disconnect();
    document.removeEventListener("visibilitychange", update);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    if (program && !lost) gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

type WellspringShaderProps = {
  className?: string;
  /** Static layer shown without the shader and under it while it starts. Default: `Sky`. */
  fallback?: ReactNode;
};

/** Hero sky + light. Size it with `className`; decorative (aria-hidden). */
export function WellspringShader({ className, fallback = <Sky /> }: WellspringShaderProps) {
  const ok = useShaderAllowed();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);
  const run = ok && !failed;

  useEffect(() => {
    const canvas = ref.current;
    if (!run || !canvas) return;
    const stop = startShader(canvas, { onReady: () => setReady(true), onFail: () => setFailed(true) });
    return () => {
      stop();
      setReady(false);
    };
  }, [run]);

  return (
    <div aria-hidden="true" className={cn("relative isolate overflow-hidden", className)}>
      <div className="absolute inset-0">{fallback}</div>
      {run ? (
        <canvas
          ref={ref}
          data-shader=""
          className={cn(
            "absolute inset-0 size-full opacity-0 transition-opacity duration-(--duration-reveal) ease-(--ease-story)",
            ready && "opacity-100",
          )}
        />
      ) : null}
    </div>
  );
}
