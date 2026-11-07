import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

import { billingYear, propertyData } from "./test-data";

type PropertyRecord = { id: string };
type CostRecord = { id: string };

async function getOrCreateProperty(page: Page): Promise<PropertyRecord> {
  const response = await page.request.get("/api/properties");
  expect(response.ok()).toBeTruthy();
  const properties = (await response.json()) as unknown;
  expect(Array.isArray(properties)).toBeTruthy();
  const first = (properties as Array<Record<string, unknown>>).find((property) => typeof property.id === "string");
  if (first) return { id: String(first.id) };

  const created = await page.request.post("/api/properties", { data: propertyData });
  expect(created.status()).toBe(201);
  const property = (await created.json()) as Record<string, unknown>;
  expect(typeof property.id).toBe("string");
  return { id: String(property.id) };
}

test.describe("authentifizierter API-Schutz", () => {
  test("liefert die eigenen Objekte mit einer gültigen Session", async ({ page }) => {
    const response = await page.request.get("/api/properties");

    expect(response.status()).toBe(200);
    const properties = (await response.json()) as unknown;
    expect(Array.isArray(properties)).toBeTruthy();
  });

  test("weist ungültige Kostenwerte vor dem Speichern zurück", async ({ page }) => {
    const property = await getOrCreateProperty(page);
    const response = await page.request.post(`/api/properties/${property.id}/costs`, {
      data: {
        billingYear,
        category: "Wasser",
        amountEur: 0,
        distributionKey: "flaeche",
        directTenancyId: "",
      },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ detail: "Der Betrag muss größer als 0 € sein." });
  });

  test("weist ungültige Verteilungsschlüssel zurück", async ({ page }) => {
    const property = await getOrCreateProperty(page);
    const response = await page.request.post(`/api/properties/${property.id}/costs`, {
      data: {
        billingYear,
        category: "Wasser",
        amountEur: 1,
        distributionKey: "unbekannt",
        directTenancyId: "",
      },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ detail: "Der Verteilungsschlüssel ist ungültig." });
  });

  test("gibt für eine unbekannte Objekt-ID keine fremden Kosten preis", async ({ page }) => {
    const response = await page.request.get("/api/properties/00000000-0000-0000-0000-000000000000/costs");

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  test("sperrt Einheitenänderungen nach einer abgeschlossenen Abrechnung", async ({ page }) => {
    const property = await getOrCreateProperty(page);
    const statementResponse = await page.request.get(`/api/properties/${property.id}/statements/${billingYear}`);
    test.skip(statementResponse.status() !== 200, "Das Testkonto hat noch keine abgeschlossene Abrechnung.");

    const response = await page.request.post(`/api/properties/${property.id}/units`, {
      data: { label: "Sicherheits-Test", areaM2: 1 },
    });

    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ detail: /gesperrt/i });
  });

  test("sperrt Belegänderungen nach einer abgeschlossenen Abrechnung", async ({ page }) => {
    const property = await getOrCreateProperty(page);
    const statementResponse = await page.request.get(`/api/properties/${property.id}/statements/${billingYear}`);
    test.skip(statementResponse.status() !== 200, "Das Testkonto hat noch keine abgeschlossene Abrechnung.");

    const costsResponse = await page.request.get(`/api/properties/${property.id}/costs`);
    expect(costsResponse.status()).toBe(200);
    const costs = (await costsResponse.json()) as unknown;
    const firstCost = Array.isArray(costs)
      ? (costs as Array<Record<string, unknown>>).find((cost) => typeof cost.id === "string")
      : undefined;
    expect(firstCost).toBeTruthy();
    const cost: CostRecord = { id: String(firstCost?.id) };

    const response = await page.request.post(`/api/properties/${property.id}/costs/${cost.id}/receipt`, {
      multipart: {
        receipt: {
          name: "sicherheits-test.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n% test"),
        },
      },
    });

    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ detail: /abgeschlossen|gesperrt/i });
  });
});
