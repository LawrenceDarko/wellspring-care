import Image from "next/image";
import { SeasonArt } from "@/components/art";
import { Parallax } from "@/components/motion";
import { MEDIA, type MediaKey } from "@/content/media";
import type { SeasonKey } from "@/domain/seasons";

// Page header band (ADR 007, 1.10h): a registered stock photo or a season vignette above
// the book page, drifting slowly with the scroll. The layer is oversized so the drift
// never shows an edge; under reduced motion it simply sits still. Never beside a quote.

const band = "relative h-[clamp(11rem,34svh,22rem)] w-full overflow-hidden border-b border-gold/40 bg-secondary";
const DRIFT = 0.1;

type PageHeaderProps = { media: MediaKey; season?: never } | { season: SeasonKey; media?: never };

export function PageHeader({ media, season }: PageHeaderProps) {
  if (media) {
    const m = MEDIA[media];
    return (
      <div data-page-header="media" className={band}>
        <Parallax speed={DRIFT} className="absolute inset-x-0 -inset-y-[18%]">
          <Image src={m.src} alt={m.alt} fill preload sizes="100vw" className="object-cover" />
        </Parallax>
      </div>
    );
  }
  return (
    <div data-page-header="art" aria-hidden="true" className={band}>
      <div className="absolute top-1/2 left-1/2 w-[max(100%,40rem)] -translate-x-1/2 -translate-y-1/2">
        <Parallax speed={DRIFT}>
          <SeasonArt season={season!} />
        </Parallax>
      </div>
    </div>
  );
}
