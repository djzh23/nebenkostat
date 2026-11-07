import { expect, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow } from "../helpers";

type QuickstartData = {
  name: string;
  street: string;
  zip: string;
  city: string;
  firstUnitArea: string;
  secondUnitArea: string;
  costCategory: string;
  costAmount: string;
};

type LandlordData = {
  name: string;
  street: string;
  zip: string;
  city: string;
  email: string;
};

type TenancyData = {
  unit: string;
  name: string;
  from: string;
  to: string;
  persons: string;
  prepayment: string;
  street: string;
  zip: string;
  city: string;
};

export class CalculationPage {
  constructor(private readonly page: Page) {}

  async openQuickstart(): Promise<void> {
    await this.page.goto("/app/schnellstart");
    await expect(this.page.getByText("Deine erste Formel-Karte", { exact: false })).toBeVisible();
  }

  async expectQuickstartBlankForm(year: number): Promise<void> {
    await expect(this.page.getByText("Deine erste Formel-Karte", { exact: false })).toBeVisible();
    await expect(this.page.getByLabel("Name des Objekts")).toHaveValue("");
    await expect(this.page.getByLabel("Bezeichnung 1")).toHaveValue("");
    await expect(this.page.getByLabel("Wohnfläche in m²").nth(0)).toHaveValue("");
    await expect(this.page.getByLabel("Bezeichnung 2")).toHaveValue("");
    await expect(this.page.getByLabel("Wohnfläche in m²").nth(1)).toHaveValue("");
    await expect(this.page.getByLabel("Kostenart")).toHaveValue("");
    await expect(this.page.getByText(String(year), { exact: true })).toBeVisible();
  }

  async fillQuickstart(data: QuickstartData): Promise<void> {
    await this.page.getByLabel("Name des Objekts").fill(data.name);
    await this.page.getByLabel(/Straße und Hausnummer/i).fill(data.street);
    await this.page.getByLabel("PLZ").fill(data.zip);
    await this.page.getByLabel("Ort").fill(data.city);
    await this.page.getByLabel("Bezeichnung 1").fill("EG links");
    await this.page.getByLabel("Wohnfläche in m²").nth(0).fill(data.firstUnitArea);
    await this.page.getByLabel("Bezeichnung 2").fill("OG rechts");
    await this.page.getByLabel("Wohnfläche in m²").nth(1).fill(data.secondUnitArea);
    await this.page.getByLabel("Kostenart").selectOption({ label: data.costCategory });
    await this.page.getByLabel(/Gesamtbetrag in €/i).fill(data.costAmount);
  }

  async submitQuickstart(): Promise<void> {
    await this.page.getByText("Erste Formel-Karte anzeigen", { exact: false }).click();
    await expect(this.page).toHaveURL(/\/app\/objekte\/[^/]+\/\d+\/abrechnung/);
  }

