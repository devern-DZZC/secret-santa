import { expect, test, type Page } from "@playwright/test";

// Public fixture draw only (see playwright.config.ts): feisha → nathan, dana → chris-alexander.
const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
});

test.afterEach(() => {
  expect(errors, "no console errors").toEqual([]);
});

async function enterPin(page: Page, pin: string) {
  for (const d of pin) await page.getByRole("button", { name: d, exact: true }).click();
}

test("landing shows the title, countdown and event details", async ({ page }) => {
  // pin the clock before the event so this keeps passing after 27 December
  await page.clock.setFixedTime(new Date("2026-11-01T12:00:00-04:00"));
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Secret Santa");
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText("The Alley", { exact: true })).toBeVisible();
  await expect(page.getByText("East Gates Mall, Trincity, Trinidad")).toBeVisible();
  await expect(page.getByText(/27 December 2026/)).toBeVisible();
  await expect(page.getByText("7:00 pm")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Maps" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search\/\?api=1&query=The\+Alley\+East\+Gates\+Mall/,
  );
  // budget isn't set yet, so its row stays hidden
  await expect(page.getByText("Spending limit")).toHaveCount(0);
});

test("a wrong PIN shows an error and reveals nothing", async ({ page }) => {
  await page.goto("./#/pin/feisha");
  await enterPin(page, "2004"); // Devern's PIN
  await expect(page.getByRole("alert")).toContainText("That's not your PIN");
  await expect(page.getByText("Nathan")).toHaveCount(0);
  await expect(page.getByText("You're Secret Santa for")).toHaveCount(0);
});

test("the right PIN and 3 taps reveal the giftee and 3 gift ideas", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Find my giftee" }).click();
  await page.getByRole("button", { name: "I'm Feisha" }).click();
  await enterPin(page, "2356");
  const gift = page.getByRole("button", { name: /open your gift/i });
  for (let i = 0; i < 3; i++) {
    await expect(gift).toBeEnabled();
    await gift.click();
  }
  await expect(page.getByText("You're Secret Santa for")).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole("heading", { level: 2, name: "Nathan" })).toBeVisible();
  await expect(page.locator(".idea")).toHaveCount(3);
});

test.describe("reduced motion", () => {
  test("shows the giftee straight away, no tapping needed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./#/pin/dana");
    await enterPin(page, "0946");
    await expect(page.getByRole("heading", { level: 2, name: "Christopher Alexander" })).toBeVisible();
    await expect(page.locator(".snow")).toHaveCount(0);
  });
});

test("after reloading, only the unlocked cousin skips the PIN", async ({ page }) => {
  await page.goto("./#/pin/feisha");
  await enterPin(page, "2356");
  await page.getByRole("button", { name: /skip the animation/i }).click();
  await expect(page.getByText("You're Secret Santa for")).toBeVisible();

  await page.goto("./#/who");
  await page.reload();
  await page.getByRole("button", { name: "I'm Feisha" }).click();
  await expect(page.getByText("You're Secret Santa for")).toBeVisible();

  await page.goto("./#/who");
  await page.getByRole("button", { name: "I'm Brandon" }).click();
  await expect(page.getByRole("heading", { name: "Hi Brandon!" })).toBeVisible();
});

test("a pasted giftee link without the PIN goes to the PIN screen", async ({ page }) => {
  await page.goto("./#/giftee/dana");
  await expect(page.getByRole("heading", { name: "Hi Dana!" })).toBeVisible();
  await expect(page).toHaveURL(/#\/pin\/dana$/);
});

test.describe("at 375px wide", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const hash of ["", "#/who", "#/pin/chris-alexander"]) {
    test(`no sideways scrolling and 44px+ tap targets on "${hash || "#/"}"`, async ({ page }) => {
      await page.goto(`./${hash}`);
      await page.waitForTimeout(700);
      // compare with the real 375px (mobile emulation widens innerWidth to fit overflow)
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth, "page width").toBeLessThanOrEqual(375);
      for (const button of await page.getByRole("button").all()) {
        const box = await button.boundingBox();
        if (!box) continue;
        expect(box.height, "button height").toBeGreaterThanOrEqual(44);
        expect(box.width, "button width").toBeGreaterThanOrEqual(44);
      }
    });
  }
});
