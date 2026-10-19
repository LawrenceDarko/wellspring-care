// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader, SkipLink } from "@/components/site/site-header";
import { MAIN_NAV } from "@/components/site/nav";
import { SETTINGS_DEFAULTS } from "@/server/data/settings";

afterEach(cleanup);

function Shell({ settings = SETTINGS_DEFAULTS }: { settings?: typeof SETTINGS_DEFAULTS }) {
  return (
    <>
      <SkipLink />
      <SiteHeader siteName={settings.name} />
      <main id="main" tabIndex={-1}>
        <a href="/x">Page link</a>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}

describe("site shell", () => {
  it("skip link is the first focusable element and targets main", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    await user.tab();
    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(document.activeElement).toBe(skip);
    expect(skip.getAttribute("href")).toBe("#main");
    expect(document.getElementById("main")?.tagName).toBe("MAIN");
  });

  it("header shows the configured name, main nav and a menu button", () => {
    render(<Shell settings={{ ...SETTINGS_DEFAULTS, name: "Test Chaplaincy" }} />);
    expect(screen.getByRole("link", { name: "Test Chaplaincy" }).getAttribute("href")).toBe("/");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link")).toHaveLength(MAIN_NAV.length);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("mobile sheet opens with the nav links", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const nav = await screen.findByRole("navigation", { name: "Mobile" });
    expect(within(nav).getAllByRole("link")).toHaveLength(MAIN_NAV.length);
  });

  it("footer shows emergency notice with 911 and 988, legal links, not-configured contact", () => {
    render(<Shell />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "911" }).getAttribute("href")).toBe("tel:911");
    expect(within(footer).getByRole("link", { name: "988" }).getAttribute("href")).toBe("tel:988");
    expect(within(footer).getByRole("navigation", { name: "Legal" })).toBeTruthy();
    expect(within(footer).getByText("Contact details are not configured yet.")).toBeTruthy();
  });

  it("footer renders contact from settings", () => {
    render(
      <Shell
        settings={{ ...SETTINGS_DEFAULTS, contactEmail: "hello@example.org", contactPhone: "(555) 010-0100" }}
      />,
    );
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "hello@example.org" }).getAttribute("href")).toBe(
      "mailto:hello@example.org",
    );
    expect(within(footer).getByRole("link", { name: "(555) 010-0100" }).getAttribute("href")).toBe(
      "tel:5550100100",
    );
    expect(within(footer).queryByText("Contact details are not configured yet.")).toBeNull();
  });
});
