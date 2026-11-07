import { test } from "./fixtures";

import { AppDashboardPage } from "./pages/AppDashboardPage";
import { CalculationPage } from "./pages/CalculationPage";
import { billingYear } from "./test-data";

test.describe("authentifizierte Kernansichten", () => {
  test("zeigt Dashboard, Onboarding und Navigation", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectCoreNavigation();
    await dashboardPage.expectDashboardMainContent();
  });

  test("zeigt den Schnellstart mit leeren Eingabefeldern", async ({ page }) => {
    const calculationPage = new CalculationPage(page);

    await calculationPage.openQuickstart();
    await calculationPage.expectQuickstartBlankForm(billingYear);
  });

  test("zeigt eine vorhandene Abrechnung oder den leeren Startzustand", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectSettlementOrEmptyState();
  });
});
