import { test } from "./fixtures";

import { CalculationPage } from "./pages/CalculationPage";

test.describe("Formularvalidierung", () => {
  test("weist einen leeren Objektnamen zurück", async ({ page }) => {
    const calculationPage = new CalculationPage(page);

    await calculationPage.openQuickstart();
    await calculationPage.expectEmptyPropertyNameValidation();
  });

  test("weist einen leeren Betrag zurück", async ({ page }) => {
    const calculationPage = new CalculationPage(page);

    await calculationPage.openQuickstart();
    await calculationPage.expectEmptyAmountValidation();
  });
});
