// Hero shader guard (ADR 007 WebGL). Pure, so the rules are tested without a browser:
// the shader only runs with WebGL2, motion allowed, data saver off and a >= 768px viewport.
// Anything else keeps the static SVG layer.

export const SHADER_MIN_WIDTH = 768;
export const SHADER_MAX_DPR = 1.5;

export type ShaderEnv = {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  viewportWidth: number;
};

export function canRunShader(env: ShaderEnv): boolean {
  return (
    env.webgl2 &&
    !env.reducedMotion &&
    !env.saveData &&
    Number.isFinite(env.viewportWidth) &&
    env.viewportWidth >= SHADER_MIN_WIDTH
  );
}

/** Backing-store scale for the canvas: the device ratio, capped at 1.5, never below 1. */
export function shaderPixelRatio(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio < 1) return 1;
  return Math.min(devicePixelRatio, SHADER_MAX_DPR);
}
