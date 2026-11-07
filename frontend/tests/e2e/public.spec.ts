import { test } from "@playwright/test";

import { AppDashboardPage } from "./pages/AppDashboardPage";
import { LandingPage } from "./pages/LandingPage";

test.describe("öffentliche Landingpage", () => {
  test("zeigt Navigation, Beispiel-PDF, Marketingtexte und Footer", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto();
    await landingPage.expectCoreElements();
    await landingPage.expectMarketingContent();
  });

  test("öffnet die Anmeldung über den textbasierten Anmelden-Link", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto();
    await landingPage.clickAnmelden();
  });

  test("öffnet und schließt die Verteilungsschlüssel-Erklärung", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto();
    await landingPage.toggleDistributionDetails();
  });

  test("schützt den App-Bereich ohne Anmeldung", async ({ page }) => {
    const dashboardPage = new AppDashboardPage(page);

    await dashboardPage.expectLoggedOutRedirect();
  });

  test("bleibt auf kleinen Viewports ohne horizontalen Overflow", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto();
    await landingPage.expectResponsiveLayout();
  });
});
