export type DataMode = "emissions" | "cost";

interface Props {
  value: DataMode;
  onChange: (mode: DataMode) => void;
}

const OPTIONS: [DataMode, string][] = [
  ["emissions", "Emissions intensity"],
  ["cost", "Cost opportunity"],
];

export default function DataModeToggle({ value, onChange }: Props) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
      {OPTIONS.map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-3 py-2 text-xs font-semibold transition ${
            value === mode ? "bg-[#0c1b33] text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
