import { describe, expect, it } from "vitest";
import { activeMonths, daysInYear, prepaymentCentsForYear, settleYear, settlementYear } from "./settlement";
import { SEED_STATE } from "./seed";

// Expected values were computed independently with exact fractions and half-up rounding
// (Python `fractions`), and match the amounts shown on the seed statement.
const PROPERTY = "beispiel-haus";

function sharesOf(settlement: ReturnType<typeof settleYear>, category: string) {
  const cost = settlement.costs.find((candidate) => candidate.cost.category === category);
  if (!cost) throw new Error(`Kostenart ${category} fehlt`);
  return Object.fromEntries(cost.shares.map((share) => [share.tenancyId, share.cents]));
}

describe("settleYear for the seed statement 2025", () => {
  const result = settleYear(SEED_STATE, PROPERTY, 2025);

  it("uses 365 days", () => {
    expect(result.daysInYear).toBe(365);
  });

  it("allocates Wasser by area and time", () => {
    expect(sharesOf(result, "Wasser")).toEqual({ "t-eg": 41333, "t-og-alt": 16034, "t-og-neu": 16300, "t-dg": 38844 });
    expect(result.costs.find((cost) => cost.cost.category === "Wasser")?.vacancyCents).toBe(7489);
  });

  it("allocates Müll by unit and time", () => {
    expect(sharesOf(result, "Müll")).toEqual({ "t-eg": 21333, "t-og-alt": 10579, "t-og-neu": 10754, "t-dg": 17885 });
  });

  it("allocates Heizung by persons and time without vacancy", () => {
    expect(sharesOf(result, "Heizung")).toEqual({ "t-eg": 98506, "t-og-alt": 24424, "t-og-neu": 74487, "t-dg": 82583 });
    expect(result.costs.find((cost) => cost.cost.category === "Heizung")?.vacancyCents).toBe(0);
  });

  it("allocates Grundsteuer by area and time", () => {
    expect(sharesOf(result, "Grundsteuer")).toEqual({ "t-eg": 15500, "t-og-alt": 6013, "t-og-neu": 6112, "t-dg": 14566 });
  });

  it("counts calendar months for the prepayment", () => {
    const months = Object.fromEntries(result.tenancies.map((row) => [row.tenancy.id, row.months]));
    expect(months).toEqual({ "t-eg": 12, "t-og-alt": 6, "t-og-neu": 6, "t-dg": 10 });
  });

  it("accounts for every cost: shares plus vacancy equal the cost", () => {
    for (const cost of result.costs) {
      const allocated = cost.shares.reduce((sum, share) => sum + share.cents, 0);
      expect(allocated + cost.vacancyCents).toBe(cost.cost.amountCents);
    }
  });

  it("keeps tenancy totals consistent with the cost totals", () => {
    const allocated = result.tenancies.reduce((sum, row) => sum + row.costCents, 0);
    const vacancy = result.costs.reduce((sum, cost) => sum + cost.vacancyCents, 0);
    expect(allocated + vacancy).toBe(result.totalCostCents);
  });

  it("assigns an external direct amount only to its selected tenancy", () => {
    const state = {
      ...SEED_STATE,
      costs: [{
        id: "c-direct",
        propertyId: PROPERTY,
        year: 2025,
        category: "Externe Heizkostenabrechnung",
        amountCents: 43820,
        key: "direkt" as const,
        directTenancyId: "t-eg",
        receipts: [],
      }],
    };
    const direct = settleYear(state, PROPERTY, 2025).costs[0];
    expect(direct.shares).toEqual([{ tenancyId: "t-eg", cents: 43820, formula: "438,20\u00a0€ × 1 = 438,20\u00a0€" }]);
    expect(direct.vacancyCents).toBe(0);
  });

  it("splits a calendar-year vacancy between two tenancies without charging it to either tenant", () => {
    const state = {
      properties: [{ id: "turnover", name: "Haus", street: "", zip: "", city: "", landlordName: "", landlordStreet: "", landlordZip: "", landlordCity: "", landlordEmail: "" }],
      units: [{ id: "unit", propertyId: "turnover", label: "Wohnung", areaHundredths: 5000 }],
      tenancies: [
        { id: "tenant-a", unitId: "unit", tenant: "A", from: "2025-01-01", to: "2025-05-15", persons: 1, prepaymentCents: 0, prepaymentMode: "kalendermonate" as const, tenantStreet: "", tenantZip: "", tenantCity: "" },
        { id: "tenant-b", unitId: "unit", tenant: "B", from: "2025-07-01", to: "2025-12-31", persons: 1, prepaymentCents: 0, prepaymentMode: "kalendermonate" as const, tenantStreet: "", tenantZip: "", tenantCity: "" },
      ],
      costs: [{ id: "cost", propertyId: "turnover", year: 2025, category: "Grundsteuer", amountCents: 36500, key: "flaeche" as const, directTenancyId: null, receipts: [] }],
      finalized: [],
    };
    const result = settleYear(state, "turnover", 2025);
    expect(result.tenancies.map((row) => [row.tenancy.id, row.days])).toEqual([["tenant-a", 135], ["tenant-b", 184]]);
    expect(sharesOf(result, "Grundsteuer")).toEqual({ "tenant-a": 13500, "tenant-b": 18400 });
    expect(result.costs[0].vacancyCents).toBe(4600);
  });

  it("warns when person-based costs meet an uncovered period", () => {
    const state = {
      ...SEED_STATE,
      costs: [{ id: "person-cost", propertyId: PROPERTY, year: 2025, category: "Müll", amountCents: 36500, key: "personen" as const, directTenancyId: null, receipts: [] }],
      tenancies: SEED_STATE.tenancies.map((tenancy) => tenancy.id === "t-eg" ? { ...tenancy, from: "2025-02-01" } : tenancy),
    };
    const result = settleYear(state, PROPERTY, 2025);
    expect(result.warnings.some((warning) => warning.includes("Personenschlüssel"))).toBe(true);
  });
});

describe("date helpers", () => {
  it("handles leap years", () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2025)).toBe(365);
  });

  it("counts months touched by a partial tenancy", () => {
    const tenancy = { id: "x", unitId: "u", tenant: "t", from: "2025-03-15", to: "2025-04-01", persons: 1, prepaymentCents: 0, prepaymentMode: "kalendermonate" as const, tenantStreet: "", tenantZip: "", tenantCity: "" };
    expect(activeMonths(tenancy, 2025)).toBe(2);
  });

  it("names the settlement year as the previous calendar year", () => {
    expect(settlementYear(new Date(2026, 9, 3))).toBe(2025);
  });

  it("supports an explicit day-based rule for partial months", () => {
    const tenancy = { id: "x", unitId: "u", tenant: "t", from: "2025-03-15", to: "2025-04-01", persons: 1, prepaymentCents: 10000, prepaymentMode: "taggenau" as const, tenantStreet: "", tenantZip: "", tenantCity: "" };
    expect(prepaymentCentsForYear(tenancy, 2025)).toBe(5817);
  });

  it("keeps the standard rule at one full monthly prepayment per touched month", () => {
    const tenancy = { id: "x", unitId: "u", tenant: "t", from: "2025-03-15", to: "2025-04-01", persons: 1, prepaymentCents: 10000, prepaymentMode: "kalendermonate" as const, tenantStreet: "", tenantZip: "", tenantCity: "" };
    expect(prepaymentCentsForYear(tenancy, 2025)).toBe(20000);
  });
});
