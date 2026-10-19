// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

// GSAP's ScrollTrigger needs matchMedia at import; answer "reduced motion" so the islands stay static.
vi.hoisted(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion: reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })) as unknown as typeof window.matchMedia;
});
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { SEASONS } from "@/domain/seasons";
import { HomeSections, type HomeData } from "@/components/site/home";
import { SETTINGS_DEFAULTS } from "@/server/data/settings";

afterEach(cleanup);

const empty: HomeData = { settings: SETTINGS_DEFAULTS, categories: [], events: [], testimonials: [] };

describe("home page", () => {
  it("renders the hero CTAs and the configured tagline", () => {
    render(<HomeSections {...empty} settings={{ ...SETTINGS_DEFAULTS, tagline: "Test tagline" }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Test tagline" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request spiritual care" }).getAttribute("href")).toBe("/services");
    expect(screen.getByRole("link", { name: "Explore programs" }).getAttribute("href")).toBe("/programs");
  });

  it("hero is the light dawn landscape the header reads its tone from", () => {
    render(<HomeSections {...empty} />);
    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
    expect(hero.getAttribute("data-hero")).toBe("light");
    // Art is decorative; under reduced motion the shader guard keeps the SVG sky only.
    expect(hero.querySelector('[aria-hidden="true"] svg')).toBeTruthy();
    expect(hero.querySelector("canvas")).toBeNull();
  });

  it("downstream chapter lists the five seasons as an ordered list of links, in order", () => {
    render(<HomeSections {...empty} />);
    const path = screen.getByRole("list", { name: "Care for each season of life" });
    expect(path.tagName).toBe("OL");
    expect(path.closest("section")?.classList.contains("band")).toBe(true);
    const items = within(path).getAllByRole("listitem");
    expect(items).toHaveLength(SEASONS.length);
    SEASONS.forEach((season, i) => {
      const link = within(items[i]).getByRole("link", { name: season.name });
      expect(link.getAttribute("href")).toBe(season.href);
      expect(items[i].textContent).toContain(season.line);
      // Each scene carries its own vignette inline (no JS needed to see it).
      expect(items[i].querySelector('[aria-hidden="true"] svg')).toBeTruthy();
    });
    // Markers are decorative; the list itself carries the order.
    expect(items[0].querySelector('[aria-hidden="true"]')?.textContent).toBe("1");
    // Without motion there is no story stage and no active scene.
    expect(path.closest("section")?.hasAttribute("data-story")).toBe(false);
    expect(path.querySelector("[data-active]")).toBeNull();
  });

  it("closes at the still pool with a request CTA", () => {
    render(<HomeSections {...empty} />);
    expect(screen.getByRole("heading", { level: 2, name: "When you are ready, ask for care" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Find care by season" }).getAttribute("href")).toBe("/services");
    expect(screen.getByRole("link", { name: "Contact us" }).getAttribute("href")).toBe("/contact");
  });

  it("server HTML (no JS) holds every heading and line, with no hidden from-states", () => {
    const html = renderToStaticMarkup(<HomeSections {...empty} settings={{ ...SETTINGS_DEFAULTS, tagline: "Test tagline" }} />);
    for (const text of [
      "Test tagline",
      "Request spiritual care",
      "Explore programs",
      "Care for each season of life",
      ...SEASONS.flatMap((s) => [s.name, s.line]),
      "Spiritual Renewal Journey",
      "Ceremonies, families and chaplaincy",
      "Our mission and values",
      "When you are ready, ask for care",
    ]) {
      expect(html, text).toContain(text);
    }
    // SVG art uses stop-opacity and transform attributes; content must have no inline from-state.
    expect(html).not.toMatch(/(?<![-\w])opacity:\s*0(?![.\d])|visibility:\s*hidden|style="[^"]*(transform|translate)/);
    expect(html).not.toContain("data-story");
    expect(html).not.toContain("<canvas");
  });

  it("renders the fixed sections", () => {
    render(<HomeSections {...empty} />);
    for (const name of [
      "Spiritual Renewal Journey",
      "Ceremonies, families and chaplaincy",
      "Our mission and values",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
    expect(screen.getByText("4 weeks").tagName).toBe("DT");
    expect(screen.getByText("8 weeks").tagName).toBe("DT");
    for (const [name, href] of [
      ["Weddings", "/weddings"],
      ["Funerals and memorials", "/funerals"],
      ["Chaplaincy", "/chaplaincy"],
    ]) {
      expect(screen.getByRole("heading", { level: 3, name }).querySelector("a")?.getAttribute("href")).toBe(href);
    }
    // No card grids (ADR 006): nothing uses the card surface.
    expect(document.querySelector(".bg-card")).toBeNull();
  });

  it("hides testimonials and events sections when there is no data", () => {
    render(<HomeSections {...empty} />);
    expect(screen.queryByRole("heading", { name: "In their words" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Upcoming events and retreats" })).toBeNull();
    expect(document.querySelector("blockquote")).toBeNull();
  });

  it("renders categories, events and testimonials when present", () => {
    render(
      <HomeSections
        {...empty}
        categories={[{ id: "c1", slug: "marriage-and-family", name: "Marriage and family", summary: "Care summary" }]}
        events={[
          {
            id: "e1",
            slug: "spring-retreat",
            title: "Spring Retreat",
            summary: "A quiet day",
            startsAt: new Date("2030-04-05T14:00:00Z"),
            locationText: "Fictional Chapel",
          },
        ]}
        testimonials={[{ id: "t1", quote: "Fictional quote", attribution: "Participant" }]}
      />,
    );
    // Categories appear under their season on the path.
    const family = within(screen.getByRole("list", { name: "Care for each season of life" }))
      .getByRole("link", { name: "Family" })
      .closest("li")!;
    expect(within(family).getByRole("link", { name: "Marriage and family" }).getAttribute("href")).toBe(
      "/services?category=marriage-and-family",
    );
    expect(screen.getByRole("heading", { name: "Upcoming events and retreats" })).toBeTruthy();
    expect(screen.getByText("Apr 5, 2030, 10:00 AM")).toBeTruthy(); // America/New_York
    expect(screen.getByRole("heading", { name: "In their words" })).toBeTruthy();
    expect(screen.getByText("Fictional quote")).toBeTruthy();
  });
});
