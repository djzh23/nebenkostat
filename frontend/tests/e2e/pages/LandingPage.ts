import { expect, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow } from "../helpers";

export class LandingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await expect(this.page.getByText("Nebenkosten, die du selbst nachrechnen kannst.", { exact: false })).toBeVisible();
  }

  async expectCoreElements(): Promise<void> {
    await expect(this.page.locator("a").filter({ hasText: "Anmelden" }).first()).toBeVisible();
    const examplePdfLink = this.page.getByText("Beispiel-PDF ansehen", { exact: true });
    await expect(examplePdfLink).toBeVisible();
    await expect(examplePdfLink).toHaveAttribute("href", "/beispiel-pdf");
    await expect(this.page.getByRole("contentinfo")).toBeVisible();
  }

  async expectMarketingContent(): Promise<void> {
    await expect(this.page.getByText("Vom Beleg bis zur fertigen Abrechnung.", { exact: false })).toBeVisible();
    await expect(this.page.getByText("Drei Verteilungen, jede mit Rechenweg.", { exact: false })).toBeVisible();
    await expect(this.page.getByText("Nebenkostat rechnet und archiviert.", { exact: false })).toBeVisible();
  }

  async clickAnmelden(): Promise<void> {
    await this.page.locator("a").filter({ hasText: "Anmelden" }).first().click();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectResponsiveLayout(): Promise<void> {
    await expectNoHorizontalOverflow(this.page);
  }

  async expectLoadBudget(budgetMilliseconds: number): Promise<void> {
    const navigation = await this.page.goto("/");
    await this.page.waitForLoadState("domcontentloaded");

    const metrics = await this.page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return {
        domContentLoaded: entry?.domContentLoadedEventEnd ?? 0,
      };
    });

    expect(navigation?.ok()).toBeTruthy();
    expect(metrics.domContentLoaded, "DOMContentLoaded überschreitet das Ladezeitbudget.").toBeLessThanOrEqual(budgetMilliseconds);
  }

  async expectLandingScreenshot(snapshotName: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(snapshotName, { fullPage: true });
  }
}
