import { expect, type Page } from "@playwright/test";

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth, `Page overflows horizontally: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

export async function expectMinimumTouchTarget(page: Page, locatorText: string | RegExp): Promise<void> {
  const locator = page.getByRole("button", { name: locatorText }).first();
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height, `Button ${String(locatorText)} is too small`).toBeGreaterThanOrEqual(40);
}

