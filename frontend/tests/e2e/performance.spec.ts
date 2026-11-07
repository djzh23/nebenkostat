import { test } from "@playwright/test";

import { LandingPage } from "./pages/LandingPage";

test("lädt die öffentliche Startseite innerhalb des Budgets", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const budgetMilliseconds = Number(process.env.E2E_LOAD_BUDGET_MS ?? 5_000);

  await landingPage.expectLoadBudget(budgetMilliseconds);
});
