import { formatEur } from "@/lib/allocation";
import type { AppState } from "./types";

export type ChecklistGroupId = "receipts" | "periods" | "prepayments" | "quality";
export type ChecklistStatus = "ok" | "attention";

export type BillingChecklistGroup = {
  id: ChecklistGroupId;
  label: string;
  status: ChecklistStatus;
  summary: string;
  details: string[];
};

export type BillingChecklist = {
  groups: BillingChecklistGroup[];
  openCount: number;
};

const DAY_MS = 86_400_000;

function dateOrdinal(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function rangeLabel(start: string, end: string): string {
  return `${dateLabel(start)} bis ${dateLabel(end)}`;
}

function uncoveredPeriods(state: AppState, propertyId: string, year: number): string[] {
  const units = state.units.filter((unit) => unit.propertyId === propertyId);
  const yearStart = dateOrdinal(isoDate(year, 1, 1));
  const yearEnd = dateOrdinal(isoDate(year, 12, 31));
  const details: string[] = [];

  for (const unit of units) {
    const ranges = state.tenancies
      .filter((tenancy) => tenancy.unitId === unit.id)
      .map((tenancy) => ({
        start: Math.max(dateOrdinal(tenancy.from), yearStart),
        end: Math.min(dateOrdinal(tenancy.to ?? isoDate(year, 12, 31)), yearEnd),
      }))
      .filter((range) => range.end >= range.start)
      .sort((left, right) => left.start - right.start);

    let cursor = yearStart;
    for (const range of ranges) {
      if (range.start > cursor) {
        details.push(`${unit.label}: ${rangeLabel(new Date(cursor * DAY_MS).toISOString().slice(0, 10), new Date((range.start - 1) * DAY_MS).toISOString().slice(0, 10))} nicht belegt`);
      }
      cursor = Math.max(cursor, range.end + 1);
    }

    if (cursor <= yearEnd) {
      details.push(`${unit.label}: ${rangeLabel(new Date(cursor * DAY_MS).toISOString().slice(0, 10), isoDate(year, 12, 31))} nicht belegt`);
    }
  }

  return details;
}

export function buildBillingChecklist(state: AppState, propertyId: string, year: number): BillingChecklist {
  const property = state.properties.find((candidate) => candidate.id === propertyId);
  const units = state.units.filter((unit) => unit.propertyId === propertyId);
  const costs = state.costs.filter((cost) => cost.propertyId === propertyId && cost.year === year);
  const unitLabel = new Map(units.map((unit) => [unit.id, unit.label]));
  const activeTenancies = state.tenancies.filter((tenancy) => {
    if (!units.some((unit) => unit.id === tenancy.unitId)) return false;
    const start = dateOrdinal(tenancy.from);
    const end = dateOrdinal(tenancy.to ?? isoDate(year, 12, 31));
    return end >= dateOrdinal(isoDate(year, 1, 1)) && start <= dateOrdinal(isoDate(year, 12, 31));
  });

  const missingReceipts = costs.filter((cost) => cost.receipts.length === 0);
  const periodDetails = uncoveredPeriods(state, propertyId, year);
  const missingPrepayments = activeTenancies.filter((tenancy) => tenancy.prepaymentCents <= 0);
  const personCostWithCoverageGap = costs.some((cost) => cost.key === "personen") && periodDetails.length > 0;
  const personVacancyWarning = personCostWithCoverageGap
    ? ["Personenschlüssel: Leerstandszeiten werden nicht automatisch als Vermieteranteil bewertet. Bitte fachlich prüfen."]
    : [];
  const partialCalendarPrepayments = activeTenancies
    .filter((tenancy) => tenancy.prepaymentMode !== "taggenau")
    .filter((tenancy) => {
      const start = new Date(Math.max(dateOrdinal(tenancy.from), dateOrdinal(isoDate(year, 1, 1))) * DAY_MS);
      const end = new Date(Math.min(dateOrdinal(tenancy.to ?? isoDate(year, 12, 31)), dateOrdinal(isoDate(year, 12, 31))) * DAY_MS);
      const lastDayOfEndMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
      return start.getUTCDate() !== 1 || end.getUTCDate() !== lastDayOfEndMonth;
    })
    .map((tenancy) => `${unitLabel.get(tenancy.unitId) ?? "Einheit"} · ${tenancy.tenant}: Teilmonat wird als voller Kalendermonat berücksichtigt.`);
  const qualityDetails: string[] = [
    "Mietvertrag und Umlagefähigkeit jeder Kostenposition manuell prüfen.",
  ];
  if (!property || [property.street, property.zip, property.city].some((value) => !value.trim())) {
    qualityDetails.push("Objektadresse ist unvollständig und muss vor dem Versand ergänzt werden.");
  }
  if (!property || [property.landlordName, property.landlordStreet, property.landlordZip, property.landlordCity].some((value) => !value.trim())) {
    qualityDetails.push("Absenderangaben des Vermieters sind unvollständig und müssen vor dem Versand ergänzt werden.");
  }
  const missingTenantAddresses = activeTenancies.filter((tenancy) => [tenancy.tenantStreet, tenancy.tenantZip, tenancy.tenantCity].some((value) => !value.trim()));
  if (missingTenantAddresses.length > 0) {
    qualityDetails.push(`${missingTenantAddresses.length} Mietpartei${missingTenantAddresses.length === 1 ? " hat" : "en haben"} keine vollständige Empfängeradresse.`);
  }
  if (costs.some((cost) => cost.category === "Heizung" || cost.category === "Warmwasser")) {
    qualityDetails.push("Heiz- und Warmwasserkosten nur mit passender Verbrauchs- oder externer Einzelabrechnung übernehmen.");
  }
  if (costs.some((cost) => cost.key === "direkt")) {
    qualityDetails.push("Externe Einzelbeträge mit der Originalabrechnung und der richtigen Mietpartei abgleichen.");
  }

  const groups: BillingChecklistGroup[] = [
    {
      id: "receipts",
      label: "Belege",
      status: costs.length > 0 && missingReceipts.length === 0 ? "ok" : "attention",
      summary:
        costs.length === 0
          ? "Noch keine Kostenpositionen angelegt."
          : missingReceipts.length === 0
            ? "Jede Kostenposition hat mindestens einen Beleg."
            : `${missingReceipts.length} Kostenposition${missingReceipts.length === 1 ? "" : "en"} ohne Beleg.`,
      details: missingReceipts.map((cost) => `${cost.category} · ${formatEur(cost.amountCents)}`),
    },
    {
      id: "periods",
      label: "Mietzeiträume",
      status: units.length > 0 && periodDetails.length === 0 && personVacancyWarning.length === 0 ? "ok" : "attention",
      summary:
        units.length === 0
          ? "Noch keine Einheiten angelegt."
          : periodDetails.length === 0 && personVacancyWarning.length === 0
            ? "Alle Einheiten sind für das Jahr abgedeckt."
            : periodDetails.length > 0
              ? `${periodDetails.length} Zeitraum${periodDetails.length === 1 ? "" : "e"} ohne Mietverhältnis. Leerstand prüfen.`
              : "Der Personenschlüssel benötigt bei Leerstand eine fachliche Prüfung.",
      details: [...periodDetails, ...personVacancyWarning],
    },
    {
      id: "prepayments",
      label: "Angerechnete Vorauszahlungen",
      status: missingPrepayments.length === 0 && partialCalendarPrepayments.length === 0 ? "ok" : "attention",
      summary:
        missingPrepayments.length === 0 && partialCalendarPrepayments.length === 0
          ? "Angerechnete monatliche Vorauszahlungen sind für alle Mietverhältnisse hinterlegt."
          : missingPrepayments.length > 0
            ? `${missingPrepayments.length} Mietverhältnis${missingPrepayments.length === 1 ? "" : "se"} ohne Vorauszahlung.`
            : "Teilmonate werden nach der gewählten Vorauszahlungsregel geprüft.",
      details: [
        ...missingPrepayments.map((tenancy) => `${unitLabel.get(tenancy.unitId) ?? "Einheit"} · ${tenancy.tenant}`),
        ...partialCalendarPrepayments,
      ],
    },
    {
      id: "quality",
      label: "Fachliche Prüfung",
      status: "attention",
      summary: "Vor dem Versand müssen Adressen, Mietvertrag und Umlagefähigkeit manuell geprüft werden.",
      details: qualityDetails,
    },
  ];

  return { groups, openCount: groups.filter((group) => group.status === "attention").length };
}
