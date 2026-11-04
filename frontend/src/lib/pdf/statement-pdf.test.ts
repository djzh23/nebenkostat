import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createStatementPdf, createTenantStatementPdf, normalizeStatementResult, type StatementPdfResult } from "./statement-pdf";

function resultWithCosts(count: number): StatementPdfResult {
  return {
    year: 2025,
    daysInYear: 365,
    totalCostCents: count * 10000,
    totalVacancyCents: 0,
    warnings: [],
    costs: Array.from({ length: count }, (_, index) => ({
      category: `Kostenart ${index + 1}`,
      amountCents: 10000,
      rule: "Wohnfläche: Kosten × Wohnfläche ÷ Gesamtfläche × Zeitanteil",
      allocatedCents: 10000,
      vacancyCents: 0,
      shares: [{ tenancyId: "t1", cents: 10000, formula: "100,00 € × 60 m² ÷ 60 m² = 100,00 €" }],
    })),
    tenancies: [{
      id: "t1",
      unitLabel: "EG",
      tenant: "Muster-Mieter",
      from: "2025-01-01",
      to: null,
      days: 365,
      months: 12,
      costCents: count * 10000,
      prepaidCents: 0,
      balanceCents: count * 10000,
      prepaymentMode: "kalendermonate",
      tenantStreet: "",
      tenantZip: "",
      tenantCity: "",
    }],
  };
}

const property = { name: "Haus", street: "Musterstraße 1", zip: "50667", city: "Köln" };

describe("statement PDF", () => {
  it("rejects an impossible number of days in the archived result", () => {
    expect(normalizeStatementResult({ year: 2025, daysInYear: 360, totalCostCents: 0, totalVacancyCents: 0, costs: [], tenancies: [] })).toBeNull();
  });

  it("creates a valid tenant PDF with only the selected recipient data", async () => {
    const pdf = await createTenantStatementPdf(property, resultWithCosts(1), "2026-01-01T00:00:00.000Z", "t1");
    const document = await PDFDocument.load(pdf.bytes);

    expect(pdf.fileName).toContain("Nebenkostenabrechnung-2025-EG.pdf");
    expect(document.getPages()).toHaveLength(1);
  });

  it("creates additional pages instead of clipping a long archive", async () => {
    const bytes = await createStatementPdf(property, resultWithCosts(25), "2026-01-01T00:00:00.000Z");
    const document = await PDFDocument.load(bytes);

    expect(document.getPages().length).toBeGreaterThan(1);
  });
});
