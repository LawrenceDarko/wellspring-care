import { expect, test, type Page } from "@playwright/test";

// 1.9 GATE smoke on the ADR 006 UI: home -> services -> detail -> contact submit,
// at 360 and 1280 px. Data comes from the seeded in-memory DB (test/e2e/server.ts).

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

for (const width of [360, 1280]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("home -> services -> detail -> contact submit", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);

      await page.getByRole("link", { name: "Request spiritual care" }).click();
      await expect(page).toHaveURL(/\/services$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);

      const firstService = page.locator('main a[href^="/services/"]').first();
      const serviceName = (await firstService.innerText()).trim();
      await firstService.click();
      await expect(page.getByRole("heading", { level: 1, name: serviceName })).toBeVisible();
      await expect(page.getByRole("link", { name: "Request this service" })).toBeVisible();
      await expectNoHorizontalScroll(page);

      await page.goto("/contact");
      await expectNoHorizontalScroll(page);
      await page.getByLabel("Your name").fill("Test Visitor");
      await page.getByLabel("Email address").fill("visitor@example.test");
      await page.getByLabel("Message").fill("Could someone tell me more about chaplaincy visits?");
      // The public-form guard rejects submissions under 3s after render.
      await page.waitForTimeout(3_500);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByRole("status")).toContainText("Your message was received");
    });
  });
}
