// Vitest stand-in for `next/font/google`, which only works through the Next
// compiler transform. Every font loader returns stable class/variable names.
type FontOptions = { variable?: string };

function loader(options: FontOptions = {}) {
  return { className: "font-stub", variable: options.variable ? "font-stub-var" : "", style: { fontFamily: "stub" } };
}

export const Fraunces = loader;
export const Source_Sans_3 = loader;
