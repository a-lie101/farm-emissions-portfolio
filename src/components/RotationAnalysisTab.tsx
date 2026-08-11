import { useState, type ReactNode } from "react";
import { cropStyle } from "../data/cropStyles";
import type { RotationAnalysis } from "../lib/rotationEngine";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-CA");
const perAcre = (v: number) => "$" + v.toFixed(2);

function Disclosure({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <span className="font-display text-sm font-bold text-slate-800">{title}</span>
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

// Per-acre and whole-field figures carry equal weight, so a reader can take
// either one depending on whether they think in rates or in totals.
function StatPair({
  perAcreValue,
  fieldValue,
  fieldLabel = "across the field",
}: {
  perAcreValue: number;
  fieldValue: number;
  fieldLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
      <div>
        <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
          {perAcre(perAcreValue)}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">per acre</p>
      </div>
      {/* Reads as the per acre rate scaling up to the whole field. */}
      <span aria-hidden className="mt-1.5 text-lg text-slate-300">
        →
      </span>
      <div>
        <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
          {money(fieldValue)}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{fieldLabel}</p>
      </div>
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

  const showsReorder = !analysis.alreadyOptimal && nitrogen.bestPossibleLb > 0;
  // Where the pulse is currently wasted, the figure is what reordering would
  // recover. Where it is already captured, it is what the order protects.
  const savingsPerAc =
    nitrogen.wastedLb > 0
      ? nitrogen.bestPossibleLb * nitrogen.pricePerLb
      : nitrogen.capturedValuePerAc;
  const savingsField = savingsPerAc * analysis.acres;

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

      {/* Money on the table */}
      <Disclosure title="Potential savings on nitrogen">
        {nitrogen.bestPossibleLb > 0 ? (
          <>
            <StatPair perAcreValue={savingsPerAc} fieldValue={savingsField} />
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {showsReorder ? (
                <>
                  The same crops reordered according to best practices will lead to nitrogen
                  fertilizer savings of{" "}
                  <span className="font-semibold text-slate-800">
                    {perAcre(savingsPerAc)} per acre
                  </span>{" "}
                  while still following the disease-prevention rules at the same time.
                </>
              ) : (
                <>
                  This sequence already captures nitrogen fertilizer savings of{" "}
                  <span className="font-semibold text-slate-800">
                    {perAcre(savingsPerAc)} per acre
                  </span>
                  , with the pulse crop placed ahead of a crop that buys fertiliser.
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            Nothing in this rotation leaves nitrogen behind. Adding a pulse crop such as peas or
            lentils is what creates this saving.
          </p>
        )}
      </Disclosure>

      {/* What the sequencing exposes the field to */}
      <Disclosure title="Disease risk">
        {broken.length ? (
          <>
            <p className="text-xs leading-relaxed text-slate-600">
              Given the sequencing of crops, there is an increased risk for the following diseases
              on this field:
            </p>
            <div className="mt-2.5 space-y-1.5">
              {broken.map((rule) => (
                <div key={rule.pathogen} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{rule.short}</span>
                  <a
                    href={rule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11px] text-slate-400 underline decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-400"
                  >
                    {rule.publisher}
                  </a>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            The sequencing of crops keeps every host far enough apart to avoid raising disease risk.
          </p>
        )}
      </Disclosure>

      {/* What that risk costs */}
      <Disclosure title="Potential savings on fungicide">
        {yieldRisk.tightYears > 0 ? (
          <>
            <StatPair
              perAcreValue={yieldRisk.passPerAcre}
              fieldValue={yieldRisk.fieldTotalPerPass}
              fieldLabel="across the field"
            />
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              For years where crops are inside an at risk rotation interval, the cost of an
              additional fungicide pass is{" "}
              <span className="font-semibold text-slate-800">
                {perAcre(yieldRisk.passPerAcre)} per acre
              </span>
              . This applies to {yieldRisk.tightYears} of the last {yieldRisk.windowYears} years.
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600">
            No year in this rotation falls inside an at risk interval, so no additional fungicide
            pass is budgeted.
          </p>
        )}
      </Disclosure>

      {/* Quiet by default */}
      <Disclosure title="Where this comes from" defaultOpen={false}>
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
