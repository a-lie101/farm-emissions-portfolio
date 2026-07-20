import { BAND_COLORS } from "../data/farms";

const ROWS: [string, string][] = [
  [BAND_COLORS.low, "< 0.5"],
  [BAND_COLORS.medium, "0.5 – 0.9"],
  [BAND_COLORS.high, "> 0.9"],
];

export default function Legend() {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-xs font-semibold text-slate-700">
        Emissions intensity (t CO{"₂"}e/ha)
      </p>
      <div className="space-y-1.5">
        {ROWS.map(([color, label]) => (
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
