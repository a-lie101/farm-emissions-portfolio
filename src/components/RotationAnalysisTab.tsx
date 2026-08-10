import { useState, type ReactNode } from "react";
import { cropStyle } from "../data/cropStyles";
import type { DiseaseRuleResult, RotationAnalysis } from "../lib/rotationEngine";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-CA");
const perAcre = (v: number) => "$" + v.toFixed(2);

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

function CropChip({ crop, size = "md" }: { crop: string; size?: "sm" | "md" }) {
  const style = cropStyle(crop);
  return (
    <span
      title={crop}
      className={`flex items-center justify-center rounded font-bold ${
        size === "sm" ? "h-5 text-[9px]" : "h-6 text-[10px]"
      }`}
      style={{ backgroundColor: style.bg, color: style.text, flex: "1 1 0" }}
    >
      {style.abbr}
    </span>
  );
}

function HistoryStrip({ analysis }: { analysis: RotationAnalysis }) {
  const { history } = analysis;
  const cropsPresent = [...new Set(history.map((h) => h.crop))];

  return (
    <div>
      <div className="flex gap-0.5">
        {history.map((entry) => (
          <div key={entry.year} className="flex flex-1 flex-col items-center gap-0.5">
            <CropChip crop={entry.crop} />
            <span className="text-[9px] tabular-nums text-slate-400">
              {String(entry.year).slice(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {cropsPresent.map((crop) => {
          const style = cropStyle(crop);
          return (
            <span key={crop} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-[8px] font-bold"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {style.abbr}
              </span>
              {crop}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SequenceRow({ label, crops, muted }: { label: string; crops: string[]; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-24 shrink-0 text-[11px] font-semibold ${muted ? "text-slate-400" : "text-slate-700"}`}
      >
        {label}
      </span>
      <div className={`flex flex-1 gap-0.5 ${muted ? "opacity-60" : ""}`}>
        {crops.map((crop, i) => (
          <CropChip key={i} crop={crop} size="sm" />
        ))}
      </div>
    </div>
  );
}

const VERDICT_TONE: Record<DiseaseRuleResult["verdict"], string> = {
  FAIL: "text-red-600",
  WARN: "text-amber-600",
  PASS: "text-emerald-600",
  UNKNOWN: "text-slate-400",
};

function RuleRow({ rule }: { rule: DiseaseRuleResult }) {
  const gap = rule.observedInterval;
  const interval =
    gap === null
      ? "not measurable"
      : rule.verdict === "FAIL"
        ? `${gap} yr apart, needs ${rule.minimumInterval}`
        : rule.verdict === "WARN"
          ? `${gap} yr apart, prefers ${rule.preferredInterval}`
          : `${gap} yr apart, clear`;
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="min-w-0 text-[11px] text-slate-600">
        {rule.short}
        {!rule.binding && <span className="ml-1 text-slate-400">· advisory</span>}
      </span>
      <span className={`shrink-0 text-[11px] font-semibold ${VERDICT_TONE[rule.verdict]}`}>
        {interval}
      </span>
    </div>
  );
}

export default function RotationAnalysisTab({ analysis }: { analysis: RotationAnalysis }) {
  const { nitrogen, disease, yieldRisk } = analysis;
  const bindingBroken = disease.rules.filter((r) => r.binding && r.verdict === "FAIL");

  return (
    <div className="space-y-4 px-5 py-4">
      {/* What we read */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-sm font-bold text-slate-800">Rotation as read</h3>
          <span className="text-[11px] text-slate-400">
            {analysis.fieldId} · {analysis.acres.toLocaleString()} acres
          </span>
        </div>
        <HistoryStrip analysis={analysis} />
      </div>

      {/* What to do next */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <h3 className="mb-2.5 font-display text-sm font-bold text-slate-800">
          {!analysis.alreadyOptimal
            ? "Recommended order"
            : analysis.observedViolations > 0
              ? "Reordering will not fix this"
              : "No reordering needed"}
        </h3>
        <div className="space-y-1.5">
          <SequenceRow label="As grown" crops={analysis.observedSequence} muted />
          <SequenceRow label="Recommended" crops={analysis.recommendedSequence} />
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{analysis.why}</p>
      </div>

      {/* Nitrogen */}
      <Disclosure
        title="Nitrogen already captured"
        pill={nitrogen.arrangedWell ? "Arranged well" : `${nitrogen.wastedLb} lb/ac missed`}
        tone={nitrogen.arrangedWell ? "green" : "amber"}
      >
        <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
          {perAcre(nitrogen.capturedValuePerAc)}
          <span className="ml-1 text-base font-bold text-slate-500">per acre</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {money(nitrogen.capturedValueField)} across the field · {nitrogen.capturedLb} lb/ac of
          nitrogen at {perAcre(nitrogen.pricePerLb)}/lb
        </p>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{nitrogen.explanation}</p>

        {nitrogen.transitions
          .filter((t) => t.capturedLb > 0)
          .map((t) => (
            <p key={t.year} className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs leading-relaxed text-emerald-800">
              <span className="font-semibold">{t.year}:</span> {t.why}
            </p>
          ))}

        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">{nitrogen.caveat}</p>
      </Disclosure>

      {/* Disease */}
      <Disclosure
        title="Disease risk"
        pill={
          disease.clean
            ? "Clear"
            : `${bindingBroken.length} rule${bindingBroken.length === 1 ? "" : "s"} broken`
        }
        tone={disease.clean ? "green" : "red"}
      >
        <p className="text-sm leading-relaxed text-slate-700">{disease.headline}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{disease.explanation}</p>

        <div className="mt-2.5 divide-y divide-slate-100 border-t border-slate-100 pt-1">
          {disease.rules.map((rule) => (
            <RuleRow key={rule.pathogen} rule={rule} />
          ))}
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
          Binding rules decide what is possible. Advisory rules warn only, because airborne spores
          arrive whatever you grow.
        </p>
      </Disclosure>

      {/* Yield */}
      <Disclosure
        title="Yield risk"
        pill={
          yieldRisk.tightYears
            ? `Tight in ${yieldRisk.tightYears} of ${yieldRisk.windowYears}`
            : "No charge"
        }
        tone={yieldRisk.tightYears ? "amber" : "green"}
      >
        {yieldRisk.tightYears > 0 ? (
          <>
            <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
              {perAcre(yieldRisk.passPerAcre)}
              <span className="ml-1 text-base font-bold text-slate-500">per acre</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {money(yieldRisk.fieldTotalPerPass)} across the field, in each year the rotation is
              tight. {yieldRisk.tightYears} of the last {yieldRisk.windowYears} years{" "}
              {yieldRisk.tightYears === 1 ? "qualifies" : "qualify"}.
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{yieldRisk.basis}</p>
            {yieldRisk.charges.map((c) => (
              <p key={c.year} className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-800">
                <span className="font-semibold">{c.year}:</span> {c.crop} came back after{" "}
                {c.observed} years where {c.required} are recommended, so a fungicide pass is
                charged against it.
              </p>
            ))}
          </>
        ) : (
          <p className="text-sm text-slate-600">{yieldRisk.headline}</p>
        )}
        <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{yieldRisk.scoutingNote}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{yieldRisk.doNotSum}</p>
      </Disclosure>

      {/* Provenance, quiet by default */}
      <Disclosure title="Where this comes from" tone="slate" defaultOpen={false}>
        <p className="text-xs leading-relaxed text-slate-600">{analysis.sourceNote}</p>
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
        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
          Fertiliser actually applied is unobserved, so the nitrogen figure is a contribution, not a
          measured saving. One field cannot prove a different rotation would have done better,
          because the alternative was never grown here.
        </p>
      </Disclosure>
    </div>
  );
}