  async expectSettlementUrl(year: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/app/objekte/[^/]+/${year}/abrechnung`));
  }

  async expectEmptyPropertyNameValidation(): Promise<void> {
    await this.page.getByText("Erste Formel-Karte anzeigen", { exact: false }).click();
    await expect(this.page.getByLabel("Name des Objekts")).toHaveJSProperty("validity.valid", false);
  }

  async expectEmptyAmountValidation(): Promise<void> {
    await this.page.getByLabel("Name des Objekts").fill("Validierungsobjekt");
    await this.page.getByLabel("Bezeichnung 1").fill("EG links");
    await this.page.getByLabel("Wohnfläche in m²").nth(0).fill("60");
    await this.page.getByLabel("Bezeichnung 2").fill("OG rechts");
    await this.page.getByLabel("Wohnfläche in m²").nth(1).fill("40");
    await this.page.getByLabel("Kostenart").selectOption({ label: "Wasser" });

    const amount = this.page.getByLabel(/Gesamtbetrag in €/i);
    await expect(amount).toHaveAttribute("type", "number");
    await amount.fill("");
    await this.page.getByText("Erste Formel-Karte anzeigen", { exact: false }).click();
    await expect(amount).toHaveJSProperty("validity.valid", false);
  }

  async returnToProperty(): Promise<void> {
    await this.page.getByText("Zum Objekt zurück", { exact: false }).click();
    await expect(this.page.getByRole("heading", { name: "Einheiten", exact: true })).toBeVisible();
  }

  async saveLandlord(data: LandlordData): Promise<void> {
    await this.page.getByLabel("Name / Firma").fill(data.name);
    await this.page.getByLabel(/Straße und Hausnummer/i).last().fill(data.street);
    await this.page.getByLabel("PLZ").last().fill(data.zip);
    await this.page.getByLabel("Ort").last().fill(data.city);
    await this.page.getByLabel(/E-Mail für Rückfragen/i).fill(data.email);
    await this.page.getByRole("button", { name: /Vermieterangaben speichern/i }).click();
    await expect(this.page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  }

  async isPropertyLocked(): Promise<boolean> {
    return this.page.getByText(/Kosten sind gesperrt, weil die Abrechnung/i).isVisible().catch(() => false);
  }

  async expectExistingFinalizedSettlement(tenantNames: string[]): Promise<void> {
    // The property page loads units, tenancies and costs independently. Wait for
    // the known tenant rows before navigating to the calculation view so a direct
    // cost cannot be evaluated against an incomplete client-side snapshot.
    const tenanciesSection = this.page.getByRole("heading", { name: "Mietverhältnisse", exact: true }).locator("../..");
    for (const tenantName of tenantNames) {
      await expect(tenanciesSection.getByRole("listitem").filter({ hasText: tenantName }).first()).toBeVisible();
    }
    await this.openSettlement();
    await expect(this.page.getByText("Abgeschlossen", { exact: true })).toBeVisible();
    await expect(this.page.getByText("PDF-Archiv", { exact: true })).toBeVisible();
  }

  async waitForTenancyRows(tenantNames: string[]): Promise<void> {
    const tenanciesSection = this.page.getByRole("heading", { name: "Mietverhältnisse", exact: true }).locator("../..");
    for (const tenantName of tenantNames) {
      await expect(tenanciesSection.getByRole("listitem").filter({ hasText: tenantName }).first()).toBeVisible();
    }
  }

  async expectFormulaCardDisclosure(): Promise<void> {
    const firstCard = this.page.locator("details").first();
    const disclosureControl = firstCard.locator("[data-disclosure-control]");
    await expect(firstCard).toBeVisible();
    await expect(disclosureControl).toBeVisible();
    await expect(firstCard).not.toHaveAttribute("open", "");
    await disclosureControl.click();
    await expect(firstCard).toHaveAttribute("open", "");
  }

  async addTenancy(data: TenancyData): Promise<void> {
    const tenanciesSection = this.page.getByRole("heading", { name: "Mietverhältnisse", exact: true }).locator("../..");
    const existingTenancy = tenanciesSection.getByRole("listitem").filter({ hasText: data.name }).first();
    if (await this.isVisibleSoon(existingTenancy)) return;

    await this.page.getByLabel("Einheit").selectOption({ label: data.unit });
    await this.page.getByLabel("Mietpartei").fill(data.name);
    await this.page.getByLabel("Einzug").fill(data.from);
    await this.page.getByLabel(/Auszug/).fill(data.to);
    await this.page.getByLabel("Personen").fill(data.persons);
    await this.page.getByLabel(/Vorauszahlung pro Monat/).fill(data.prepayment);
    await this.page.getByLabel(/Straße und Hausnummer \(optional\)/i).fill(data.street);
    await this.page.getByLabel(/PLZ \(optional\)/i).fill(data.zip);
    await this.page.getByLabel(/Ort \(optional\)/i).fill(data.city);
    await this.page.getByRole("button", { name: /Mietverhältnis speichern/i }).click();
    await expect(this.page.getByRole("status").filter({ hasText: "Mietverhältnis gespeichert" }).last()).toBeVisible();
  }

  async addCost(category: string, amount: string, distributionKey: string, directTenant?: string): Promise<void> {
    const costsSection = this.page.getByRole("heading", { name: "Kosten und Belege", exact: true }).locator("../..");
    const existingCost = costsSection.getByRole("listitem").filter({ hasText: category }).first();
    if (await this.isVisibleSoon(existingCost)) return;

    await this.page.getByLabel("Kostenart").last().selectOption({ label: category });
    await this.page.getByLabel(/Betrag in €/i).fill(amount);
    await this.page.getByLabel("Verteilungsschlüssel").selectOption(distributionKey);

    if (directTenant) {
      const directTenancy = this.page.getByLabel(/Mietverhältnis aus externer Abrechnung/i);
      const tenantOption = directTenancy.getByRole("option", { name: new RegExp(directTenant, "i") }).first();
      const optionValue = await tenantOption.getAttribute("value");
      expect(optionValue).toBeTruthy();
      await directTenancy.selectOption(optionValue!);
    }

    await this.page.getByRole("button", { name: /Kosten speichern/i }).click();
    await expect(this.page.getByRole("status").filter({ hasText: "Kostenposition gespeichert" }).last()).toBeVisible();
  }

  async openSettlement(): Promise<void> {
    await this.page.getByText(/Abrechnung \d{4}/i).first().click();
    await expect(this.page.getByText(/Formel-Karten je Kostenposition/i)).toBeVisible();
  }

  async expectFormulaCards(categories: string[]): Promise<void> {
    await expect(this.page.getByText("Formel-Karten je Kostenposition", { exact: false })).toBeVisible();
    for (const category of categories) {
      await expect(this.page.getByText(category, { exact: true }).first()).toBeVisible();
    }
  }

  async expectResultAndChecklist(): Promise<void> {
    await expect(this.page.getByText("Ergebnis", { exact: true })).toBeVisible();
    await expect(this.page.getByText("Saldo je Mietpartei", { exact: true })).toBeVisible();
    await expect(this.page.getByText("Prüfliste vor dem Versand", { exact: false })).toBeVisible();
  }

  async finalizeAndExportTenantPdf(): Promise<void> {
    await this.page.getByRole("button", { name: /Abrechnung abschließen/i }).click();

    const acknowledgement = this.page.getByRole("checkbox");
    if (await acknowledgement.isVisible()) {
      await acknowledgement.check();
    }

    await this.page.getByRole("button", { name: /Jetzt abschließen/i }).click();
    await expect(this.page.getByText("Abgeschlossen", { exact: true })).toBeVisible();
    await expect(this.page.getByText("PDF-Archiv", { exact: true })).toBeVisible();

    const downloadPromise = this.page.waitForEvent("download");
    await this.page.getByRole("button", { name: "PDF laden" }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^Nebenkostenabrechnung-\d{4}-.+\.pdf$/);
    expect(await download.failure()).toBeNull();
  }

  async expectResponsiveLayout(): Promise<void> {
    await expectNoHorizontalOverflow(this.page);
  }

  async expectCalculationKey(keyLabel: string): Promise<void> {
    const formulaCard = this.page.locator("details").filter({ hasText: keyLabel }).first();
    await expect(formulaCard).toBeVisible();
  }

  private async isVisibleSoon(locator: ReturnType<Page["locator"]>): Promise<boolean> {
    try {
      await expect(locator).toBeVisible({ timeout: 2_000 });
      return true;
    } catch {
      return false;
    }
  }
}
