import { expect, test, type Page } from "@playwright/test";

// 1.10 GATE on the ADR 007 story UI: header menus by keyboard, home text under reduced
// motion and after a full scroll with motion, no horizontal scroll on any public route.

const PUBLIC_ROUTES = [
  "/",
  "/services",
  "/about",
  "/chaplaincy",
  "/weddings",
  "/funerals",
  "/programs",
  "/prayer",
  "/contact",
  "/sign-in",
  "/legal/privacy",
  "/legal/service-scope",
];

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

/** Every element in <main> that holds its own text, with whether a viewer could see it. */
async function mainTexts(page: Page) {
  return page.evaluate(() => {
    const out: { text: string; visible: boolean; opacity: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("main *")) {
      if (el.closest('[aria-hidden="true"], .sr-only, svg, script, style')) continue;
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? "")
        .join("")
        .trim();
      if (!own) continue;
      let opacity = 1;
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      const rect = el.getBoundingClientRect();
      out.push({
        text: own.slice(0, 60),
        visible: el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && rect.width > 0,
        opacity,
      });
    }
    return out;
  });
}

function expectAllVisible(texts: Awaited<ReturnType<typeof mainTexts>>) {
  expect(texts.length).toBeGreaterThan(20);
  expect(texts.filter((t) => !t.visible || t.opacity < 0.99)).toEqual([]);
}

test.describe("header menus by keyboard at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("tab order, open a group, Escape returns focus, Enter follows a link", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const care = page.getByRole("button", { name: "Care" });
    await expect(care).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(care).toHaveAttribute("aria-expanded", "true");
    const services = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Services/ });
    await expect(services).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(care).toHaveAttribute("aria-expanded", "false");
    await expect(care).toBeFocused();

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(services).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/services$/);

    const programs = page.getByRole("button", { name: "Programs & events" });
    await programs.focus();
    await page.keyboard.press("Enter");
    await expect(programs).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Programs/ })).toBeVisible();
  });
});

test.describe("mobile menu by keyboard at 360px", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("opens, traps focus, Escape returns focus, Enter follows a link", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const open = page.getByRole("button", { name: "Open menu" });
    await expect(open).toBeFocused();

    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();

    await page.keyboard.press("Enter");
    const contact = dialog.getByRole("link", { name: "Contact" });
    await contact.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/contact$/);
    await expect(dialog).toBeHidden();
  });
});

for (const width of [360, 1280]) {
  test.describe(`home under reduced motion at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, reducedMotion: "reduce" });

    test("all home text visible without scrolling, static story", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("main ol[data-path] > li")).toHaveCount(5);
      await expect(page.locator("main canvas")).toHaveCount(0);
      await expect(page.locator("[data-story]")).toHaveCount(0);
      expectAllVisible(await mainTexts(page));
      await expectNoHorizontalScroll(page);
    });
  });

  test.describe(`public routes at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("no horizontal scroll on any public route", async ({ page }) => {
      for (const route of PUBLIC_ROUTES) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 }), route).toBeVisible();
        await expectNoHorizontalScroll(page);
      }
    });
  });
}

test.describe("home with motion at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("every text is visible once scrolled through", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await expect(page.locator("[data-story=on]")).toHaveCount(1);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1_500);
    await expectNoHorizontalScroll(page);
    expectAllVisible(await mainTexts(page));
    expect(errors).toEqual([]);
  });
});
