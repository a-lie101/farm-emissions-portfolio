import type { MapStyle } from "./MapView";

interface Props {
  value: MapStyle;
  onChange: (style: MapStyle) => void;
  panelOpen: boolean;
}

const OPTIONS: [MapStyle, string][] = [
  ["map", "Map"],
  ["satellite", "Satellite"],
];

export default function MapStyleToggle({ value, onChange, panelOpen }: Props) {
  return (
    <div
      className={`absolute bottom-6 z-[1000] flex overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur transition-all ${
        panelOpen ? "left-[416px]" : "left-4"
      }`}
    >
      {OPTIONS.map(([style, label]) => (
        <button
          key={style}
          onClick={() => onChange(style)}
          className={`px-3.5 py-2 text-xs font-semibold transition ${
            value === style
              ? "bg-[#0c1b33] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
