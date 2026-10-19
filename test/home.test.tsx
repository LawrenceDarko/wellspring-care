// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HomeSections, type HomeData } from "@/components/site/home";
import { SETTINGS_DEFAULTS } from "@/server/data/settings";

afterEach(cleanup);

const empty: HomeData = { settings: SETTINGS_DEFAULTS, categories: [], events: [], testimonials: [] };

describe("home page", () => {
  it("renders the hero CTAs and the configured tagline", () => {
    render(<HomeSections {...empty} settings={{ ...SETTINGS_DEFAULTS, tagline: "Test tagline" }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Test tagline" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request Spiritual Care" }).getAttribute("href")).toBe("/services");
    expect(screen.getByRole("link", { name: "Explore Programs" }).getAttribute("href")).toBe("/programs");
  });

  it("renders the fixed sections", () => {
    render(<HomeSections {...empty} />);
    for (const name of [
      "How we can walk with you",
      "Spiritual Renewal Journey",
      "Weddings, funerals and memorials",
      "Family and marriage",
      "Our mission and values",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
    expect(screen.getByRole("heading", { level: 3, name: "4-week renewal" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "8-week renewal" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Learn about chaplaincy" }).getAttribute("href")).toBe("/chaplaincy");
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
        categories={[{ id: "c1", slug: "pastoral-care", name: "Pastoral Care", summary: "Care summary" }]}
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
    expect(screen.getByRole("link", { name: "Pastoral Care" }).getAttribute("href")).toBe(
      "/services?category=pastoral-care",
    );
    expect(screen.getByRole("heading", { name: "Upcoming events and retreats" })).toBeTruthy();
    expect(screen.getByText("Apr 5, 2030, 10:00 AM")).toBeTruthy(); // America/New_York
    expect(screen.getByRole("heading", { name: "In their words" })).toBeTruthy();
    expect(screen.getByText("Fictional quote")).toBeTruthy();
  });
});
