import { describe, expect, it } from "vitest";
import { BETA_LIMITS, betaLimitResult } from "./entitlements";

describe("Beta-Limits", () => {
  it("allows creation below the property limit", () => {
    expect(betaLimitResult(0, BETA_LIMITS.properties)).toMatchObject({
      allowed: true,
      plan: "beta",
      current: 0,
      limit: 1,
      upgradeUrl: null,
    });
  });

  it("blocks the second property", () => {
    expect(betaLimitResult(1, BETA_LIMITS.properties).allowed).toBe(false);
  });

  it("allows five units but blocks the sixth", () => {
    expect(betaLimitResult(4, BETA_LIMITS.units).allowed).toBe(true);
    expect(betaLimitResult(5, BETA_LIMITS.units).allowed).toBe(false);
  });
});
