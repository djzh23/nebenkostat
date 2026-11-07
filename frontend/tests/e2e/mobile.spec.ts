import { type Page } from "@playwright/test";
import { test } from "./fixtures";

import { AppDashboardPage } from "./pages/AppDashboardPage";
import { CalculationPage } from "./pages/CalculationPage";
import { landlordData, propertyData, tenantData } from "./test-data";

async function ensureMobileFixture(page: Page): Promise<void> {
  const dashboardPage = new AppDashboardPage(page);
  const calculationPage = new CalculationPage(page);

  await dashboardPage.createOrOpenObject(propertyData);
  if (await calculationPage.isPropertyLocked()) return;

  await calculationPage.saveLandlord(landlordData);
  await dashboardPage.addUnit("EG links", "60");
  await dashboardPage.addUnit("OG rechts", "40");
  await calculationPage.addTenancy(tenantData.anna);
  await calculationPage.addTenancy(tenantData.bernd);
  await calculationPage.addCost("Wasser", "1.200,00", "flaeche");
  await calculationPage.addCost("Müll", "365,00", "personen");
  await calculationPage.addCost("Grundsteuer", "180,00", "einheiten");
  await calculationPage.addCost("Heizung", "250,00", "direkt", "Bernd Muster");
}

test.describe("mobile responsive Bedienung", () => {
  test("öffnet die mobile Navigation als Hamburger und X", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.openMobileNavigation();
    await dashboardPage.expectResponsiveLayout();
  });

  test("behält mobile Inhalte ohne horizontales Seiten-Überlaufen", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectResponsiveLayout();
  });

  test("zeigt Objekt, Mietverhältnisse und Abrechnung mobil lesbar", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);
    const calculationPage = new CalculationPage(page);

    await ensureMobileFixture(page);
    await calculationPage.waitForTenancyRows([tenantData.anna.name, tenantData.bernd.name]);
    await dashboardPage.expectResponsiveLayout();
    await dashboardPage.openCurrentSettlement();
    await calculationPage.expectResponsiveLayout();
    await calculationPage.expectResultAndChecklist();
  });

  test("öffnet die Formel-Karte über das kleine Disclosure-Symbol", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);
    const calculationPage = new CalculationPage(page);

    await ensureMobileFixture(page);
    await calculationPage.waitForTenancyRows([tenantData.anna.name, tenantData.bernd.name]);
    await dashboardPage.openCurrentSettlement();
    await calculationPage.expectFormulaCardDisclosure();
  });
});
