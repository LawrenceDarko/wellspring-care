# 008 Stock media set (2026-10-19)
## Context
ADR 007 allows licensed stock from Unsplash/Pexels for home chapters, services and content headers (<= 10 images, <= 1 short loop video). Task 1.10g picks the set.
## Options
- Source: Unsplash (free licence, CDN serves resized webp, credit not required but given) / Pexels (API key needed; video via API only).
- Processing: Unsplash CDN `w=1600&h=1067&fit=crop&fm=webp` / local sharp/ffmpeg pipeline (sharp is only a transitive dep of next, not pinned in ADR 001).
- Video: one Pexels loop / none.
## Decision
- Unsplash only, Unsplash License (free tier; Unsplash+ files live on `plus.unsplash.com` and were excluded; licence checked on the two picks that showed in sponsored rows).
- Nine images in `public/media/*.webp`, 1600x1067 landscape (still-lake 1600x1070), quality 55-70, 2.9 MB total, largest 763 KB. Fetched once from `images.unsplash.com`, no hotlinking at runtime.
- Set: river at dawn (home chapter, services), wedding hands over roses (weddings, marriage), family from behind on a mountain road (family), sunlit forest path (programs, renewal), held hands on a bed sheet (chaplaincy, illness), single candle (funerals, loss), many tea lights (prayer), stone chapel cross (about), still lake at dusk (closing still-pool band, contact).
- No faces: people appear only as hands or from behind (`people` field). Candidates with faces or a childbirth scene were rejected after a contact-sheet review.
- No video for now: Unsplash has none, Pexels video needs an API key, and the hero already moves (shader + scroll). Reconsider only with a key and a measured LCP.
- Registry `src/content/media.ts` (`MEDIA`, `MEDIA_LIST`: src, alt, credit, sourceUrl, licence, width, height, people, use). Credits: `PhotoCredits` section at the end of /about.
## Verification
`test/media.test.tsx`: <= 10 entries, every entry has alt + credit + source + licence + size, every file exists (< 1 MB) and no unregistered files, `people` never shows a face, credits list renders every entry with its source link.
## Consequences
1.10h uses `MEDIA` for page headers via `next/image` (local files, width/height known). Do not set a photo next to a quote or testimonial. Adding an image means adding a registry entry (test fails on unregistered files).
