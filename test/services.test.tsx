// @vitest-environment jsdom
import { motion } from "./helpers/match-media";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  formatMoney,
  groupServicesBySeason,
  ServiceDetail,
  ServicesDirectory,
  slugParam,
} from "@/components/site/services";
import { MEDIA } from "@/content/media";
import type { PublicPackage, PublicServiceDetail } from "@/server/data/catalog";

afterEach(() => {
  cleanup();
  motion.reduce = true;
});

/** Everything a reader gets: text, link targets, image alt text, in DOM order. */
function readerView(el: HTMLElement) {
  const links = [...el.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  const alts = [...el.querySelectorAll("img")].map((i) => i.getAttribute("alt"));
  return { text: el.textContent, links, alts };
}

/** Renders `ui` with reduced motion and with motion; returns both reader views and the motion container. */
function renderBothWays(ui: React.ReactElement) {
  motion.reduce = true;
  const still = render(ui);
  const reduced = readerView(still.container);
  expect(still.container.querySelector("[style*='opacity']")).toBeNull();
  cleanup();
  motion.reduce = false;
  const moving = render(ui);
  return { reduced, animated: readerView(moving.container), container: moving.container };
}

const categories = [
  { id: "c1", slug: "pastoral-care", name: "Pastoral Care", summary: "Care summary" },
  { id: "c2", slug: "marriage-and-family", name: "Marriage and Family", summary: "Family summary" },
];
const service = {
  id: "s1",
  slug: "premarital",
  name: "Premarital preparation",
  summary: "Preparing together.",
  intakeFormKey: "family-couples",
  category: { slug: "marriage-and-family", name: "Marriage and Family" },
};
const pkg: PublicPackage = {
  id: "p1",
  slug: "6-sessions",
  name: "6 sessions over 6 weeks",
  sessionCount: 6,
  minutesPerSession: 60,
  durationWeeks: 6,
  channels: ["in_person", "video"],
  responseTimeText: "Within 2 business days",
  includedItems: ["Workbook"],
  priceCents: 46000,
  currency: "USD",
  depositRule: { type: "percent", percent: 25 },
  installmentsAllowed: true,
};

describe("slugParam", () => {
  it("accepts well-formed slugs only", () => {
    expect(slugParam("pastoral-care")).toBe("pastoral-care");
    expect(slugParam(["pastoral-care", "x"])).toBe("pastoral-care");
    for (const bad of [undefined, "", "Pastoral", "a b", "x/../y", "a--b", "-a", "a".repeat(81)]) {
      expect(slugParam(bad)).toBeUndefined();
    }
  });
});

describe("services directory", () => {
  it("lists services with starting price and links to detail pages", () => {
    render(
      <ServicesDirectory
        categories={categories}
        services={[
          { ...service, startingPrice: { cents: 32000, currency: "USD" } },
          { ...service, id: "s2", slug: "faith-questions", name: "Faith questions" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Services" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Premarital preparation" }).getAttribute("href")).toBe(
      "/services/premarital",
    );
    expect(screen.getByText("From $320")).toBeTruthy();
    expect(screen.getByText("Pricing on request")).toBeTruthy();
    expect(screen.getByText(/not a medical, mental-health or emergency provider/)).toBeTruthy();
  });

  it("groups all services by life season in season order, with anchors and unmapped last", () => {
    const grief = {
      ...service,
      id: "s3",
      slug: "grief",
      name: "Grief care",
      category: { slug: "grief-and-hard-times", name: "Grief" },
    };
    const other = {
      ...service,
      id: "s4",
      slug: "misc",
      name: "Misc care",
      category: { slug: "unmapped", name: "Unmapped" },
    };
    expect(groupServicesBySeason([other, grief, service]).map((g) => g.key)).toEqual(["family", "loss", "other"]);

    const { container } = render(<ServicesDirectory categories={categories} services={[other, grief, service]} />);
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual(["Family", "Loss and memorial", "Other care"]);
    const family = container.querySelector("#season-family")!;
    expect(within(family as HTMLElement).getByRole("link", { name: "Premarital preparation" })).toBeTruthy();
    expect(container.querySelector("#season-loss")).not.toBeNull();
    expect(container.querySelector("#season-marriage")).toBeNull();
    expect(container.querySelector(".rounded-lg")).toBeNull();
  });

  it("filters by category slug only and marks the current filter", () => {
    render(<ServicesDirectory categories={categories} services={[service]} selected="marriage-and-family" />);
    const nav = screen.getByRole("navigation", { name: "Service categories" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/services",
      "/services?category=pastoral-care",
      "/services?category=marriage-and-family",
    ]);
    expect(within(nav).getByRole("link", { name: "Marriage and Family" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "All services" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Marriage and Family" })).toBeTruthy();
  });

  it("explains an unknown category and handles an empty catalog", () => {
    render(<ServicesDirectory categories={[]} services={[]} unknownCategory />);
    expect(screen.getByRole("status").textContent).toContain("not available");
    expect(screen.queryByRole("navigation", { name: "Service categories" })).toBeNull();
    expect(screen.getByText(/No services are listed here yet/)).toBeTruthy();
  });
});

describe("service detail", () => {
  const detail: PublicServiceDetail = {
    ...service,
    eligibility: "Engaged couples. Not a substitute for licensed counseling.",
    startingPrice: { cents: 46000, currency: "USD" },
    packages: [pkg],
  };

  it("renders packages, starting price, eligibility and the request button", () => {
    render(<ServiceDetail service={detail} />);
    expect(screen.getByRole("heading", { level: 1, name: "Premarital preparation" })).toBeTruthy();
    expect(screen.getByText("Starting at $460")).toBeTruthy();
    const aside = screen.getByRole("complementary", { name: "Who this is for" });
    expect(within(aside).getByText(detail.eligibility!)).toBeTruthy();
    expect(within(aside).getByText(/Pastoral and spiritual care only/)).toBeTruthy();
    const card = screen.getByRole("heading", { level: 3, name: "6 sessions over 6 weeks" }).closest("li")!;
    expect(within(card).getByText("$460")).toBeTruthy();
    expect(within(card).getByText("6 x 60 minutes")).toBeTruthy();
    expect(within(card).getByText("In person, Video")).toBeTruthy();
    expect(within(card).getByText("Workbook")).toBeTruthy();
    expect(within(card).getByText("25% deposit to reserve. Installments available")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request this service" }).getAttribute("href")).toBe("/request/premarital");
    // Package cards are the only cards on the page (ADR 006 rule 3).
    expect([...document.querySelectorAll(".rounded-lg")]).toEqual([card]);
    expect(screen.getByRole("link", { name: "Marriage and Family" }).getAttribute("href")).toBe(
      "/services?category=marriage-and-family",
    );
  });

  it("still offers a request when no package is active", () => {
    render(<ServiceDetail service={{ ...detail, startingPrice: undefined, packages: [], eligibility: undefined }} />);
    expect(screen.getByText("Pricing on request")).toBeTruthy();
    expect(screen.getByText(/Pricing for this service is being finalized/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request this service" })).toBeTruthy();
  });

  it("formats cents without float drift", () => {
    expect(formatMoney({ cents: 7550, currency: "USD" })).toBe("$75.50");
    expect(formatMoney({ cents: 8000, currency: "USD" })).toBe("$80");
  });
});

describe("services motion treatments (ADR 007, 1.10h)", () => {
  const detail: PublicServiceDetail = { ...service, eligibility: "Engaged couples.", packages: [pkg] };

  it("directory opens with the registered river photo above the h1", () => {
    const { container } = render(<ServicesDirectory categories={categories} services={[service]} />);
    const header = container.querySelector("[data-page-header='media']")!;
    const img = header.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe(MEDIA.riverDawn.alt);
    expect(
      header.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("detail opens with its season vignette (decorative); unmapped categories get no header", () => {
    const { container } = render(<ServiceDetail service={detail} />);
    const header = container.querySelector("[data-page-header='art']")!;
    expect(header.getAttribute("aria-hidden")).toBe("true");
    expect(header.querySelector("svg")).toBeTruthy();
    cleanup();
    const other = render(<ServiceDetail service={{ ...detail, category: { slug: "unmapped", name: "Other" } }} />);
    expect(other.container.querySelector("[data-page-header]")).toBeNull();
  });

  it("keeps the margin note in view on desktop and lifts package cards on hover and focus, not under reduced motion", () => {
    const { container } = render(<ServiceDetail service={detail} />);
    expect(screen.getByRole("complementary", { name: "Who this is for" }).className).toContain("lg:sticky");
    const card = container.querySelector("[data-package-card]")!;
    for (const c of [
      "hover:-translate-y-1",
      "focus-within:-translate-y-1",
      "motion-reduce:translate-none",
      "motion-reduce:transition-none",
    ]) {
      expect(card.className).toContain(c);
    }
  });

  it("directory: reduced motion renders the same content as motion", () => {
    const ui = (
      <ServicesDirectory
        categories={categories}
        services={[
          service,
          { ...service, id: "s2", slug: "x", name: "X", category: { slug: "pastoral-care", name: "Pastoral Care" } },
        ]}
      />
    );
    const { reduced, animated, container } = renderBothWays(ui);
    expect(animated).toEqual(reduced);
    // Motion only adds from-states: season sections reveal, the header photo drifts.
    expect(container.querySelector("#season-family [style*='opacity']")).toBeTruthy();
    expect(container.querySelector("[data-page-header] [style*='transform']")).toBeTruthy();
  });

  it("detail: reduced motion renders the same content as motion", () => {
    const { reduced, animated } = renderBothWays(<ServiceDetail service={detail} />);
    expect(animated).toEqual(reduced);
  });
});
