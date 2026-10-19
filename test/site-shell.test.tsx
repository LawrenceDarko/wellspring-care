// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader, SkipLink } from "@/components/site/site-header";
import { isNavGroup, MAIN_NAV, NAV_GROUPS, REQUEST_CARE } from "@/components/site/nav";
import { SETTINGS_DEFAULTS } from "@/server/data/settings";

afterEach(cleanup);

/** Keyboard path into a desktop menu: one panel open at a time, so Escape closes the last one. */
async function openByKeyboard(trigger: HTMLElement) {
  const user = userEvent.setup();
  await user.keyboard("{Escape}");
  act(() => trigger.focus());
  await user.keyboard("{Enter}");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
}

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

  it("header shows the configured name, grouped main nav, Request care and a menu button", () => {
    render(<Shell settings={{ ...SETTINGS_DEFAULTS, name: "Test Chaplaincy" }} />);
    expect(screen.getByRole("link", { name: "Test Chaplaincy" }).getAttribute("href")).toBe("/");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Care", "Programs & events"]);
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["Prayer", "About", "Contact"]);
    expect(screen.getByRole("link", { name: "Request care" }).getAttribute("href")).toBe(REQUEST_CARE.href);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("every main route is reachable from the desktop menus", async () => {
    render(<Shell />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = new Set(within(nav).getAllByRole("link").map((l) => l.getAttribute("href")));
    for (const group of NAV_GROUPS.filter(isNavGroup)) {
      await openByKeyboard(within(nav).getByRole("button", { name: group.label }));
      const links = within(nav).getAllByRole("link").map((l) => l.getAttribute("href"));
      for (const link of group.links) expect(links).toContain(link.href);
      links.forEach((href) => hrefs.add(href));
    }
    expect([...hrefs].sort()).toEqual(MAIN_NAV.map((l) => l.href).sort());
  });

  it("desktop menu closes on Escape and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const trigger = within(nav).getByRole("button", { name: "Care" });
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.tab();
    expect(within(nav).getByRole("link", { name: /Services/ })).toBe(document.activeElement);
    await user.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("mobile overlay lists every main route and Request care, closes on Escape with focus back on the trigger", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    const nav = await screen.findByRole("navigation", { name: "Mobile" });
    const hrefs = within(nav).getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual([...MAIN_NAV.map((l) => l.href), REQUEST_CARE.href]);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("mobile overlay closes when a link is chosen", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const nav = await screen.findByRole("navigation", { name: "Mobile" });
    nav.addEventListener("click", (e) => e.preventDefault()); // jsdom cannot navigate
    await user.click(within(nav).getByRole("link", { name: "Contact" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
  });

  it("footer lists every main route without JS menus", () => {
    render(<Shell />);
    const nav = within(screen.getByRole("contentinfo")).getByRole("navigation", { name: "Site" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual(MAIN_NAV.map((l) => l.href));
  });

  it("header hides on scroll down, shows on scroll up, and is see-through only over a hero", async () => {
    let heroBottom = 600;
    render(
      <>
        <SiteHeader siteName="Test" />
        <section data-hero ref={(el) => void (el && (el.getBoundingClientRect = () => ({ bottom: heroBottom }) as DOMRect))} />
      </>,
    );
    const header = screen.getByRole("banner");
    const scrollTo = async (y: number) => {
      Object.defineProperty(window, "scrollY", { value: y, configurable: true });
      heroBottom = 600 - y;
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      });
    };
    await scrollTo(0);
    expect(header.hasAttribute("data-over-hero")).toBe(true);
    expect(header.hasAttribute("data-hidden")).toBe(false);
    await scrollTo(900);
    expect(header.hasAttribute("data-over-hero")).toBe(false);
    expect(header.hasAttribute("data-hidden")).toBe(true);
    await scrollTo(700);
    expect(header.hasAttribute("data-hidden")).toBe(false);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
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

  it("footer is a forest band and every footer link gets a visible focus outline in the ring color", () => {
    render(<Shell />);
    const footer = screen.getByRole("contentinfo");
    // `band` swaps --ring to linen, so outline-ring stays visible on forest (ADR 006).
    expect(footer.classList.contains("band")).toBe(true);
    const links = within(footer).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.className).toMatch(/focus-visible:outline-2/);
      expect(link.className).toMatch(/focus-visible:outline-ring/);
    }
  });

  it("header and mobile menu targets are at least 44px", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    const header = screen.getByRole("banner");
    const nav = within(header).getByRole("navigation", { name: "Main" });
    const targets = () => [...within(header).getAllByRole("link"), ...within(header).getAllByRole("button")];
    const seen = new Set(targets());
    for (const group of NAV_GROUPS.filter(isNavGroup)) {
      await openByKeyboard(within(nav).getByRole("button", { name: group.label }));
      targets().forEach((el) => seen.add(el));
    }
    expect(seen.size).toBeGreaterThan(MAIN_NAV.length);
    for (const el of seen) expect(el.className, el.textContent ?? "").toMatch(/min-h-1[12]/);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = await screen.findByRole("dialog");
    const menu = within(dialog).getByRole("navigation", { name: "Mobile" });
    for (const el of [...within(menu).getAllByRole("link"), within(dialog).getByRole("button", { name: "Close menu" })]) {
      expect(el.className, el.textContent ?? "").toMatch(/min-h-1[12]/);
    }
  });
});
