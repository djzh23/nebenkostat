import { test } from "./fixtures";

import { AppDashboardPage } from "./pages/AppDashboardPage";
import { CalculationPage } from "./pages/CalculationPage";
import { billingYear, landlordData, propertyData, tenantData } from "./test-data";

test.describe.configure({ mode: "serial" });

test("durchläuft Objekt, Einheiten, Verteilungsschlüssel und PDF-Export", async ({ page }) => {
  test.setTimeout(180_000);

  const dashboardPage = new AppDashboardPage(page);
  const calculationPage = new CalculationPage(page);

  await dashboardPage.createOrOpenObject(propertyData);

  if (await calculationPage.isPropertyLocked()) {
    await calculationPage.expectExistingFinalizedSettlement([tenantData.anna.name, tenantData.bernd.name]);
    return;
  }

  await calculationPage.saveLandlord(landlordData);
  await dashboardPage.addUnit("EG links", "60");
  await dashboardPage.addUnit("OG rechts", "40");
  await calculationPage.addTenancy(tenantData.anna);
  await calculationPage.addTenancy(tenantData.bernd);

  await calculationPage.addCost("Wasser", "1.200,00", "flaeche");
  await calculationPage.addCost("Müll", "365,00", "personen");
  await calculationPage.addCost("Grundsteuer", "180,00", "einheiten");
  await calculationPage.addCost("Heizung", "250,00", "direkt", "Bernd Muster");

  await calculationPage.openSettlement();
  await calculationPage.expectFormulaCards(["Wasser", "Müll", "Grundsteuer", "Heizung"]);
  await calculationPage.expectCalculationKey("Wohnfläche");
  await calculationPage.expectCalculationKey("Personen");
  await calculationPage.expectCalculationKey("Einheiten");
  await calculationPage.expectCalculationKey("Heizkosten / externe Direktabrechnung");
  await calculationPage.expectResultAndChecklist();
  await calculationPage.finalizeAndExportTenantPdf();
  await calculationPage.expectSettlementUrl(billingYear);
});
