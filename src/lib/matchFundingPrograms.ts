import type { Assumptions } from "../config/assumptions";
import type { FundingCategory, FundingProgram } from "../data/fundingPrograms";

// Structural subset of Farm so tests can use small fixtures.
export interface MatchableFarm {
  province: string;
  nAppliedKg: number;
  coverCropSignal: "detected" | "not_detected" | "unknown";
  hasLivestock: boolean;
  totalEmissions: number;
  detail: {
    directN2O: number;
    indirectN2O: number;
    fields: { areaHa: number }[];
  };
}

export interface FundingMatch {
  programId: string;
  category: FundingCategory;
  strength: "likely" | "partial" | "info";
  reasons: string[];
}

// Pure, deterministic, side-effect free. Program caps and cost-share
// percentages come from the program record, never computed here.
export function matchFundingPrograms(
  farm: MatchableFarm,
  programs: FundingProgram[],
  assumptions: Assumptions
): FundingMatch[] {
  const specific = programs.filter((p) => p.provinces.includes(farm.province));
  // The generic "*" row is used only when no province row matches. Never both.
  const applicable = specific.length > 0 ? specific : programs.filter((p) => p.provinces.includes("*"));

  // Prefer the farm's real per-source split. Fall back to the configured
  // share only if a farm ever lacks one.
  const fertilizerN2O =
    farm.detail.directN2O + farm.detail.indirectN2O ||
    farm.totalEmissions * assumptions.emissions.fallbackFertilizerN2OShare;
  const fertilizerPct = farm.totalEmissions > 0 ? Math.round((fertilizerN2O / farm.totalEmissions) * 100) : 0;
  const areaHa = farm.detail.fields.reduce((s, f) => s + f.areaHa, 0);

  const matches: FundingMatch[] = [];

  for (const program of applicable) {
    for (const category of program.categories) {
      if (category === "nitrogen_management" && farm.nAppliedKg > 0) {
        matches.push({
          programId: program.id,
          category,
          strength: "likely",
          reasons: [
            `Synthetic nitrogen use estimated at ${farm.nAppliedKg.toLocaleString("en-CA")} kg/yr. ` +
              `Fertilizer N2O is ${fertilizerPct}% of this farm's modeled emissions.`,
          ],
        });
      }

      if (category === "cover_cropping") {
        if (farm.coverCropSignal === "not_detected") {
          matches.push({
            programId: program.id,
            category,
            strength: "likely",
            reasons: [
              `No cover crop signal detected. Adoption on ~${areaHa.toLocaleString("en-CA")} ha may qualify as a new practice.`,
            ],
          });
        } else if (farm.coverCropSignal === "detected") {
          matches.push({
            programId: program.id,
            category,
            strength: "partial",
            reasons: [
              "Cover cropping detected. Funding requires new acres or a new practice, so only expansion likely qualifies.",
            ],
          });
        } else {
          matches.push({
            programId: program.id,
            category,
            strength: "info",
            reasons: ["Cover crop status not yet assessed for this farm."],
          });
        }
      }

      if (category === "rotational_grazing" && farm.hasLivestock) {
        matches.push({
          programId: program.id,
          category,
          strength: "likely",
          reasons: ["Land is grazed. Rotational grazing projects may qualify."],
        });
      }
    }
  }

  return matches;
}
