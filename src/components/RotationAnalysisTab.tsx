import { useState, type ReactNode } from "react";
import { cropStyle } from "../data/cropStyles";
import type { RotationAnalysis } from "../lib/rotationEngine";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-CA");
const perAcre = (v: number) => "$" + v.toFixed(2);

const listAnd = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function Disclosure({
  title,
  pill,
  tone,
  defaultOpen = true,
  children,
}: {
  title: string;
  pill?: string;
  tone: "green" | "red" | "amber" | "slate";
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pillCls = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <span className="font-display text-sm font-bold text-slate-800">{title}</span>
        {pill && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pillCls}`}>{pill}</span>
        )}
        <svg
          viewBox="0 0 24 24"
          className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-slate-100 px-3.5 py-3">{children}</div>}
    </div>
  );
}

// Full crop names with arrows between them. Wraps rather than truncates.
function SequenceRow({ label, crops, muted }: { label: string; crops: string[]; muted?: boolean }) {
  return (
    <div>
      <p
        className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${
          muted ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div className={`flex flex-wrap items-center gap-x-1 gap-y-1 ${muted ? "opacity-70" : ""}`}>
        {crops.map((crop, i) => {
          const style = cropStyle(crop);
          return (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-xs text-slate-300">→</span>}
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {crop}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function RotationAnalysisTab({ analysis }: { analysis: RotationAnalysis }) {
  const { nitrogen, disease, yieldRisk } = analysis;
  const broken = disease.rules.filter((r) => r.binding && r.verdict === "FAIL");
  const tightCropList = [...new Set(yieldRisk.charges.map((c) => c.crop))];
  const tightCrops = listAnd(tightCropList);

  // When a reordering is on screen, the nitrogen line describes what that
  // reordering does to the credit rather than restating the transition.
  const showsReorder = !analysis.alreadyOptimal && nitrogen.bestPossibleLb > 0;
  const bestValueField = nitrogen.bestPossibleLb * nitrogen.pricePerLb * analysis.acres;
  const headlinePerAc =
    nitrogen.wastedLb > 0
      ? nitrogen.bestPossibleLb * nitrogen.pricePerLb
      : nitrogen.capturedValuePerAc;

  return (
    <div className="space-y-4 px-5 py-4">
      {/* The rotation, current and suggested */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h3 className="font-display text-sm font-bold text-slate-800">5 year analysis</h3>
          <span className="text-[11px] text-slate-400">
            {analysis.fieldId && `${analysis.fieldId} · `}
            {analysis.acres.toLocaleString()} acres
          </span>
        </div>
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <SequenceRow
            label={analysis.alreadyOptimal ? "Rotation" : "As grown"}
            crops={analysis.observedSequence}
            muted={!analysis.alreadyOptimal}
          />
          {!analysis.alreadyOptimal && (
            <SequenceRow label="Recommended sequence" crops={analysis.recommendedSequence} />
          )}
        </div>
      </div>

      {/* Money already earned */}
      <Disclosure
        title="Nitrogen saved"
        pill={
          nitrogen.capturedLb === 0 ? "None" : nitrogen.arrangedWell ? "Arranged well" : "Could be better"
        }
        tone={nitrogen.capturedLb === 0 ? "slate" : nitrogen.arrangedWell ? "green" : "amber"}
      >
        {nitrogen.bestPossibleLb > 0 ? (
          <>
            <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
              {perAcre(headlinePerAc)}
              <span className="ml-1.5 text-base font-bold text-slate-500">per acre</span>
            </p>
            {showsReorder ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {nitrogen.wastedLb > 0
                  ? `The same crops, reordered, satisfy the disease rules and place the pulse nitrogen ahead of a crop that buys fertiliser — about ${money(bestValueField)} of fertiliser-equivalent value, subject to soil testing.`
                  : `The same crops, reordered, satisfy the disease rules while preserving the full pulse nitrogen contribution of about ${money(nitrogen.capturedValueField)}.`}
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-xs text-slate-500">
                  {money(nitrogen.capturedValueField)} across the field
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                  {nitrogen.creditCrop} left a {nitrogen.capturedLb} lb/ac nitrogen credit for the{" "}
                  {nitrogen.creditFollower?.toLowerCase()} that followed.
                </p>
              </>
            )}
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            Nothing in this rotation leaves nitrogen behind. Adding a pulse crop such as peas or
            lentils is what creates this saving.
          </p>
        )}
      </Disclosure>

      {/* What is wrong */}
      <Disclosure
        title="Disease risk"
        pill={broken.length ? `${broken.length} problem${broken.length === 1 ? "" : "s"}` : "Clear"}
        tone={broken.length ? "red" : "green"}
      >
        {broken.length ? (
          <>
            <p className="text-xs leading-relaxed text-slate-700">
              {disease.plainCause}
            </p>
            <div className="mt-2.5 space-y-1.5">
              {broken.map((rule) => (
                <div key={rule.pathogen} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{rule.short}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">{rule.publisher}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            Every crop is spaced far enough apart to keep the main rotation diseases down.
          </p>
        )}
      </Disclosure>

      {/* What it costs */}
      <Disclosure
        title="Yield risk"
        pill={
          yieldRisk.tightYears
            ? `${yieldRisk.tightYears} of ${yieldRisk.windowYears} years tight`
            : "Clear"
        }
        tone={yieldRisk.tightYears ? "amber" : "green"}
      >
        {yieldRisk.tightYears > 0 ? (
          <>
            <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
              {perAcre(yieldRisk.passPerAcre)}
              <span className="ml-1.5 text-base font-bold text-slate-500">per acre</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {money(yieldRisk.fieldTotalPerPass)} across the field, in each tight year
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
              Fungicide pass budgeted for tight{" "}
              {tightCropList.length === 1 ? tightCrops.toLowerCase() : "rotation"} years. Yield loss
              itself requires field scouting to quantify.
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            No extra fungicide pass is expected from the way this rotation is spaced.
          </p>
        )}
      </Disclosure>

      {/* Quiet by default */}
      <Disclosure title="Where this comes from" tone="slate" defaultOpen={false}>
        <p className="text-xs leading-relaxed text-slate-600">{analysis.sourceNote}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{nitrogen.caveat}</p>
        <ul className="mt-2 space-y-1">
          {[...new Map(disease.rules.map((r) => [r.publisher, r])).values()].map((rule) => (
            <li key={rule.publisher}>
              <a
                href={rule.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
              >
                {rule.publisher} ↗
              </a>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}
