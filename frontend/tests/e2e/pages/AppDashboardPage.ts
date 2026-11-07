import { expect, type Page } from "@playwright/test";

import { expectMinimumTouchTarget, expectNoHorizontalOverflow } from "../helpers";

type PropertyData = {
  name: string;
  street: string;
  zip: string;
  city: string;
};

export class AppDashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app");
    await expect(this.page.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();
  }

  async expectCoreNavigation(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();
    await expect(this.page.getByText("Objekt anlegen", { exact: true }).first()).toBeVisible();
    await expect(this.page.getByText("So funktioniert", { exact: false }).first()).toBeVisible();
    await expect(this.page.getByRole("contentinfo")).toBeVisible();
  }

  async expectDashboardMainContent(): Promise<void> {
    await expect(this.page.getByText("Objekte", { exact: true })).toBeVisible();
  }

  async openObjectByName(name: string): Promise<void> {
    await this.goto();
    const objectLink = this.page.getByRole("link", { name, exact: true }).first();
    await expect(objectLink).toBeVisible();
    await this.openExistingObject(objectLink);
  }

  async openFirstExistingObject(): Promise<boolean> {
    await this.goto();
    const objectLink = this.page.locator('a[href^="/app/objekte/"]:not([href*="/abrechnung"]):not([href$="/neu"])').first();
    const emptyState = this.page.getByText("Noch kein Objekt angelegt", { exact: true });
    try {
      await expect(objectLink).toBeVisible({ timeout: 10_000 });
    } catch {
      await expect(emptyState).toBeVisible();
      return false;
    }
    await this.openExistingObject(objectLink);
    return true;
  }

  async openCurrentSettlement(): Promise<void> {
    await this.page.getByRole("link", { name: /Abrechnung \d{4}/i }).click();
    await expect(this.page.getByText("Formel-Karten je Kostenposition", { exact: true })).toBeVisible();
  }

  async openObjectCreation(): Promise<void> {
    const visibleCreateLink = this.page.locator('a[href="/app/objekte/neu"]:visible').first();
    if (await visibleCreateLink.isVisible().catch(() => false)) {
      await visibleCreateLink.click();
    } else {
      const openMenu = this.page.getByRole("button", { name: /Menü öffnen/i });
      if (await openMenu.isVisible().catch(() => false)) {
        await openMenu.click();
      }
      await this.page.getByRole("navigation", { name: /Mobile Hauptnavigation/i })
        .getByRole("link", { name: "Objekt anlegen", exact: true })
        .click();
    }
    await expect(this.page.getByText("Stammdaten", { exact: true })).toBeVisible();
  }

  async createObject(data: PropertyData): Promise<void> {
    await this.openObjectCreation();
    await this.fillObjectForm(data);
    await this.page.getByRole("button", { name: "Objekt anlegen" }).click();
    await expect(this.page.getByRole("heading", { name: "Einheiten", exact: true })).toBeVisible();
  }

  async createOrOpenObject(data: PropertyData): Promise<void> {
    await this.goto();
    const existing = this.page.getByRole("link", { name: data.name, exact: true }).first();
    const firstExistingObject = this.page.locator('a[href^="/app/objekte/"]:not([href*="/abrechnung"]):not([href$="/neu"])').first();
    const emptyState = this.page.getByText("Noch kein Objekt angelegt", { exact: true });

    // The dashboard initially renders its empty state while properties are fetched.
    // Prefer the known object and only create one after that lookup really timed out.
    let existingObjectFound = false;
    try {
      await expect(existing).toBeVisible();
      existingObjectFound = true;
    } catch {
      await expect(emptyState).toBeVisible();
    }

    if (existingObjectFound) {
      await this.openExistingObject(existing);
      return;
    }

    try {
      await expect(firstExistingObject).toBeVisible({ timeout: 10_000 });
      await this.openExistingObject(firstExistingObject);
      return;
    } catch {
      await expect(emptyState).toBeVisible();
    }

    await this.openObjectCreation();
    await this.fillObjectForm(data);
    await this.page.getByRole("button", { name: "Objekt anlegen" }).click();

    const limitMessage = this.page.getByText(/Beta-Start erlaubt nur 1 Objekt/i);
    if (await limitMessage.isVisible().catch(() => false)) {
      await this.goto();
      const existingAfterLimit = this.page.getByRole("link", { name: data.name, exact: true }).first();
      await expect(existingAfterLimit).toBeVisible();
      await this.openExistingObject(existingAfterLimit);
    }

    await expect(this.page.getByRole("heading", { name: "Einheiten", exact: true })).toBeVisible();
  }

  private async fillObjectForm(data: PropertyData): Promise<void> {
    await this.page.getByLabel("Name des Objekts").fill(data.name);
    await this.page.getByLabel(/Straße und Hausnummer/i).fill(data.street);
    await this.page.getByLabel("PLZ").fill(data.zip);
    await this.page.getByLabel("Ort").fill(data.city);
  }

  async addUnit(label: string, area: string): Promise<void> {
    const unitsSection = this.page.getByRole("heading", { name: "Einheiten", exact: true }).locator("../..");
    const existingUnit = unitsSection.getByRole("listitem").filter({ hasText: label }).first();
    if (await this.isVisibleSoon(existingUnit)) return;

    await this.page.getByLabel("Bezeichnung").fill(label);
    await this.page.getByLabel("Wohnfläche in m²").last().fill(area);
    await this.page.getByRole("button", { name: /Einheit hinzufügen/i }).click();
    await expect(this.page.getByRole("status").filter({ hasText: "Einheit gespeichert" }).last()).toBeVisible();
  }

  async openQuickstart(): Promise<void> {
    const firstFormulaCardLink = this.page.getByText("Zur ersten Formel-Karte", { exact: false }).first();
    if (await firstFormulaCardLink.isVisible().catch(() => false)) {
      await firstFormulaCardLink.click();
    } else {
      await this.page.getByText("Schnellstart beginnen", { exact: false }).first().click();
    }
    await expect(this.page.getByText("Deine erste Formel-Karte", { exact: false })).toBeVisible();
  }

  async openFirstSettlement(): Promise<void> {
    await this.page.getByText(/Abrechnung \d{4}/i).first().click();
    await expect(this.page.getByText(/Formel-Karten je Kostenposition/i)).toBeVisible();
  }

  async expectSettlementOrEmptyState(): Promise<boolean> {
    const settlement = this.page.getByText(/Abrechnung \d{4}/i).first();
    if (await settlement.isVisible().catch(() => false)) {
      await settlement.click();
      await expect(this.page.getByText(/Formel-Karten je Kostenposition/i)).toBeVisible();
      return true;
    }

    await expect(this.page.getByText(/Noch kein Objekt angelegt|Noch keine Abrechnung/i).first()).toBeVisible();
    return false;
  }

  async expectLoggedOutRedirect(): Promise<void> {
    await this.page.goto("/app");
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.page.getByText("Deine Abrechnung wartet.", { exact: false })).toBeVisible();
  }

  async openMobileNavigation(): Promise<void> {
    const openButton = this.page.getByRole("button", { name: /Menü öffnen/i });
    await expect(openButton).toBeVisible();
    await expectMinimumTouchTarget(this.page, /Menü öffnen/i);
    await openButton.click();
    await expect(this.page.getByRole("button", { name: /Menü schließen/i })).toBeVisible();
    await expect(this.page.getByRole("navigation", { name: /Mobile Hauptnavigation/i })).toBeVisible();
  }

  async expectResponsiveLayout(): Promise<void> {
    await expect(this.page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(this.page);
  }

  private async isVisibleSoon(locator: ReturnType<Page["locator"]>): Promise<boolean> {
    try {
      await expect(locator).toBeVisible({ timeout: 2_000 });
      return true;
    } catch {
      return false;
    }
  }

  private async openExistingObject(link: ReturnType<Page["getByRole"]>): Promise<void> {
    // The dashboard fetches the statement status separately. Waiting for a
    // status pill prevents opening a finalized object before its lock is known.
    await expect(this.page.getByText(/Abgerechnet|Kosten fehlen|Belege fehlen|Prüfbereit/i).first()).toBeVisible();
    await link.click();
    await expect(this.page).toHaveURL(/\/app\/objekte\/[^/]+\/\d+$/);
    await expect(this.page.getByRole("heading", { name: "Einheiten", exact: true })).toBeVisible();
  }
}
