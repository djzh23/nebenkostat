import { test, expect } from "./fixtures";

test.describe("Session-Schutz", () => {
  test("leitet nach verlorenem Session-Cookie aus dem geschützten Bereich um", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Deine Abrechnung wartet.", { exact: false })).toBeVisible();
  });
});
