# 007 Motion, imagery and nav redesign (2026-10-19)
## Context
User review after 1.9: the UI still reads flat and the header is broken (wordmark row + a second row of ten links). User asked for a full public-site redesign with scroll-triggered storytelling, parallax, vectors, images/video and WebGL. Supersedes ADR 006 rules 1 and 5 for public pages only. Palette, type, sentence case and copy rules from ADR 006 stand.
## Options
- Motion: GSAP ScrollTrigger + Lenis (chosen by user) / Motion (framer) / both.
- Imagery: original SVG vectors + licensed stock (chosen by user: both) / user photos only.
- WebGL: one hero shader (chosen by user) / three.js scene / none.
## Decision
- Story: "the wellspring". The hero is a spring at dawn; scrolling walks downstream through the five life seasons (marriage, family, renewal, illness, loss) as landscape chapters, ending at the still pool where the person asks for care. The seasons path stays the signature device. Now it is the scroll narrative itself.
- Motion stack: `gsap` + `ScrollTrigger` (pinned, scrubbed chapters), `@gsap/react` `useGSAP` (cleanup on unmount), `lenis` smooth scroll driven by the GSAP ticker. All in client islands under `src/components/motion/`; pages stay server components.
- WebGL: one raw WebGL2 fragment shader (water + light) behind the hero, no library. It only runs when WebGL2 is available, reduced motion is off, `saveData` is off and the viewport is >= 768px. DPR is capped at 1.5 and it pauses offscreen or in a hidden tab. Fallback: the static SVG hero layer.
- Vectors: original layered SVG landscape (sky, far/near hills, spring, trees, birds, season vignettes) in `src/components/art/`, colored from tokens, `aria-hidden`.
- Stock: Unsplash/Pexels only, downloaded to `public/media/` (no hotlinking), each with credit, source URL, licence and alt text in `src/content/media.ts`. Subjects are landscapes, hands, candles, chapels and gatherings seen from behind. Never a face beside a quote or caption that implies a client (invariant: no fake testimonials). Video is a muted, looping, `poster`ed `<video>`, never autoplayed under reduced motion or saveData.
- Nav: one row. Wordmark, grouped menus "Care" (Services, Chaplaincy, Weddings, Funerals & memorials), "Programs & events" (Programs, Events & retreats, Resources), plus links Prayer, About, and a primary "Request care" button (/services). Contact moves into the About group and the footer. Sticky: transparent over the hero, linen with a hairline once scrolled, hides on scroll down and shows on scroll up. Mobile: a full-screen forest overlay with staggered links. Radix NavigationMenu via `npx shadcn add navigation-menu`.
## Rules (public pages; replace ADR 006 rules 1 and 5)
1. Progressive enhancement: all content is visible and in DOM order without JS. Only JS sets hidden "from" states.
2. `prefers-reduced-motion: reduce` -> no Lenis, no pin/scrub, no shader, no parallax; reveals become instant. Tested.
3. Motion explains the story (season changes, depth); no decorative bounce, no scroll-jacked text that can't be read at rest.
4. Budget: motion JS loads only on public pages; home LCP element is text or the SVG, never the shader or a video.
5. Staff/portal UI keeps ADR 006 rule 7: no bands, no scroll motion.
## Pinned versions (added to ADR 001)
gsap 3.15.0 (Standard "no charge" licence, commercial use allowed, all plugins included), @gsap/react 2.1.2 (peers gsap ^3.12.5, react >=17), lenis 1.3.26 (MIT; 1.3.27 is 4 days old, held).
## Verification
`npm ls gsap @gsap/react lenis` clean; typecheck pass.
## Consequences
Tasks 1.10b-1.10i in PLAN.md; Phase 2 resumes after the 1.10 GATE. `MAIN_NAV` shape changes (groups), so the site-shell tests change in 1.10c.
