import { ASSUMPTIONS } from "../config/assumptions";

// Sequential emerald ramp, light to dark: more recoverable $/ha, darker pin.
// One hue, monotonic lightness, per the app's palette direction.
export const COST_RAMP = ["#d3efdd", "#93d7ae", "#4cbc82", "#18a058", "#0a5c36"];

export const NO_DATA_COLOR = "#94a3b8";

export function costColor(perHa: number | null): string {
  if (perHa === null || !Number.isFinite(perHa)) return NO_DATA_COLOR;
  const breaks = ASSUMPTIONS.display.costPerHaBreaks;
  let i = 0;
  while (i < breaks.length && perHa >= breaks[i]) i++;
  return COST_RAMP[i];
}
