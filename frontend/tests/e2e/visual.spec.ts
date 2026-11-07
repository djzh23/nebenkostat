import { test } from "@playwright/test";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/login.page";

test.describe("optionale Screenshot-Regression", () => {
  test.skip(!process.env.VISUAL_REGRESSION, "Mit VISUAL_REGRESSION=1 aktivieren; Baselines mit npm run test:e2e:update erzeugen.");

  test("hält die Landingpage visuell stabil", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto();
    await landingPage.expectLandingScreenshot("landing-page.png");
  });

  test("hält die Loginseite visuell stabil", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.expectScreenshot("login-mobile.png");
  });
});
