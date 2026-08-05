import type { Assumptions } from "../config/assumptions";

// Structural subset of Farm so tests can use small fixtures.
export interface CostableFarm {
  nAppliedKg: number;
  nAppliedDerived: boolean;
  detail: {
    directN2O: number;
    indirectN2O: number;
    fields: { areaHa: number }[];
  };
}

export interface InputCostResult {
  annualNCostCAD: number;
  recoverableCostCAD: number;
  recoverableCostLowCAD: number;
  recoverableCostHighCAD: number;
  recoverablePerHaCAD: number;
  // t CO2e per kg N, from the farm's own Holos result. Using the farm's
  // implied intensity keeps the co-benefit internally consistent with the
  // emissions numbers already on screen. Our pipeline uses region-specific
  // factors; generic factors overstate dry-region emissions by 15-46%.
  impliedIntensityTPerKgN: number;
  coBenefitTCO2e: number;
  nAppliedDerived: boolean;
}

// Pure function. Returns null when nitrogen use is absent or any input is
// non-finite. All rounding happens at display time, not here.
export function inputCostOpportunity(farm: CostableFarm, assumptions: Assumptions): InputCostResult | null {
  const n = farm.nAppliedKg;
  const areaHa = farm.detail.fields.reduce((s, f) => s + f.areaHa, 0);
  const fertilizerN2O = farm.detail.directN2O + farm.detail.indirectN2O;

  if (!Number.isFinite(n) || n <= 0) return null;
  if (!Number.isFinite(areaHa) || areaHa <= 0) return null;
  if (!Number.isFinite(fertilizerN2O) || fertilizerN2O < 0) return null;

  const { nitrogen } = assumptions;
  const annualNCostCAD = n * nitrogen.pricePerKgCAD;
  const recoverableCostCAD = annualNCostCAD * nitrogen.overApplicationFraction;
  const recoverableCostLowCAD = n * nitrogen.pricePerKgLowCAD * nitrogen.overApplicationFractionLow;
  const recoverableCostHighCAD = n * nitrogen.pricePerKgHighCAD * nitrogen.overApplicationFractionHigh;
  const recoverablePerHaCAD = recoverableCostCAD / areaHa;

  const impliedIntensityTPerKgN = fertilizerN2O / n;
  const coBenefitTCO2e = n * nitrogen.overApplicationFraction * impliedIntensityTPerKgN;

  return {
    annualNCostCAD,
    recoverableCostCAD,
    recoverableCostLowCAD,
    recoverableCostHighCAD,
    recoverablePerHaCAD,
    impliedIntensityTPerKgN,
    coBenefitTCO2e,
    nAppliedDerived: farm.nAppliedDerived,
  };
}
