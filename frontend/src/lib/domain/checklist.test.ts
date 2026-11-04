import { describe, expect, it } from "vitest";
import { buildBillingChecklist } from "./checklist";
import type { AppState } from "./types";

const state: AppState = {
  properties: [{ id: "p", name: "Haus", street: "", zip: "", city: "", landlordName: "", landlordStreet: "", landlordZip: "", landlordCity: "", landlordEmail: "" }],
  units: [
    { id: "u1", propertyId: "p", label: "EG", areaHundredths: 6000 },
    { id: "u2", propertyId: "p", label: "OG", areaHundredths: 6000 },
  ],
  tenancies: [
    { id: "t1", unitId: "u1", tenant: "Muller", from: "2025-01-01", to: null, persons: 1, prepaymentCents: 15000, prepaymentMode: "kalendermonate", tenantStreet: "", tenantZip: "", tenantCity: "" },
    { id: "t2", unitId: "u2", tenant: "Schmidt", from: "2025-04-01", to: null, persons: 1, prepaymentCents: 0, prepaymentMode: "kalendermonate", tenantStreet: "", tenantZip: "", tenantCity: "" },
  ],
  costs: [
    { id: "c1", propertyId: "p", year: 2025, category: "Wasser", amountCents: 120000, key: "flaeche", directTenancyId: null, receipts: ["wasser.pdf"] },
    { id: "c2", propertyId: "p", year: 2025, category: "Müll", amountCents: 60000, key: "einheiten", directTenancyId: null, receipts: [] },
  ],
  finalized: [],
};

describe("billing checklist", () => {
  it("finds missing receipts, uncovered periods, and missing prepayments", () => {
    const checklist = buildBillingChecklist(state, "p", 2025);

    expect(checklist.openCount).toBe(3);
    expect(checklist.groups.find((group) => group.id === "receipts")?.details).toEqual(["Müll · 600,00\u00a0€"]);
    expect(checklist.groups.find((group) => group.id === "periods")?.details).toEqual(["OG: 01.01.2025 bis 31.03.2025 nicht belegt"]);
    expect(checklist.groups.find((group) => group.id === "prepayments")?.details).toEqual(["OG · Schmidt"]);
  });

  it("is clear when every required check is complete", () => {
    const complete = {
      ...state,
      tenancies: state.tenancies.map((tenancy) => ({ ...tenancy, from: "2025-01-01", prepaymentCents: 10000 })),
      costs: state.costs.map((cost) => ({ ...cost, receipts: ["beleg.pdf"] })),
    };

    expect(buildBillingChecklist(complete, "p", 2025).openCount).toBe(0);
  });

  it("shows the calendar-month rule for partial move-in periods", () => {
    const partial = {
      ...state,
      tenancies: state.tenancies.map((tenancy) => tenancy.id === "t1"
        ? { ...tenancy, from: "2025-03-15", to: "2025-04-30", prepaymentCents: 10000 }
        : { ...tenancy, prepaymentCents: 10000 }),
    };
    const group = buildBillingChecklist(partial, "p", 2025).groups.find((candidate) => candidate.id === "prepayments");
    expect(group?.details.some((detail) => detail.includes("Teilmonat"))).toBe(true);
  });

  it("does not show that warning for the day-based rule", () => {
    const partial = {
      ...state,
      tenancies: state.tenancies.map((tenancy) => tenancy.id === "t1"
        ? { ...tenancy, from: "2025-03-15", to: "2025-04-30", prepaymentCents: 10000, prepaymentMode: "taggenau" as const }
        : { ...tenancy, prepaymentCents: 10000 }),
    };
    const group = buildBillingChecklist(partial, "p", 2025).groups.find((candidate) => candidate.id === "prepayments");
    expect(group?.details.some((detail) => detail.includes("Teilmonat"))).toBe(false);
  });

  it("flags person-based costs when a unit has a vacancy gap", () => {
    const personCost = {
      ...state,
      costs: [{ ...state.costs[0], key: "personen" as const }],
    };
    const group = buildBillingChecklist(personCost, "p", 2025).groups.find((candidate) => candidate.id === "periods");
    expect(group?.status).toBe("attention");
    expect(group?.details.some((detail) => detail.includes("Personenschlüssel"))).toBe(true);
  });
});
