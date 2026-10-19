// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  formatMoney,
  ServiceDetail,
  ServicesDirectory,
  slugParam,
} from "@/components/site/services";
import type { PublicPackage, PublicServiceDetail } from "@/server/data/catalog";

afterEach(cleanup);

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
    expect(screen.getByRole("link", { name: "Premarital preparation" }).getAttribute("href")).toBe("/services/premarital");
    expect(screen.getByText("From $320")).toBeTruthy();
    expect(screen.getByText("Pricing on request")).toBeTruthy();
    expect(screen.getByText(/not a medical, mental-health or emergency provider/)).toBeTruthy();
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
    expect(screen.getByText(detail.eligibility!)).toBeTruthy();
    const card = screen.getByRole("heading", { level: 3, name: "6 sessions over 6 weeks" }).closest("li")!;
    expect(within(card).getByText("$460")).toBeTruthy();
    expect(within(card).getByText("6 x 60 minutes")).toBeTruthy();
    expect(within(card).getByText("In person, Video")).toBeTruthy();
    expect(within(card).getByText("Workbook")).toBeTruthy();
    expect(within(card).getByText("25% deposit to reserve. Installments available")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request this service" }).getAttribute("href")).toBe("/request/premarital");
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
