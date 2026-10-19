import { useId, type ComponentType } from "react";
import type { SeasonKey } from "@/domain/seasons";
import { cn } from "@/lib/utils";
import { art, treePath, type ArtToken } from "./tokens";

// Five stretches of the same stream, one per life season (ADR 007 Story), each at its own
// hour: two streams meet in the morning (marriage), trees grow together at midday
// (family), a spring rises at dawn (renewal), a lamp is lit by the water in the evening
// (illness and hospice), a still pool under the moon (loss and memorial).

type ArtProps = { className?: string };

function Vignette({
  className,
  sky,
  children,
}: ArtProps & { sky: readonly [top: ArtToken, bottom: ArtToken]; children: React.ReactNode }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: art(sky[0]) }} />
          <stop offset="1" style={{ stopColor: art(sky[1]) }} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id}sky)`} />
      {children}
    </svg>
  );
}

const HORIZON = "M0 96 C 50 84 100 80 150 88 C 200 96 250 82 320 86 V200 H0 Z";

export function MarriageArt({ className }: ArtProps) {
  return (
    <Vignette className={className} sky={["sky-high", "sky-low"]}>
      <circle cx="252" cy="42" r="14" style={{ fill: art("sun") }} />
      <path d={HORIZON} style={{ fill: art("hill-far") }} />
      <path d="M0 108 C 80 100 220 100 320 106 V200 H0 Z" style={{ fill: art("hill-mid") }} />
      {/* Two streams meet and run on as one. */}
      <path
        d="M0 112 C 60 114 120 122 160 136 C 200 122 262 112 320 110 V122 C 264 126 214 134 186 146 C 196 164 206 184 214 200 H112 C 118 184 128 164 138 146 C 108 134 56 126 0 124 Z"
        style={{ fill: art("water") }}
      />
      <g strokeLinecap="round" strokeWidth="2" style={{ stroke: art("water-light") }}>
        <path d="M150 162 H170" />
        <path d="M140 182 H166" />
        <path d="M30 118 H52" />
        <path d="M268 116 H290" />
      </g>
      <g style={{ fill: art("tree") }}>
        <path d={treePath(150, 124, 40, 12)} />
        <path d={treePath(168, 124, 46, 13)} />
      </g>
    </Vignette>
  );
}

export function FamilyArt({ className }: ArtProps) {
  return (
    <Vignette className={className} sky={["sky-high", "sky-high"]}>
      <path d={HORIZON} style={{ fill: art("hill-far") }} />
      <path d="M0 116 C 80 106 200 104 320 112 V200 H0 Z" style={{ fill: art("hill-mid") }} />
      <path
        d="M174 108 C 168 130 210 144 202 168 C 198 182 190 194 186 200 H262 C 262 186 266 170 256 152 C 244 130 196 122 190 108 Z"
        style={{ fill: art("water") }}
      />
      <path d="M0 160 C 60 150 130 152 180 170 C 186 180 188 192 186 200 H0 Z" style={{ fill: art("hill-near") }} />
      {/* A household of trees, tall to small, on one bank. */}
      <g style={{ fill: art("tree") }}>
        <path d={treePath(54, 166, 92, 24)} />
        <path d={treePath(88, 166, 70, 20)} />
        <path d={treePath(116, 168, 42, 14)} />
        <path d={treePath(136, 170, 32, 11)} />
      </g>
      <g fill="none" strokeLinecap="round" strokeWidth="2" style={{ stroke: art("bird") }} opacity="0.7">
        <path d="M206 50 q 6 -5 12 0 q 6 -5 12 0" />
        <path d="M236 40 q 5 -4 10 0 q 5 -4 10 0" />
        <path d="M232 62 q 4 -4 8 0 q 4 -4 8 0" />
      </g>
    </Vignette>
  );
}

export function RenewalArt({ className }: ArtProps) {
  return (
    <Vignette className={className} sky={["sky-low", "sky-low"]}>
      <circle cx="160" cy="106" r="36" style={{ fill: art("sun") }} />
      <path d="M0 100 C 60 92 110 96 160 104 C 210 96 260 92 320 100 V200 H0 Z" style={{ fill: art("hill-far") }} />
      <path d="M0 118 C 100 110 220 110 320 118 V200 H0 Z" style={{ fill: art("hill-mid") }} />
      {/* The spring: a pool with rings spreading from where the water rises. */}
      <ellipse cx="164" cy="150" rx="118" ry="28" style={{ fill: art("water") }} />
      <g fill="none" strokeWidth="2" style={{ stroke: art("water-light") }}>
        <ellipse cx="164" cy="150" rx="18" ry="4" />
        <ellipse cx="164" cy="150" rx="44" ry="10" opacity="0.8" />
        <ellipse cx="164" cy="150" rx="76" ry="17" opacity="0.5" />
      </g>
      <path d="M0 176 C 80 168 200 170 320 180 V200 H0 Z" style={{ fill: art("hill-near") }} />
      {/* A new shoot on the near bank. */}
      <g style={{ fill: art("ground") }}>
        <path d="M52 186 C 52 176 54 168 58 160 L 60 161 C 57 169 55 177 55 186 Z" />
        <path d="M57 166 C 46 164 38 156 36 146 C 48 148 56 156 57 166 Z" />
        <path d="M58 162 C 64 152 74 148 84 150 C 80 160 70 164 58 162 Z" />
      </g>
    </Vignette>
  );
}

export function IllnessArt({ className }: ArtProps) {
  const id = useId();
  return (
    <Vignette className={className} sky={["sky-dusk", "sky-low"]}>
      <defs>
        <radialGradient id={`${id}lamp`}>
          <stop offset="0" style={{ stopColor: art("lamp"), stopOpacity: 0.7 }} />
          <stop offset="1" style={{ stopColor: art("lamp"), stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="58" cy="34" r="2.5" style={{ fill: art("moon") }} />
      <path d={HORIZON} style={{ fill: art("hill-far") }} />
      <path d="M0 112 C 90 104 220 104 320 110 V200 H0 Z" style={{ fill: art("hill-near") }} />
      <path d="M0 150 C 90 142 230 142 320 150 V200 H0 Z" style={{ fill: art("water") }} />
      {/* A house on the bank with one lit window, and its light on the water. */}
      <circle cx="196" cy="118" r="44" fill={`url(#${id}lamp)`} />
      <g style={{ fill: art("tree") }}>
        <path d="M168 142 V116 L 196 96 L 224 116 V142 Z" />
        <path d={treePath(246, 142, 52, 16)} />
        <path d={treePath(266, 144, 36, 12)} />
      </g>
      <rect x="186" y="118" width="14" height="14" rx="1" style={{ fill: art("lamp") }} />
      <g strokeLinecap="round" strokeWidth="2.5" style={{ stroke: art("lamp") }} opacity="0.75">
        <path d="M184 164 H202" />
        <path d="M180 176 H206" />
        <path d="M188 188 H200" />
      </g>
    </Vignette>
  );
}

