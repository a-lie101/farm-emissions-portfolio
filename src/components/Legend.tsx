import { BAND_COLORS } from "../data/farms";
import { ASSUMPTIONS } from "../config/assumptions";
import { COST_RAMP, NO_DATA_COLOR } from "./costScale";
import type { DataMode } from "./DataModeToggle";

const EMISSIONS_ROWS: [string, string][] = [
  [BAND_COLORS.low, "< 0.5"],
  [BAND_COLORS.medium, "0.5 – 0.9"],
  [BAND_COLORS.high, "> 0.9"],
];

function costRows(): [string, string][] {
  const breaks = ASSUMPTIONS.display.costPerHaBreaks;
  const rows: [string, string][] = [];
  for (let i = 0; i <= breaks.length; i++) {
    const label =
      i === 0
        ? `< $${breaks[0]}`
        : i === breaks.length
          ? `> $${breaks[breaks.length - 1]}`
          : `$${breaks[i - 1]} – ${breaks[i]}`;
    rows.push([COST_RAMP[i], label]);
  }
  rows.push([NO_DATA_COLOR, "No estimate"]);
  return rows;
}

export default function Legend({ mode }: { mode: DataMode }) {
  const rows = mode === "cost" ? costRows() : EMISSIONS_ROWS;
  const title =
    mode === "cost" ? "Recoverable input cost, estimated ($/ha/yr)" : `Emissions intensity (t CO₂e/ha)`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-lg backdrop-blur">
      <p className="mb-2 max-w-[180px] text-xs font-semibold text-slate-700">{title}</p>
      <div className="space-y-1.5">
        {rows.map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-white shadow"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
