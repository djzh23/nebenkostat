import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("API-Schutz ohne Anmeldung", () => {
  test("liefert keine Objekte ohne Session", async ({ request }) => {
    const response = await request.get("/api/properties");

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ detail: "Nicht angemeldet." });
  });

  test("legt kein Objekt ohne Session an", async ({ request }) => {
    const response = await request.post("/api/properties", {
      data: {
        name: "Unberechtigter Test",
        street: "Teststraße 1",
        zip: "12345",
        city: "Teststadt",
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ detail: "Nicht angemeldet." });
  });

  test("liefert keine Einheiten eines fremden oder unbekannten Objekts ohne Session", async ({ request }) => {
    const response = await request.get("/api/properties/00000000-0000-0000-0000-000000000000/units");

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ detail: "Nicht angemeldet." });
  });
});
