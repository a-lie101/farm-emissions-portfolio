import { useMemo, useState } from "react";
import { ASSUMPTIONS } from "../config/assumptions";
import { FUNDING_PROGRAMS, type FundingCategory, type FundingProgram } from "../data/fundingPrograms";
import { matchFundingPrograms, type FundingMatch } from "../lib/matchFundingPrograms";
import type { Farm } from "../data/farms";

const CATEGORY_LABELS: Record<FundingCategory, string> = {
  nitrogen_management: "Nitrogen management",
  cover_cropping: "Cover cropping",
  rotational_grazing: "Rotational grazing",
};

const STRENGTH_STYLES: Record<FundingMatch["strength"], { label: string; cls: string }> = {
  likely: { label: "Likely", cls: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partial", cls: "bg-amber-100 text-amber-700" },
  info: { label: "Info", cls: "bg-slate-100 text-slate-600" },
};

// Short money fact for the collapsed row. Program facts only, no arithmetic.
function costShareShort(program: FundingProgram, category: FundingCategory): string | null {
  const entry = program.costShare[category];
  if (!entry) return null;
  if (entry.pct !== undefined) {
    const pct = entry.pctNewApplicant !== undefined ? `${entry.pct}-${entry.pctNewApplicant}%` : `${entry.pct}%`;
    const cap =
      entry.perProjectCapCAD !== undefined
        ? ` · up to $${entry.perProjectCapCAD.toLocaleString("en-CA")}/project`
        : "";
    return `${pct} cost share${cap}`;
  }
  if (entry.equipmentCapCAD !== undefined) {
    return `Equipment · up to $${entry.equipmentCapCAD.toLocaleString("en-CA")}`;
  }
  return null;
}

// Longer note for the expanded row.
function costShareNote(program: FundingProgram, category: FundingCategory): string | null {
  return program.costShare[category]?.note ?? program.costShare.program_pool?.note ?? null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryRow({
  match,
  program,
}: {
  match: FundingMatch;
  program: FundingProgram;
}) {
  const [open, setOpen] = useState(false);
  const strength = STRENGTH_STYLES[match.strength];
  const short = costShareShort(program, match.category);
  const note = costShareNote(program, match.category);

  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">{CATEGORY_LABELS[match.category]}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${strength.cls}`}>
              {strength.label}
            </span>
          </span>
          {short && <span className="mt-0.5 block text-[11px] font-medium text-emerald-700">{short}</span>}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="pb-2.5 pr-5">
          {match.reasons.map((reason) => (
            <p key={reason} className="text-[11px] leading-relaxed text-slate-500">
              {reason}
            </p>
          ))}
          {note && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{note}</p>}
        </div>
      )}
    </div>
  );
}

export default function FundingCard({ farm }: { farm: Farm }) {
  const [showDetails, setShowDetails] = useState(false);
  const matches = useMemo(() => matchFundingPrograms(farm, FUNDING_PROGRAMS, ASSUMPTIONS), [farm]);

  const byProgram = useMemo(() => {
    const map = new Map<string, FundingMatch[]>();
    for (const match of matches) {
      if (!map.has(match.programId)) map.set(match.programId, []);
      map.get(match.programId)!.push(match);
    }
    return map;
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div>
        <p className="text-sm text-slate-500">No funding matches found for this farm's profile.</p>
        <a
          href="https://agriculture.canada.ca/en/programs/agricultural-climate-solutions-farm-climate-action-fund"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          About the On-Farm Climate Action Fund ↗
        </a>
      </div>
    );
  }

  const likelyCount = matches.filter((m) => m.strength === "likely").length;
  const totalCount = matches.length;

  return (
    <div>
      {/* The scannable verdict */}
      <p className="text-sm text-slate-700">
        This farm looks eligible for OFCAF cost-share in{" "}
        <span className="font-semibold text-slate-900">
          {likelyCount} of {totalCount}
        </span>{" "}
        matched categories.
      </p>

      <div className="mt-3 space-y-3">
        {[...byProgram.entries()].map(([programId, programMatches]) => {
          const program = FUNDING_PROGRAMS.find((p) => p.id === programId)!;
          return (
            <div key={programId} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{program.name}</p>
                  <p className="truncate text-[10px] text-slate-400">{program.deliveryOrg}</p>
                </div>
                <a
                  href={program.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Program ↗
                </a>
              </div>
              {programMatches.map((match) => (
                <CategoryRow key={match.category} match={match} program={program} />
              ))}
            </div>
          );
        })}
      </div>

      {/* The lender talking point, one line */}
      <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-800">
        <span aria-hidden>⏱</span>
        Intakes are first come, first served and have filled in hours. Program ends March 2028.
      </p>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-2.5 flex items-center gap-1 text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
      >
        Requirements and fine print
        <Chevron open={showDetails} />
      </button>
      {showDetails && (
        <div className="mt-2 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          {[...byProgram.keys()].map((programId) => {
            const program = FUNDING_PROGRAMS.find((p) => p.id === programId)!;
            return (
              <div key={programId}>
                <ul className="space-y-1">
                  {program.keyRequirements.map((req) => (
                    <li key={req} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600">
                      <span className="text-slate-400" aria-hidden>
                        ·
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {program.status.label} · as of {program.status.asOf}
                </p>
              </div>
            );
          })}
          <p className="border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-400">
            Estimates based on public program information as of {ASSUMPTIONS.display.asOf}.
            Eligibility is determined by delivery organizations. Cost-share maximums are program
            caps, not guarantees. Federal cap of $100,000 per farm business applies across all OFCAF
            funding, 2022-2028.
          </p>
        </div>
      )}
    </div>
  );
}
