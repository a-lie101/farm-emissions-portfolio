import { useState, type ReactNode } from "react";
import { type Farm } from "../data/farms";
import { exportFarmReport } from "../utils/exportXlsx";
import NdviEvidence from "./NdviEvidence";
import RotationAnalysisTab from "./RotationAnalysisTab";
import { getRotationAnalysis } from "../data/rotationAnalysis";
import { CROP_STYLES, FALLBACK_CROP_STYLE } from "../data/cropStyles";

const BREAKDOWN_SEGMENTS = [
  { key: "n2o", label: "Nitrous oxide (N₂O)", color: "#2f6fed" },
  { key: "energy", label: "Energy", color: "#f59e0b" },
  { key: "soilCarbon", label: "Soil carbon change", color: "#18a058" },
] as const;

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span className="font-display text-sm font-bold text-slate-800">{title}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

const GAS_ROWS = [
  { key: "directN2O", label: "Direct N₂O" },
  { key: "indirectN2O", label: "Indirect N₂O" },
  { key: "farmEnergy", label: "Farm energy CO₂" },
  { key: "upstream", label: "Upstream CO₂" },
  { key: "entericCh4", label: "Enteric CH₄" },
  { key: "manureCh4", label: "Manure CH₄" },
] as const;

function DetailedBreakdown({ farm }: { farm: Farm }) {
  const { detail } = farm;
  const maxFieldTotal = Math.max(...detail.fields.map((f) => f.total), 1);
  const farmArea = detail.fields.reduce((s, f) => s + f.areaHa, 0);
  const fieldsTotal = detail.fields.reduce((s, f) => s + f.total, 0);
  const avgPerHa = farmArea > 0 ? fieldsTotal / farmArea : 0;

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">By gas</p>
        <div className="space-y-1.5">
          {GAS_ROWS.map(({ key, label }) => {
            const value = detail[key];
            const zero = value === 0;
            return (
              <div
                key={key}
                className={`flex items-center justify-between text-sm ${zero ? "text-slate-300" : "text-slate-700"}`}
              >
                <span>{label}</span>
                <span className={zero ? "" : "font-semibold text-slate-800"}>
                  {value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">By field</p>
        <div className="space-y-2">
          {detail.fields.map((field) => {
            const perHa = field.areaHa > 0 ? field.total / field.areaHa : 0;
            const hotspot = avgPerHa > 0 && perHa >= avgPerHa * 1.5;
            return (
              <div
                key={field.label}
                className={`rounded-lg border p-2.5 ${
                  hotspot ? "border-red-200 bg-red-50/70" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">
                    {field.label}
                    <span className="ml-1.5 font-normal text-slate-500">
                      {field.crop} · {field.areaHa} ha
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    {hotspot && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        Hotspot
                      </span>
                    )}
                    {field.total.toFixed(1)} t
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${hotspot ? "bg-red-400" : "bg-emerald-500"}`}
                    style={{ width: `${(field.total / maxFieldTotal) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {detail.residueExportsN2O > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
              <span className="text-slate-600">Crop residue exports (N₂O)</span>
              <span className="font-semibold text-slate-800">{detail.residueExportsN2O.toFixed(1)} t</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400">Source: Holos whole-farm emission model</p>
    </div>
  );
}

function EmissionsBreakdown({ farm }: { farm: Farm }) {
  const [showDetail, setShowDetail] = useState(false);
  const { soilCarbon } = farm.breakdown;
  // Gross = emission sources only; a negative soil carbon value is a removal
  // (sink) and is shown against gross rather than inside the bar.
  const gross = farm.breakdown.n2o + farm.breakdown.energy + Math.max(soilCarbon, 0);
  const pct = (v: number) => (gross > 0 ? (v / gross) * 100 : 0);
  const isSink = soilCarbon < 0;
  const net = gross + soilCarbon;

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
        {BREAKDOWN_SEGMENTS.map(({ key, color }) => {
          const value = farm.breakdown[key];
          if (value <= 0) return null;
          return <div key={key} style={{ width: `${pct(value)}%`, backgroundColor: color }} />;
        })}
      </div>
      <div className="mt-3 space-y-2">
        {BREAKDOWN_SEGMENTS.map(({ key, label, color }) => {
          const value = farm.breakdown[key];
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-slate-600">
                {label}
                {key === "soilCarbon" && isSink && (
                  <span className="ml-1 text-xs font-semibold text-emerald-600">removal</span>
                )}
              </span>
              <span className="ml-auto font-semibold text-slate-800">
                {value < 0 ? "−" : ""}
                {Math.abs(value).toLocaleString()} t
              </span>
              <span className="w-12 text-right text-slate-400">{pct(value).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      {isSink && (
        <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-800">
          Soil is a modest carbon sink — offsets ~{Math.round((-soilCarbon / gross) * 100)}% of
          gross emissions. Net ≈ {Math.round(net).toLocaleString()} t CO{"₂"}e/yr.
          {farm.carbonNote && (
            <span className="mt-1 block text-emerald-700/80">{farm.carbonNote}</span>
          )}
        </div>
      )}
      {soilCarbon === 0 && (
        <p className="mt-2 text-xs text-slate-400">Soil carbon change is a placeholder (0 t).</p>
      )}

      <button
        onClick={() => setShowDetail(!showDetail)}
        className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
      >
        {showDetail ? "Hide" : "Show"} detailed breakdown
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${showDetail ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showDetail && <DetailedBreakdown farm={farm} />}
    </div>
  );
}

function RotationGrid({ farm }: { farm: Farm }) {
  const cropsPresent = [...new Set(farm.rotation.flatMap((f) => f.crops))];
  const maxYears = Math.max(...farm.rotation.map((f) => f.crops.length));

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {cropsPresent.map((crop) => {
          const style = CROP_STYLES[crop] ?? FALLBACK_CROP_STYLE;
          return (
            <span key={crop} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span
                className="flex h-4 w-4 items-center justify-center rounded font-bold"
                style={{ backgroundColor: style.bg, color: style.text, fontSize: "9px" }}
              >
                {style.abbr}
              </span>
              {crop}
              {"pulse" in style && style.pulse && <span className="text-emerald-600">·&thinsp;pulse</span>}
            </span>
          );
        })}
      </div>

      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Rotation sequence, year 1 → {maxYears}
      </p>

      {/* One row per field: colored year-sequence */}
      <div className="space-y-1">
        {farm.rotation.map((field) => (
          <div key={field.label} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-[11px] font-bold text-slate-500">{field.label}</span>
            <div className="flex flex-1 gap-0.5">
              {field.crops.map((crop, year) => {
                const style = CROP_STYLES[crop] ?? FALLBACK_CROP_STYLE;
                return (
                  <span
                    key={year}
                    title={`Year ${year + 1}: ${crop}`}
                    className="flex h-6 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: style.bg,
                      color: style.text,
                      width: `${100 / maxYears}%`,
                    }}
                  >
                    {style.abbr}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] text-slate-400">
        Pulses (lentils, peas) fix nitrogen and reduce fertilizer demand in following years.
      </p>
    </div>
  );
}

const TEXTURE_SEGMENTS = [
  { key: "sandPct", label: "Sand", color: "#eac785" },
  { key: "siltPct", label: "Silt", color: "#c99e63" },
  { key: "clayPct", label: "Clay", color: "#8b5e3c" },
] as const;

function SoilCard({ farm }: { farm: Farm }) {
  const { soil } = farm;
  const textureTotal = soil.sandPct + soil.siltPct + soil.clayPct;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex h-3.5 w-full overflow-hidden rounded-full">
        {TEXTURE_SEGMENTS.map(({ key, color }) => (
          <div
            key={key}
            style={{ width: `${(soil[key] / textureTotal) * 100}%`, backgroundColor: color }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-4">
        {TEXTURE_SEGMENTS.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
            {label} {soil[key]}%
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <span className="text-slate-500">Organic carbon</span>
        <span className="text-right font-semibold text-slate-800">{soil.organicCarbonPct}%</span>
        <span className="text-slate-500">pH</span>
        <span className="text-right font-semibold text-slate-800">{soil.ph.toFixed(1)}</span>
        <span className="text-slate-500">Soil zone</span>
        <span className="text-right font-semibold text-slate-800">{soil.zone}</span>
        <span className="text-slate-500">Topsoil depth</span>
        <span className="text-right font-semibold text-slate-800">{soil.topsoilCm} cm</span>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Observed: "bg-emerald-100 text-emerald-700",
  Documented: "bg-sky-100 text-sky-700",
  Representative: "bg-indigo-100 text-indigo-700",
  Estimated: "bg-amber-100 text-amber-700",
};

function ProvenanceList({ farm }: { farm: Farm }) {
  return (
    <div className="space-y-2">
      {farm.provenance.map((row) => {
        const isUncertain = /largest source of uncertainty/i.test(row.note ?? "");
        return (
          <div
            key={row.input}
            className={`rounded-lg border p-3 ${
              isUncertain ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{row.input}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  STATUS_STYLES[row.status] ?? STATUS_STYLES.Estimated
                }`}
              >
                {row.status}
              </span>
            </div>
            {row.note && (
              <p
                className={`mt-1 text-xs ${
                  isUncertain ? "font-medium text-amber-700" : "text-slate-500"
                }`}
              >
                {isUncertain && "⚠ "}
                {row.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  farm: Farm;
  onClose: () => void;
}

export default function DetailPanel({ farm, onClose }: Props) {
  const farmArea = farm.detail.fields.reduce((s, f) => s + f.areaHa, 0);
  const fieldCount = farm.detail.fields.length;
  const analysis = getRotationAnalysis(farm);
  const [tab, setTab] = useState<"emissions" | "rotation">("emissions");
  return (
    <aside
      key={farm.id}
      className="absolute left-0 top-0 z-[1100] flex h-full w-[400px] max-w-full flex-col bg-white shadow-2xl animate-[panel-in_0.3s_ease-out]"
    >
      {/* Header */}
      <div className="border-b border-slate-100 px-5 pb-5 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              {farm.name}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {farm.location} · {farmArea.toLocaleString()} ha ·{" "}
              {fieldCount === 1 ? "1 field" : `${fieldCount} fields`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {analysis ? (
          <div className="mt-2.5 flex gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ["emissions", "Emissions"],
                ["rotation", "Crop rotation analysis"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition ${
                  tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${
              farm.isReal ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {farm.isReal ? "Demo farm — real Holos run" : "Sample data"}
          </span>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
              {farm.totalEmissions.toLocaleString()} t CO{"₂"}e
            </p>
            <p className="mt-1 text-sm text-slate-500">
              ~{farm.intensity.toFixed(2)} t CO{"₂"}e per hectare
            </p>
          </div>
          <span className="rounded-lg bg-[#0c1b33] px-3 py-1.5 text-xs font-bold text-white">
            PCAF Score {farm.pcafScore}
          </span>
        </div>
      </div>

      {/* Accordion */}
      <div className="flex-1 overflow-y-auto">
        {analysis && tab === "rotation" ? (
          <RotationAnalysisTab analysis={analysis} />
        ) : (
          <>
        <Section title="Emissions breakdown" defaultOpen>
          <EmissionsBreakdown farm={farm} />
        </Section>
        <Section title="Crop rotation">
          <RotationGrid farm={farm} />
        </Section>
        <Section title="Practices">
          <div className="flex flex-wrap gap-2">
            {farm.practices.map((p) => (
              <span
                key={p}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                {p}
              </span>
            ))}
          </div>
        </Section>
        {farm.ndviEvidence && (
          <Section title="Satellite verification">
            <NdviEvidence />
          </Section>
        )}
        <Section title="Soil">
          <SoilCard farm={farm} />
        </Section>
        <Section title="Data provenance">
          <ProvenanceList farm={farm} />
        </Section>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <button
          onClick={() => exportFarmReport(farm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18a058] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148c4c]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export emissions report (.xlsx)
        </button>
      </div>
    </aside>
  );
}
