import { useMemo } from "react";
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
  likely: { label: "Likely match", cls: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partial", cls: "bg-amber-100 text-amber-700" },
  info: { label: "Info", cls: "bg-slate-100 text-slate-600" },
};

// Cost-share summary comes from the program record only. No arithmetic.
function costShareSummary(program: FundingProgram, category: FundingCategory): string | null {
  const entry = program.costShare[category];
  if (entry) {
    if (entry.pct !== undefined) {
      const pct = entry.pctNewApplicant !== undefined ? `${entry.pct}-${entry.pctNewApplicant}%` : `${entry.pct}%`;
      const cap = entry.perProjectCapCAD !== undefined ? `, up to $${entry.perProjectCapCAD.toLocaleString("en-CA")} per project` : "";
      return `${pct} cost share${cap}`;
    }
    if (entry.equipmentCapCAD !== undefined) {
      return `Equipment cost share, up to $${entry.equipmentCapCAD.toLocaleString("en-CA")}. ${entry.note ?? ""}`.trim();
    }
    if (entry.note) return entry.note;
  }
  return program.costShare.program_pool?.note ?? null;
}

export default function FundingCard({ farm }: { farm: Farm }) {
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

  return (
    <div className="space-y-3">
      {[...byProgram.entries()].map(([programId, programMatches]) => {
        const program = FUNDING_PROGRAMS.find((p) => p.id === programId)!;
        return (
          <div key={programId} className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-sm font-semibold text-slate-900">{program.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{program.deliveryOrg}</p>

            <div className="mt-2.5 space-y-2.5">
              {programMatches.map((match) => {
                const strength = STRENGTH_STYLES[match.strength];
                const costShare = costShareSummary(program, match.category);
                return (
                  <div key={match.category} className="border-l-2 border-slate-100 pl-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {CATEGORY_LABELS[match.category]}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${strength.cls}`}>
                        {strength.label}
                      </span>
                    </div>
                    {costShare && <p className="mt-1 text-xs font-medium text-slate-700">{costShare}</p>}
                    {match.reasons.map((reason) => (
                      <p key={reason} className="mt-1 text-xs leading-relaxed text-slate-500">
                        {reason}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                {program.status.label} · as of {program.status.asOf}
              </p>
              <a
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Program page ↗
              </a>
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800">
        OFCAF intakes are first come, first served and have filled within hours. The program ends
        March 2028.
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Estimates based on public program information as of {ASSUMPTIONS.display.asOf}. Eligibility
        is determined by delivery organizations. Cost-share maximums are program caps, not
        guarantees. Federal cap of $100,000 per farm business applies across all OFCAF funding,
        2022-2028.
      </p>
    </div>
  );
}
