import { formatEur } from "@/lib/allocation";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

type PdfCost = {
  category: string;
  amountCents: number;
  rule: string;
  allocatedCents: number;
  vacancyCents: number;
  shares: Array<{ tenancyId: string; cents: number; formula: string }>;
};

type PdfTenancy = {
  id: string;
  unitLabel: string;
  tenant: string;
  from: string;
  to: string | null;
  days: number;
  months: number;
  costCents: number;
  prepaidCents: number;
  balanceCents: number;
  prepaymentMode: "kalendermonate" | "taggenau";
  tenantStreet: string;
  tenantZip: string;
  tenantCity: string;
};

export type StatementPdfResult = {
  year: number;
  daysInYear: number;
  totalCostCents: number;
  totalVacancyCents: number;
  costs: PdfCost[];
  tenancies: PdfTenancy[];
  warnings: string[];
};

export type StatementPdfProperty = {
  name: string;
  street: string | null;
  zip: string | null;
  city: string | null;
  landlordName?: string | null;
  landlordStreet?: string | null;
  landlordZip?: string | null;
  landlordCity?: string | null;
  landlordEmail?: string | null;
};

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.length <= maxLength ? value : null;
}

function cents(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && Math.abs(value) <= 1_000_000_000_000 ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

export function normalizeStatementResult(value: unknown): StatementPdfResult | null {
  if (!isRecord(value)) return null;
  const year = positiveInteger(value.year);
  const providedDaysInYear = positiveInteger(value.daysInYear);
  const calculatedDaysInYear = year !== null && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  if (value.daysInYear !== undefined && (providedDaysInYear === null || (providedDaysInYear !== 365 && providedDaysInYear !== 366))) return null;
  const daysInYear = providedDaysInYear ?? calculatedDaysInYear;
  const totalCostCents = cents(value.totalCostCents);
  const totalVacancyCents = cents(value.totalVacancyCents);
  if (year === null || year < 2000 || year > 2100 || totalCostCents === null || totalVacancyCents === null) return null;
  if (!Array.isArray(value.costs) || !Array.isArray(value.tenancies)) return null;

  const costs: PdfCost[] = [];
  for (const item of value.costs) {
    if (!isRecord(item) || !isRecord(item.cost) || !Array.isArray(item.shares)) return null;
    const category = text(item.cost.category, 160);
    const amountCents = cents(item.cost.amountCents);
    const rule = text(item.rule, 500);
    const allocatedCents = cents(item.allocatedCents);
    const vacancyCents = cents(item.vacancyCents);
    if (category === null || amountCents === null || rule === null || allocatedCents === null || vacancyCents === null) return null;

    const shares: PdfCost["shares"] = [];
    for (const share of item.shares) {
      if (!isRecord(share)) return null;
      const tenancyId = text(share.tenancyId, 100);
      const shareCents = cents(share.cents);
      const formula = text(share.formula, 500);
      if (tenancyId === null || shareCents === null || formula === null) return null;
      shares.push({ tenancyId, cents: shareCents, formula });
    }
    costs.push({ category, amountCents, rule, allocatedCents, vacancyCents, shares });
  }

  const tenancies: PdfTenancy[] = [];
  for (const item of value.tenancies) {
    if (!isRecord(item) || !isRecord(item.tenancy) || !isRecord(item.unit)) return null;
    const id = text(item.tenancy.id, 100);
    const unitLabel = text(item.unit.label, 120);
    const tenant = text(item.tenancy.tenant, 160);
    const from = text(item.tenancy.from, 20);
    const to = item.tenancy.to === null ? null : text(item.tenancy.to, 20);
    const days = positiveInteger(item.days);
    const months = positiveInteger(item.months);
    const costCents = cents(item.costCents);
    const prepaidCents = cents(item.prepaidCents);
    const balanceCents = cents(item.balanceCents);
    if (id === null || unitLabel === null || tenant === null || from === null || (item.tenancy.to !== null && to === null) || days === null || months === null || costCents === null || prepaidCents === null || balanceCents === null) {
      return null;
    }
    tenancies.push({
      id,
      unitLabel,
      tenant,
      from,
      to,
      days,
      months,
      costCents,
      prepaidCents,
      balanceCents,
      prepaymentMode: item.tenancy.prepaymentMode === "taggenau" ? "taggenau" : "kalendermonate",
      tenantStreet: text(item.tenancy.tenantStreet, 160) ?? "",
      tenantZip: text(item.tenancy.tenantZip, 20) ?? "",
      tenantCity: text(item.tenancy.tenantCity, 120) ?? "",
    });
  }

  const warnings = Array.isArray(value.warnings)
    ? value.warnings.flatMap((warning) => {
        const normalized = text(warning, 500);
        return normalized ? [normalized] : [];
      }).slice(0, 5)
    : [];
  return { year, daysInYear, totalCostCents, totalVacancyCents, costs, tenancies, warnings };
}

function wrap(textValue: string, font: PDFFont, size: number, width: number): string[] {
  const words = textValue.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function dateDe(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toLocaleDateString("de-DE", { timeZone: "UTC" });
}

function addressOf(property: StatementPdfProperty): string {
  return [property.street, [property.zip, property.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function safeFilePart(value: string): string {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "Mietpartei";
}

type PdfLayout = {
  document: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  ink: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  stamp: ReturnType<typeof rgb>;
  paper: ReturnType<typeof rgb>;
  page: PDFPage;
  y: number;
};

async function createLayout(): Promise<PdfLayout> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const mono = await document.embedFont(StandardFonts.Courier);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const layout = {
    document,
    regular,
    bold,
    mono,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    ink: rgb(0.08, 0.09, 0.1),
    muted: rgb(0.29, 0.31, 0.34),
    stamp: rgb(0.78, 0.2, 0.16),
    paper: rgb(0.985, 0.985, 0.97),
    page: undefined as unknown as PDFPage,
    y: 0,
  } satisfies PdfLayout;
  newPage(layout);
  return layout;
}

function newPage(layout: PdfLayout) {
  layout.page = layout.document.addPage([layout.pageWidth, layout.pageHeight]);
  layout.y = layout.pageHeight - 56;
  layout.page.drawText("NEBENKOSTAT", { x: layout.margin, y: layout.y, size: 9, font: layout.bold, color: layout.stamp });
  layout.page.drawLine({ start: { x: layout.margin, y: layout.y - 10 }, end: { x: layout.pageWidth - layout.margin, y: layout.y - 10 }, thickness: 0.7, color: layout.ink });
  layout.y -= 34;
}

function ensureSpace(layout: PdfLayout, height: number) {
  if (layout.y - height < 58) newPage(layout);
}

function drawText(layout: PdfLayout, value: string, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number; width?: number } = {}) {
  const font = options.font ?? layout.regular;
  const size = options.size ?? 10;
  const gap = options.gap ?? size + 4;
  const lines = wrap(value, font, size, options.width ?? layout.contentWidth);
  ensureSpace(layout, lines.length * gap);
  for (const line of lines) {
    layout.page.drawText(line, { x: layout.margin, y: layout.y, size, font, color: options.color ?? layout.ink });
    layout.y -= gap;
  }
}

function drawHeading(layout: PdfLayout, value: string, size = 15) {
  ensureSpace(layout, size + 22);
  layout.page.drawText(value, { x: layout.margin, y: layout.y, size, font: layout.bold, color: layout.ink });
  layout.y -= size + 9;
}

function drawRule(layout: PdfLayout, color = layout.ink) {
  ensureSpace(layout, 12);
  layout.page.drawLine({ start: { x: layout.margin, y: layout.y }, end: { x: layout.pageWidth - layout.margin, y: layout.y }, thickness: 0.7, color });
  layout.y -= 20;
}

function drawTable(layout: PdfLayout, columns: Array<{ title: string; width: number; align?: "left" | "right" }>, rows: string[][]) {
  const drawRow = (values: string[], header = false) => {
    const font = header ? layout.bold : layout.regular;
    const size = header ? 8 : 9;
    const lineHeight = 11;
    const wrapped = values.map((value, index) => wrap(value, font, size, columns[index].width - 8));
    const rowHeight = Math.max(...wrapped.map((lines) => lines.length)) * lineHeight + 15;
    ensureSpace(layout, rowHeight + 2);
    let x = layout.margin;
    for (let index = 0; index < columns.length; index++) {
      const column = columns[index];
      const lines = wrapped[index];
      lines.forEach((line, lineIndex) => {
        const textWidth = font.widthOfTextAtSize(line, size);
        const drawX = column.align === "right" ? x + column.width - 4 - textWidth : x + 4;
        layout.page.drawText(line, { x: drawX, y: layout.y - 11 - lineIndex * lineHeight, size, font, color: header ? layout.muted : layout.ink });
      });
      x += column.width;
    }
    layout.page.drawLine({ start: { x: layout.margin, y: layout.y - rowHeight + 5 }, end: { x: layout.pageWidth - layout.margin, y: layout.y - rowHeight + 5 }, thickness: header ? 0.8 : 0.35, color: header ? layout.ink : rgb(0.72, 0.74, 0.76) });
    layout.y -= rowHeight;
  };

  drawRow(columns.map((column) => column.title), true);
  rows.forEach((row) => drawRow(row));
  layout.y -= 6;
}

function drawSummaryBox(layout: PdfLayout, rows: Array<[string, string]>, emphasis?: [string, string]) {
  const rowHeight = 21 * rows.length + (emphasis ? 34 : 0) + 20;
  ensureSpace(layout, rowHeight);
  const top = layout.y + 8;
  layout.page.drawRectangle({ x: layout.margin, y: layout.y - rowHeight + 8, width: layout.contentWidth, height: rowHeight, color: layout.paper, borderColor: rgb(0.72, 0.74, 0.76), borderWidth: 0.7 });
  let rowY = top - 18;
  for (const [label, value] of rows) {
    layout.page.drawText(label, { x: layout.margin + 14, y: rowY, size: 9, font: layout.regular, color: layout.muted });
    const valueWidth = layout.mono.widthOfTextAtSize(value, 9);
    layout.page.drawText(value, { x: layout.pageWidth - layout.margin - 14 - valueWidth, y: rowY, size: 9, font: layout.mono, color: layout.ink });
    rowY -= 21;
  }
  if (emphasis) {
    layout.page.drawLine({ start: { x: layout.margin + 14, y: rowY + 7 }, end: { x: layout.pageWidth - layout.margin - 14, y: rowY + 7 }, thickness: 0.7, color: layout.stamp });
    rowY -= 8;
    layout.page.drawText(emphasis[0], { x: layout.margin + 14, y: rowY, size: 11, font: layout.bold, color: layout.ink });
    const valueWidth = layout.bold.widthOfTextAtSize(emphasis[1], 14);
    layout.page.drawText(emphasis[1], { x: layout.pageWidth - layout.margin - 14 - valueWidth, y: rowY - 2, size: 14, font: layout.bold, color: layout.stamp });
  }
  layout.y -= rowHeight + 12;
}

function drawFooter(layout: PdfLayout, year: number) {
  const pages = layout.document.getPages();
  pages.forEach((page, index) => {
    page.drawText("Erstellt mit Nebenkostat · Prüfung durch den Vermieter bzw. eine Fachberatung erforderlich.", { x: layout.margin, y: 27, size: 7, font: layout.regular, color: layout.muted });
    const pageText = `Abrechnung ${year} · Seite ${index + 1} von ${pages.length}`;
    const width = layout.mono.widthOfTextAtSize(pageText, 7);
    page.drawText(pageText, { x: layout.pageWidth - layout.margin - width, y: 27, size: 7, font: layout.mono, color: layout.muted });
  });
}

function drawDocumentIntro(layout: PdfLayout, property: StatementPdfProperty, year: number, title: string) {
  drawText(layout, title, { font: layout.bold, size: 24, gap: 30 });
  drawText(layout, property.name, { font: layout.bold, size: 12, gap: 17 });
  const address = addressOf(property);
  if (address) drawText(layout, address, { size: 9, color: layout.muted, gap: 13 });
  const landlordAddress = [property.landlordStreet, [property.landlordZip, property.landlordCity].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (property.landlordName) drawText(layout, `Vermieter: ${property.landlordName}`, { size: 8.5, color: layout.muted, gap: 12 });
  if (landlordAddress) drawText(layout, landlordAddress, { size: 8.5, color: layout.muted, gap: 12 });
  if (property.landlordEmail) drawText(layout, property.landlordEmail, { size: 8.5, color: layout.muted, gap: 12 });
  drawText(layout, `Abrechnungszeitraum 01.01.${year} bis 31.12.${year}`, { font: layout.mono, size: 8, color: layout.muted, gap: 12 });
  layout.y -= 5;
  drawRule(layout);
}

function drawWarnings(layout: PdfLayout, warnings: string[]) {
  if (warnings.length === 0) return;
  drawHeading(layout, "Prüfhinweis", 11);
  warnings.forEach((warning) => drawText(layout, warning, { size: 8.5, color: layout.stamp, gap: 12 }));
  layout.y -= 4;
}

function tenantPdfData(result: StatementPdfResult, tenancyId: string) {
  const tenancy = result.tenancies.find((candidate) => candidate.id === tenancyId);
  if (!tenancy) throw new Error("Mietverhältnis nicht gefunden.");
  const costs = result.costs.map((cost) => ({
    ...cost,
    share: cost.shares.find((share) => share.tenancyId === tenancyId) ?? { tenancyId, cents: 0, formula: "Keine Umlage auf diese Mietpartei" },
  }));
  return { tenancy, costs };
}

export async function createTenantStatementPdfLegacy(
  property: StatementPdfProperty,
  result: StatementPdfResult,
  finalizedAt: string,
  tenancyId: string,
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const layout = await createLayout();
  const { tenancy, costs } = tenantPdfData(result, tenancyId);
  const balanceText = tenancy.balanceCents > 0 ? "Nachzahlung" : tenancy.balanceCents < 0 ? "Guthaben" : "Ausgeglichen";

  drawDocumentIntro(layout, property, result.year, `Nebenkostenabrechnung ${result.year}`);
  drawHeading(layout, "Für die Mietpartei");
  drawText(layout, `${tenancy.tenant} · ${tenancy.unitLabel}`, { font: layout.bold, size: 12, gap: 16 });
  drawText(layout, `Mietzeitraum: ${dateDe(tenancy.from)} bis ${tenancy.to ? dateDe(tenancy.to) : "laufend"} · ${tenancy.days} Tage berücksichtigt`, { size: 9, color: layout.muted, gap: 13 });
  drawText(layout, `Monatliche Vorauszahlung: ${formatEur(tenancy.prepaidCents / Math.max(tenancy.months, 1))} · ${tenancy.months} Monate = ${formatEur(tenancy.prepaidCents)}`, { size: 9, color: layout.muted, gap: 13 });
  drawText(layout, `Erstellt am ${dateDe(finalizedAt)}`, { font: layout.mono, size: 8, color: layout.muted, gap: 12 });
  layout.y -= 5;

  drawSummaryBox(layout, [
    ["Ihr Anteil an den umlagefähigen Kosten", formatEur(tenancy.costCents)],
    ["Abzüglich geleisteter Vorauszahlungen", formatEur(tenancy.prepaidCents)],
  ], [balanceText, formatEur(Math.abs(tenancy.balanceCents))]);
  drawText(layout, "Der Saldo ergibt sich aus Ihrem Kostenanteil abzüglich der laut Mietvertrag angerechneten Vorauszahlungen.", { size: 8.5, color: layout.muted, gap: 12 });
  layout.y -= 8;

  drawHeading(layout, "Zusammensetzung Ihrer Kosten");
  drawTable(layout, [
    { title: "Kostenart", width: 150 },
    { title: "Gesamt", width: 82, align: "right" },
    { title: "Umlageschlüssel", width: 132 },
    { title: "Ihr Anteil", width: 96, align: "right" },
  ], costs.map((cost) => [cost.category, formatEur(cost.amountCents), cost.rule.split(":")[0] ?? cost.rule, formatEur(cost.share.cents)]));

  for (const cost of costs) {
    drawText(layout, `${cost.category}: ${cost.share.formula}`, { font: layout.mono, size: 7.5, color: layout.muted, gap: 10, width: layout.contentWidth - 12 });
  }
  layout.y -= 4;
  drawRule(layout, layout.stamp);
  drawText(layout, "Die Berechnung zeigt die verwendeten Beträge und den Rechenweg. Bitte bewahre diese Abrechnung zusammen mit den zugehörigen Belegen auf.", { size: 8.5, color: layout.muted, gap: 12 });
  drawFooter(layout, result.year);

  return {
    bytes: await layout.document.save(),
    fileName: `Nebenkostenabrechnung-${result.year}-${safeFilePart(tenancy.unitLabel)}.pdf`,
  };
}

export async function createTenantStatementPdf(
  property: StatementPdfProperty,
  result: StatementPdfResult,
  finalizedAt: string,
  tenancyId: string,
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const layout = await createLayout();
  const { tenancy, costs } = tenantPdfData(result, tenancyId);
  const balanceText = tenancy.balanceCents > 0 ? "Nachzahlung" : tenancy.balanceCents < 0 ? "Guthaben" : "Ausgeglichen";
  drawDocumentIntro(layout, property, result.year, `Nebenkostenabrechnung ${result.year}`);
  drawWarnings(layout, result.warnings);
  drawHeading(layout, "Für die Mietpartei");
  drawText(layout, `${tenancy.tenant} · ${tenancy.unitLabel}`, { font: layout.bold, size: 12, gap: 16 });
  const tenantAddress = [tenancy.tenantStreet, [tenancy.tenantZip, tenancy.tenantCity].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (tenantAddress) drawText(layout, tenantAddress, { size: 9, color: layout.muted, gap: 13 });
  drawText(layout, `Mietzeitraum: ${dateDe(tenancy.from)} bis ${tenancy.to ? dateDe(tenancy.to) : "laufend"} · ${tenancy.days} von ${result.daysInYear} Tagen berücksichtigt`, { size: 9, color: layout.muted, gap: 13 });
  if (tenancy.prepaymentMode === "taggenau") {
    drawText(layout, `Vorauszahlung taggenau berechnet = ${formatEur(tenancy.prepaidCents)}`, { size: 9, color: layout.muted, gap: 13 });
  } else {
    drawText(layout, `Monatliche Vorauszahlung: ${formatEur(tenancy.prepaidCents / Math.max(tenancy.months, 1))} · ${tenancy.months} Kalendermonate = ${formatEur(tenancy.prepaidCents)}`, { size: 9, color: layout.muted, gap: 13 });
  }
  drawText(layout, `Erstellt am ${dateDe(finalizedAt)}`, { font: layout.mono, size: 8, color: layout.muted, gap: 12 });
  layout.y -= 5;
  drawSummaryBox(layout, [["Ihr Anteil an den umlagefähigen Kosten", formatEur(tenancy.costCents)], ["Angerechnete Vorauszahlungen laut Mietvertrag", formatEur(tenancy.prepaidCents)]], [balanceText, formatEur(Math.abs(tenancy.balanceCents))]);
  drawText(layout, "Der Saldo ergibt sich aus Ihrem Kostenanteil abzüglich der laut Mietvertrag angerechneten Vorauszahlungen.", { size: 8.5, color: layout.muted, gap: 12 });
  layout.y -= 8;
  drawHeading(layout, "Zusammensetzung Ihrer Kosten");
  drawTable(layout, [
    { title: "Kostenart", width: 150 },
    { title: "Gesamt", width: 82, align: "right" },
    { title: "Umlageschlüssel", width: 132 },
    { title: "Ihr Anteil", width: 96, align: "right" },
  ], costs.map((cost) => [cost.category, formatEur(cost.amountCents), cost.rule.split(":")[0] ?? cost.rule, formatEur(cost.share.cents)]));
  for (const cost of costs) drawText(layout, `${cost.category}: ${cost.share.formula}`, { font: layout.mono, size: 7.5, color: layout.muted, gap: 10, width: layout.contentWidth - 12 });
  layout.y -= 4;
  drawRule(layout, layout.stamp);
  drawText(layout, "Die Berechnung zeigt die verwendeten Beträge und den Rechenweg. Bitte bewahre diese Abrechnung zusammen mit den zugehörigen Belegen auf.", { size: 8.5, color: layout.muted, gap: 12 });
  drawFooter(layout, result.year);
  return { bytes: await layout.document.save(), fileName: `Nebenkostenabrechnung-${result.year}-${safeFilePart(tenancy.unitLabel)}.pdf` };
}

export async function createStatementPdf(
  property: StatementPdfProperty,
  result: StatementPdfResult,
  finalizedAt: string,
): Promise<Uint8Array> {
  const layout = await createLayout();
  drawDocumentIntro(layout, property, result.year, `Abrechnung ${result.year} · Archiv`);
  drawWarnings(layout, result.warnings);
  drawText(layout, `Abgeschlossen am ${dateDe(finalizedAt)}`, { font: layout.mono, size: 8, color: layout.muted, gap: 12 });
  drawSummaryBox(layout, [
    ["Gesamtkosten", formatEur(result.totalCostCents)],
    ["Leerstand (Vermieter)", formatEur(result.totalVacancyCents)],
    ["Mietparteien", String(result.tenancies.length)],
  ]);

  drawHeading(layout, "Kosten und Umlage");
  const tenancyById = new Map(result.tenancies.map((tenancy) => [tenancy.id, tenancy]));
  for (const cost of result.costs) {
    drawText(layout, `${cost.category} · ${formatEur(cost.amountCents)}`, { font: layout.bold, size: 11, gap: 15 });
    drawText(layout, cost.rule, { size: 8, color: layout.muted, gap: 11 });
    drawTable(layout, [
      { title: "Mietpartei", width: 170 },
      { title: "Rechenweg", width: 235 },
      { title: "Anteil", width: 55, align: "right" },
    ], cost.shares.map((share) => {
      const tenancy = tenancyById.get(share.tenancyId);
      return [`${tenancy?.unitLabel ?? "Einheit"} · ${tenancy?.tenant ?? "Mietpartei"}`, share.formula, formatEur(share.cents)];
    }).concat([["Leerstand (Vermieter)", "Nicht zugeordnet", formatEur(cost.vacancyCents)]]));
  }

  drawHeading(layout, "Saldo je Mietpartei");
  drawTable(layout, [
    { title: "Einheit / Mietpartei", width: 210 },
    { title: "Kosten", width: 75, align: "right" },
    { title: "Angerechnet", width: 95, align: "right" },
    { title: "Saldo", width: 75, align: "right" },
  ], result.tenancies.map((tenancy) => [`${tenancy.unitLabel} · ${tenancy.tenant}`, formatEur(tenancy.costCents), formatEur(tenancy.prepaidCents), formatEur(tenancy.balanceCents)]));
  drawFooter(layout, result.year);
  return layout.document.save();
}
