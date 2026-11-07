import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "Deine Abrechnung wartet." })).toBeVisible();
  }

  emailInput() {
    return this.page.getByLabel(/E-Mail-Adresse/i);
  }

  loginButton() {
    return this.page.getByRole("button", { name: /Login-Link senden/i });
  }

  async requestMagicLink(email: string): Promise<void> {
    await this.emailInput().fill(email);
    await expect(this.emailInput()).toHaveValue(email);
    await this.loginButton().click();
  }

  async expectScreenshot(snapshotName: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(snapshotName, { fullPage: true });
  }
}
