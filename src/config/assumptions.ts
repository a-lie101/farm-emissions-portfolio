// All monetary values CAD unless noted.
// Sources and retrieval dates in comments. Full citations in
// docs/research-appendix.md.
// This file is the single place to audit the math behind the
// funding card and the input cost overlay. No component may hold
// these numbers directly.

export const ASSUMPTIONS = {
  nitrogen: {
    // Farm-gate N price derived from urea at $830/tonne CAD,
    // the figure used in the Saskatchewan Ministry of Agriculture
    // 2026 Crop Planning Guide. Urea is 46% N: 830 / 460 = 1.80.
    // 2026 global prices were volatile (roughly US$400-690/t),
    // hence the band. asOf 2026-08.
    pricePerKgCAD: 1.8,
    pricePerKgLowCAD: 1.4,
    pricePerKgHighCAD: 2.1,

    // Share of applied N assumed recoverable through 4R practices
    // (rate, timing, placement, source) without yield loss.
    // Literature on sensor-based and precision N reports 5-45%
    // savings with little yield effect; we use the conservative
    // end. Displayed as a range, never a point promise.
    overApplicationFraction: 0.1,
    overApplicationFractionLow: 0.05,
    overApplicationFractionHigh: 0.15,
  },

  emissions: {
    // Fallback share of farm emissions attributed to fertilizer
    // N2O when a farm lacks a per-source breakdown. Matches the
    // Gavelin Farms Holos result (77%). Every farm in this app
    // carries a real per-source split, so this is insurance only.
    fallbackFertilizerN2OShare: 0.77,
  },

  display: {
    currency: "CAD",
    // Buckets for the cost-opportunity map legend, $/ha/yr.
    // Tuned so Gavelin (roughly $11-14/ha) lands mid-scale.
    costPerHaBreaks: [5, 10, 15, 25],
    asOf: "2026-08",
  },
} as const;

export type Assumptions = typeof ASSUMPTIONS;
