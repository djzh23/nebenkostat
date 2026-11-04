import { describe, expect, it } from "vitest";
import { isValidIsoDate, overlapsCalendarYear } from "./dates";

describe("isValidIsoDate", () => {
  it("accepts real dates and leap day", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2025-02-28")).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidIsoDate("2025-02-29")).toBe(false);
    expect(isValidIsoDate("2025-04-31")).toBe(false);
    expect(isValidIsoDate("2025-00-10")).toBe(false);
    expect(isValidIsoDate("2025-1-01")).toBe(false);
  });
});

describe("overlapsCalendarYear", () => {
  it("finds a tenancy that overlaps the settlement year", () => {
    expect(overlapsCalendarYear("2024-12-15", "2025-01-15", 2025)).toBe(true);
    expect(overlapsCalendarYear("2026-01-01", null, 2026)).toBe(true);
  });

  it("rejects a tenancy outside the settlement year", () => {
    expect(overlapsCalendarYear("2024-01-01", "2024-12-31", 2025)).toBe(false);
    expect(overlapsCalendarYear("2026-01-01", null, 2025)).toBe(false);
  });
});
