import { createStatementPdf, createTenantStatementPdf, type StatementPdfResult } from "@/lib/pdf/statement-pdf";

const sampleResult: StatementPdfResult = {
  year: 2026,
  daysInYear: 365,
  totalCostCents: 120000,
  totalVacancyCents: 78667,
  warnings: [],
  costs: [
    {
      category: "Wasser",
      amountCents: 120000,
      rule: "Wohnfläche: Kosten × Wohnfläche ÷ Gesamtfläche × Zeitanteil",
      allocatedCents: 41333,
      vacancyCents: 78667,
      shares: [
        {
          tenancyId: "muster-tenancy",
          cents: 41333,
          formula: "1.200,00 € × 62 m² ÷ 180 m² = 413,33 €",
        },
      ],
    },
  ],
  tenancies: [
    {
      id: "muster-tenancy",
      unitLabel: "Wohnung EG links",
      tenant: "Muster-Mieter",
      from: "2026-01-01",
      to: null,
      days: 365,
      months: 12,
      costCents: 41333,
      prepaidCents: 0,
      balanceCents: 41333,
      prepaymentMode: "kalendermonate",
      tenantStreet: "",
      tenantZip: "",
      tenantCity: "",
    },
  ],
};

export async function GET(request: Request) {
  const property = {
    name: "MUSTEROBJEKT – NICHT ECHT",
    street: "Musterstraße 1",
    zip: "50667",
    city: "Köln",
  };
  if (new URL(request.url).searchParams.get("mieter") === "1") {
    const tenantPdf = await createTenantStatementPdf(property, sampleResult, "2026-10-12T00:00:00.000Z", "muster-tenancy");
    const tenantBody = tenantPdf.bytes.buffer.slice(tenantPdf.bytes.byteOffset, tenantPdf.bytes.byteOffset + tenantPdf.bytes.byteLength) as ArrayBuffer;
    return new Response(tenantBody, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Disposition": `inline; filename="${tenantPdf.fileName}"`,
        "Content-Type": "application/pdf",
      },
    });
  }

  const pdf = await createStatementPdf(property, sampleResult, "2026-10-12T00:00:00.000Z");
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Disposition": 'inline; filename="Nebenkostat-Beispielabrechnung.pdf"',
      "Content-Type": "application/pdf",
    },
  });
}
