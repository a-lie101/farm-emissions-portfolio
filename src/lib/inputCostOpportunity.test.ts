import { describe, expect, it } from "vitest";
import { ASSUMPTIONS } from "../config/assumptions";
import { inputCostOpportunity, type CostableFarm } from "./inputCostOpportunity";

function fixture(overrides: Partial<CostableFarm> = {}): CostableFarm {
  return {
    nAppliedKg: 55000,
    nAppliedDerived: true,
    detail: {
      directN2O: 484.7,
      indirectN2O: 19.7,
      fields: Array.from({ length: 12 }, () => ({ areaHa: 64 })),
    },
    ...overrides,
  };
}

describe("inputCostOpportunity", () => {
  it("matches the Gavelin worked example within rounding", () => {
    const result = inputCostOpportunity(fixture(), ASSUMPTIONS);
    expect(result).not.toBeNull();
    expect(result!.annualNCostCAD).toBeCloseTo(99000, 0);
    expect(result!.recoverableCostCAD).toBeCloseTo(9900, 0);
    expect(result!.recoverableCostLowCAD).toBeCloseTo(3850, 0);
    expect(result!.recoverableCostHighCAD).toBeCloseTo(17325, 0);
    expect(result!.recoverablePerHaCAD).toBeGreaterThan(11);
    expect(result!.recoverablePerHaCAD).toBeLessThan(14);
    expect(result!.coBenefitTCO2e).toBeGreaterThan(45);
    expect(result!.coBenefitTCO2e).toBeLessThan(55);
  });

  it("returns null when nitrogen use is missing", () => {
    expect(inputCostOpportunity(fixture({ nAppliedKg: NaN }), ASSUMPTIONS)).toBeNull();
    expect(inputCostOpportunity(fixture({ nAppliedKg: 0 }), ASSUMPTIONS)).toBeNull();
  });

  it("does not throw or return Infinity for zero area", () => {
    const zeroArea = fixture({
      detail: { directN2O: 484.7, indirectN2O: 19.7, fields: [] },
    });
    expect(inputCostOpportunity(zeroArea, ASSUMPTIONS)).toBeNull();
  });

  it("brackets the central estimate with the low/high range", () => {
    for (const n of [1000, 20000, 55000, 200000]) {
      const result = inputCostOpportunity(fixture({ nAppliedKg: n }), ASSUMPTIONS)!;
      expect(result.recoverableCostLowCAD).toBeLessThanOrEqual(result.recoverableCostCAD);
      expect(result.recoverableCostCAD).toBeLessThanOrEqual(result.recoverableCostHighCAD);
    }
  });
});
