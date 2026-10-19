// Licensed stock photos (ADR 007 Stock, 1.10g). Files live in public/media/ (downloaded
// from the Unsplash CDN as 1600px webp, never hotlinked). Every entry carries its credit,
// source and licence; `PhotoCredits` on /about lists them all.
// Subjects are landscapes, hands, candles and chapels; people only as hands or from
// behind. Never place one beside a quote or caption that implies a client.

export type MediaKey =
  | "riverDawn"
  | "weddingHands"
  | "familyPath"
  | "forestPath"
  | "heldHands"
  | "candle"
  | "teaLights"
  | "chapelCross"
  | "stillLake";

export type Media = {
  src: `/media/${string}.webp`;
  alt: string;
  /** Photographer, as shown on the source page. */
  credit: string;
  sourceUrl: `https://unsplash.com/photos/${string}`;
  licence: "Unsplash License";
  width: number;
  height: number;
  /** How people appear, if at all. No visible faces in this set. */
  people: "none" | "hands" | "from-behind";
  /** Where the image is meant to go (1.10h page headers, home chapters). */
  use: string;
};

export const UNSPLASH_LICENSE_URL = "https://unsplash.com/license";

export const MEDIA = {
  riverDawn: {
    src: "/media/river-dawn.webp",
    alt: "A river runs over stones through a green valley below misty hills at sunrise.",
    credit: "Evelin Magnus",
    sourceUrl: "https://unsplash.com/photos/j_UqTxfdYUw",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "none",
    use: "Home seasons chapter, services header",
  },
  weddingHands: {
    src: "/media/wedding-hands.webp",
    alt: "Two hands with wedding rings rest together over a bouquet of white roses.",
    credit: "Céline Druguet",
    sourceUrl: "https://unsplash.com/photos/Rnton6rhDe4",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "hands",
    use: "Weddings header, marriage season",
  },
  familyPath: {
    src: "/media/family-path.webp",
    alt: "Two adults and a child in a red coat walk hand in hand up a mountain road, seen from behind.",
    credit: "Alberto Casetta",
    sourceUrl: "https://unsplash.com/photos/REKXJ7JhwiI",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "from-behind",
    use: "Family season",
  },
  forestPath: {
    src: "/media/forest-path.webp",
    alt: "A dirt path winds through a sunlit green forest.",
    credit: "Howard Walsh",
    sourceUrl: "https://unsplash.com/photos/eohdpP_XFJw",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "none",
    use: "Programs header, renewal season",
  },
  heldHands: {
    src: "/media/held-hands.webp",
    alt: "One hand gently holds another on a white bed sheet.",
    credit: "Samuel Sng",
    sourceUrl: "https://unsplash.com/photos/nOXSLyMH6zg",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "hands",
    use: "Chaplaincy header, illness season",
  },
  candle: {
    src: "/media/candle.webp",
    alt: "A single candle glows in a frosted glass holder in a dim room.",
    credit: "Paolo Nicolello",
    sourceUrl: "https://unsplash.com/photos/KY6NHtBWJB8",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "none",
    use: "Funerals header, loss season",
  },
  teaLights: {
    src: "/media/tea-lights.webp",
    alt: "Many small tea lights burn together in the dark.",
    credit: "Mike Labrum",
    sourceUrl: "https://unsplash.com/photos/fvl4b1gjpbk",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "none",
    use: "Prayer header",
  },
  chapelCross: {
    src: "/media/chapel-cross.webp",
    alt: "A dark wooden cross stands on the altar of a small stone chapel lit by one window.",
    credit: "Vincent Yap",
    sourceUrl: "https://unsplash.com/photos/bSg7_zRx16Q",
    licence: "Unsplash License",
    width: 1600,
    height: 1067,
    people: "none",
    use: "About header",
  },
  stillLake: {
    src: "/media/still-lake.webp",
    alt: "A still lake reflects a soft dusk sky between dark wooded shores.",
    credit: "Chris Diamond",
    sourceUrl: "https://unsplash.com/photos/E7NTT6Obeng",
    licence: "Unsplash License",
    width: 1600,
    height: 1070,
    people: "none",
    use: "Home closing still-pool band, contact header",
  },
} as const satisfies Record<MediaKey, Media>;

export const MEDIA_LIST: readonly Media[] = Object.values(MEDIA);
