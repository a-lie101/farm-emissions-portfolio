import { analyzeRotation, type RotationAnalysis, type RotationYear } from "../lib/rotationEngine";
import type { Farm } from "./farms";

// Field C0183, southern Manitoba. Crop history read from satellite,
// 2012 to 2024. This is the only real rotation in the prototype.
export const C0183_HISTORY: RotationYear[] = [
  { year: 2012, crop: "Canola" },
  { year: 2013, crop: "Wheat - Hard Red Spring" },
  { year: 2014, crop: "Canola" },
  { year: 2015, crop: "Wheat - Hard Red Spring" },
  { year: 2016, crop: "Canola" },
  { year: 2017, crop: "Wheat - Hard Red Spring" },
  { year: 2018, crop: "Canola" },
  { year: 2019, crop: "Wheat - Hard Red Spring" },
  { year: 2020, crop: "Canola" },
  { year: 2021, crop: "Peas", lowConfidence: true },
  { year: 2022, crop: "Wheat - Hard Red Spring" },
  { year: 2023, crop: "Soybeans" },
  { year: 2024, crop: "Wheat - Hard Red Spring" },
];

export const C0183_FIELD_ID = "C0183";
export const C0183_ACRES = 137.1;

const HISTORY_END = 2024;
const HISTORY_YEARS = 13;

const HA_TO_ACRES = 2.47105;

// Sample Manitoba farms carry a rotation cycle but no calendar history.
// Tile the cycle across the same window so the published rules have
// something to bite on. Deterministic: same farm, same history.
function historyFromCycle(farm: Farm): RotationYear[] {
  const cycle = farm.rotation[0]?.crops ?? [];
  if (cycle.length === 0) return [];
  const start = HISTORY_END - HISTORY_YEARS + 1;
  return Array.from({ length: HISTORY_YEARS }, (_, i) => ({
    year: start + i,
    crop: cycle[i % cycle.length],
  }));
}

const cache = new Map<string, RotationAnalysis | null>();

export function getRotationAnalysis(farm: Farm): RotationAnalysis | null {
  if (cache.has(farm.id)) return cache.get(farm.id)!;

  let result: RotationAnalysis | null = null;
  if (farm.province === "MB") {
    const isRealField = farm.fieldId === C0183_FIELD_ID;
    const history = isRealField ? C0183_HISTORY : historyFromCycle(farm);
    if (history.length > 0) {
      const acres = farm.detail.fields.reduce((s, f) => s + f.areaHa, 0) * HA_TO_ACRES;
      result = analyzeRotation(
        // Internal ids mean nothing to a reader, so only a surveyed field
        // number is shown.
        farm.fieldId ?? "",
        isRealField ? C0183_ACRES : Math.round(acres * 10) / 10,
        history,
        isRealField
          ? "Crop history read from satellite, 2012 to 2024. Rules and prices are published Manitoba sources."
          : "Sample rotation. Published Manitoba rules applied to an illustrative crop history."
      );
    }
  }

  cache.set(farm.id, result);
  return result;
}
