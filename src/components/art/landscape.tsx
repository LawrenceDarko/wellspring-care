import { useId, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Parallax } from "@/components/motion";
import { art, treePath } from "./tokens";

// The wellspring at dawn (ADR 007 Story): a spring rises under the sun between hills and
// runs toward the viewer. Each layer is its own <svg> on one shared viewBox so 1.10f can
// drift them at different depths. Layers are anchored bottom-centre and cover their box
// (`slice`): narrow screens crop the sides, the spring stays in view. Shapes run past the
// viewBox bottom (overflow visible) so a drifting layer never opens a gap; the
// `Landscape` box clips them.

const VIEW_W = 1440;
const VIEW_H = 900;

type LayerProps = { className?: string };

function Layer({ className, children }: LayerProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMax slice"
      overflow="visible"
      className={cn("block size-full", className)}
    >
      {children}
    </svg>
  );
}

export function Sky({ className }: LayerProps) {
  const id = useId();
  return (
    <Layer className={className}>
      <defs>
        <linearGradient id={`${id}sky`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="620">
          <stop offset="0" style={{ stopColor: art("sky-high") }} />
          <stop offset="1" style={{ stopColor: art("sky-low") }} />
        </linearGradient>
        <radialGradient id={`${id}glow`} gradientUnits="userSpaceOnUse" cx="720" cy="560" r="420">
          <stop offset="0" style={{ stopColor: art("sun"), stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: art("sun"), stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect x="-400" y="-400" width={VIEW_W + 800} height={VIEW_H + 800} fill={`url(#${id}sky)`} />
      <circle cx="720" cy="560" r="420" fill={`url(#${id}glow)`} />
      <circle cx="720" cy="548" r="62" style={{ fill: art("sun") }} />
    </Layer>
  );
}

export function FarHills({ className }: LayerProps) {
  return (
    <Layer className={className}>
      <path
        d="M-200 560 C 0 520 160 480 330 500 C 470 516 560 560 700 566 C 820 572 900 520 1060 490 C 1220 460 1340 500 1640 540 V1200 H-200 Z"
        style={{ fill: art("hill-far") }}
      />
    </Layer>
  );
}

export function NearHills({ className }: LayerProps) {
  return (
    <Layer className={className}>
      <path
        d="M-200 650 C 40 590 250 570 440 610 C 560 636 650 660 720 662 C 790 660 880 636 1000 610 C 1190 570 1400 590 1640 640 V1200 H-200 Z"
        style={{ fill: art("hill-mid") }}
      />
      <path
        d="M-200 760 C 60 700 260 690 420 730 C 520 756 590 790 640 830 L 800 830 C 850 790 920 756 1020 730 C 1180 690 1380 700 1640 750 V1200 H-200 Z"
        style={{ fill: art("hill-near") }}
      />
    </Layer>
  );
}

/** The spring and the stream it feeds, with a column of sunlight on the water. */
export function Water({ className }: LayerProps) {
  return (
    <Layer className={className}>
      <path
        d="M706 640 C 690 690 640 740 590 790 C 530 850 470 880 430 900 L 360 1200 H 1080 L 1010 900 C 970 880 910 850 850 790 C 800 740 750 690 734 640 Z"
        style={{ fill: art("water") }}
      />
      <ellipse cx="720" cy="640" rx="40" ry="7" style={{ fill: art("water-light") }} />
      <g strokeLinecap="round" style={{ stroke: art("water-light") }} strokeWidth="4">
        <path d="M680 700 H 724" />
        <path d="M700 742 H 770" />
        <path d="M640 800 H 716" />
        <path d="M744 812 H 820" />
        <path d="M600 860 H 690" />
        <path d="M760 876 H 880" />
      </g>
      <g strokeLinecap="round" style={{ stroke: art("sun") }} strokeWidth="5" opacity="0.8">
        <path d="M712 672 H 730" />
        <path d="M704 724 H 738" />
        <path d="M698 772 H 744" />
        <path d="M690 836 H 752" />
      </g>
    </Layer>
  );
}

// [x, base y, height, crown width]. The two by the stream stay in view when a narrow
// screen crops the sides.
const TREES: readonly (readonly [x: number, y: number, h: number, w: number])[] = [
  [70, 790, 300, 70],
  [150, 790, 210, 54],
  [230, 790, 260, 62],
  [300, 795, 150, 42],
  [468, 846, 120, 32],
  [978, 846, 96, 28],
  [1130, 785, 170, 46],
  [1210, 785, 280, 66],
  [1300, 785, 220, 56],
  [1380, 785, 320, 74],
];

/** Foreground banks either side of the stream, with the trees standing on them. */
export function Trees({ className }: LayerProps) {
  return (
    <Layer className={className}>
      <path
        d="M-200 760 C 40 740 300 750 450 820 C 510 850 540 880 560 900 L 520 1200 H -200 Z"
        style={{ fill: art("ground") }}
      />
      <path
        d="M1640 750 C 1400 736 1140 750 990 820 C 930 850 900 880 880 900 L 920 1200 H 1640 Z"
        style={{ fill: art("ground") }}
      />
      <g style={{ fill: art("tree") }}>
        {TREES.map(([x, y, h, w]) => (
          <path key={x} d={treePath(x, y, h, w)} />
        ))}
      </g>
    </Layer>
  );
}

export function Birds({ className }: LayerProps) {
  return (
    <Layer className={className}>
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        style={{ stroke: art("bird") }}
        opacity="0.7"
      >
        <path d="M860 300 q 12 -10 24 0 q 12 -10 24 0" />
        <path d="M920 262 q 9 -8 18 0 q 9 -8 18 0" />
        <path d="M968 318 q 8 -7 16 0 q 8 -7 16 0" />
      </g>
    </Layer>
  );
}

/** Back to front. `speed` is the Parallax depth (share of viewport height). The stream
 * moves with its hills; the foreground moves with the page. */
export const LANDSCAPE_LAYERS: readonly {
  key: string;
  Layer: ComponentType<LayerProps>;
  speed: number;
}[] = [
  { key: "sky", Layer: Sky, speed: 0.3 },
  { key: "far-hills", Layer: FarHills, speed: 0.2 },
  { key: "near-hills", Layer: NearHills, speed: 0.1 },
  { key: "water", Layer: Water, speed: 0.1 },
  { key: "trees", Layer: Trees, speed: 0 },
  { key: "birds", Layer: Birds, speed: 0.36 },
];

type LandscapeProps = {
  className?: string;
  /** Drift the layers at their depths on scroll (static under reduced motion). */
  parallax?: boolean;
};

/** All layers stacked in a clipped box. Size it with `className` (e.g. `h-svh`). */
export function Landscape({ className, parallax = false }: LandscapeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundColor: art("sky-high") }}
    >
      {LANDSCAPE_LAYERS.map(({ key, Layer, speed }) =>
        parallax && speed !== 0 ? (
          <Parallax key={key} speed={speed} className="absolute inset-0">
            <Layer />
          </Parallax>
        ) : (
          <div key={key} className="absolute inset-0">
            <Layer />
          </div>
        ),
      )}
    </div>
  );
}
