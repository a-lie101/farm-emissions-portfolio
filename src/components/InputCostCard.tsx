import { useState } from "react";
import { ASSUMPTIONS } from "../config/assumptions";
import { inputCostOpportunity } from "../lib/inputCostOpportunity";
import { formatCAD } from "../utils/format";
import type { Farm } from "../data/farms";

export default function InputCostCard({ farm }: { farm: Farm }) {
  const [showBasis, setShowBasis] = useState(false);
  const result = inputCostOpportunity(farm, ASSUMPTIONS);

  if (!result) {
    return (
      <p className="text-sm text-slate-500">Not enough data to estimate input costs for this farm.</p>
    );
  }

  const { nitrogen } = ASSUMPTIONS;
  const pctCentral = Math.round(nitrogen.overApplicationFraction * 100);
  const pctLow = Math.round(nitrogen.overApplicationFractionLow * 100);
  const pctHigh = Math.round(nitrogen.overApplicationFractionHigh * 100);

  return (
    <div>
      <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
        {formatCAD(result.recoverableCostCAD)} per year
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        Range {formatCAD(result.recoverableCostLowCAD)} to {formatCAD(result.recoverableCostHighCAD)}
      </p>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-semibold">{formatCAD(result.recoverablePerHaCAD)} per hectare</span> in
        potentially recoverable nitrogen spend
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Cutting this waste also avoids an estimated{" "}
        <span className="font-semibold text-slate-800">{Math.round(result.coBenefitTCO2e)} t CO{"₂"}e</span>{" "}
        per year.
      </p>

      <button
        onClick={() => setShowBasis(!showBasis)}
        className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
      >
        How this is estimated
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${showBasis ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showBasis && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-600">
          <p>
            Nitrogen use is estimated from yield and modeled emissions. We assume {pctCentral}% of
            applied nitrogen (range {pctLow}-{pctHigh}%) is recoverable through improved rate,
            timing, and placement, based on precision agriculture research. Fertilizer priced at $
            {nitrogen.pricePerKgCAD.toFixed(2)}/kg N from 2026 provincial crop planning figures.
          </p>
          {result.nAppliedDerived && (
            <p className="mt-1.5 text-slate-500">Nitrogen use for this farm is derived, not reported.</p>
          )}
        </div>
      )}
    </div>
  );
}
