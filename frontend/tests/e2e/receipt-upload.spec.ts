import { test } from "./fixtures";

import { AppDashboardPage } from "./pages/AppDashboardPage";
import { CalculationPage } from "./pages/CalculationPage";
import { ReceiptPage, receiptFile } from "./pages/ReceiptPage";

test.describe("Belegarchiv im isolierten Testkonto", () => {
  test.skip(process.env.E2E_ISOLATED_MUTATIONS !== "1", "Nur mit einem temporären, isolierten E2E-Testkonto ausführen.");

  test("weist falsche Inhalte zurück und unterstützt PDF, PNG, JPG, Löschen und ZIP", async ({ page }) => {
    test.setTimeout(180_000);

    const calculationPage = new CalculationPage(page);
    const receiptPage = new ReceiptPage(page);
    const dashboardPage = new AppDashboardPage(page);
    const suffix = Date.now().toString();

    const existingObject = await dashboardPage.openFirstExistingObject();
    if (!existingObject) {
      await calculationPage.openQuickstart();
    await calculationPage.fillQuickstart({
      name: `Upload-Testobjekt-${suffix}`,
      street: "Teststraße 7",
      zip: "12345",
      city: "Teststadt",
      firstUnitArea: "60",
      secondUnitArea: "40",
      costCategory: "Wasser",
      costAmount: "1200",
    });
    await calculationPage.submitQuickstart();
      await calculationPage.returnToProperty();
    } else {
      await calculationPage.addCost("Wasser", "1.200,00", "flaeche");
    }
    await receiptPage.expectCostSection();

    await receiptPage.upload(receiptFile("falsche-datei.pdf", "application/pdf", Buffer.from("kein PDF")));
    await receiptPage.expectUploadError(/Dateiinhalt passt nicht/i);

    await receiptPage.upload(receiptFile("Wasser-Rechnung.pdf", "application/pdf", Buffer.from("%PDF-1.7\n% E2E")));
    await receiptPage.expectSaved("Wasser-Rechnung.pdf");
    await receiptPage.deleteReceipt();

    await receiptPage.upload(receiptFile("Wasser-Rechnung.png", "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
    await receiptPage.expectSaved("Wasser-Rechnung.png");
    await receiptPage.deleteReceipt();

    await receiptPage.upload(receiptFile("Wasser-Rechnung.jpg", "image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00])));
    await receiptPage.expectSaved("Wasser-Rechnung.jpg");
    await receiptPage.downloadArchive();
  });
});