export function LossArt({ className }: ArtProps) {
  return (
    <Vignette className={className} sky={["sky-night", "sky-dusk"]}>
      <circle cx="226" cy="50" r="18" style={{ fill: art("moon") }} />
      <path d={HORIZON} style={{ fill: art("hill-near") }} />
      <path d="M0 118 C 90 112 220 112 320 118 V200 H0 Z" style={{ fill: art("ground") }} />
      {/* A still pool holding the moon. */}
      <ellipse cx="190" cy="156" rx="120" ry="26" style={{ fill: art("water") }} />
      <g strokeLinecap="round" style={{ stroke: art("moon") }}>
        <path d="M216 146 H236" strokeWidth="3" />
        <path d="M220 154 H232" strokeWidth="2" opacity="0.7" />
      </g>
      {/* One tree, and a cairn of stones on the near bank. */}
      <path d={treePath(52, 148, 78, 22)} style={{ fill: art("tree") }} />
      <g style={{ fill: art("stone") }}>
        <ellipse cx="96" cy="182" rx="16" ry="7" />
        <ellipse cx="96" cy="172" rx="11" ry="5" />
        <ellipse cx="96" cy="164" rx="7" ry="4" />
      </g>
    </Vignette>
  );
}

export const SEASON_ART: Record<SeasonKey, ComponentType<ArtProps>> = {
  marriage: MarriageArt,
  family: FamilyArt,
  renewal: RenewalArt,
  illness: IllnessArt,
  loss: LossArt,
};

/** The vignette for a life season from `SEASONS`. */
export function SeasonArt({ season, className }: ArtProps & { season: SeasonKey }) {
  const Art = SEASON_ART[season];
  return <Art className={className} />;
}
