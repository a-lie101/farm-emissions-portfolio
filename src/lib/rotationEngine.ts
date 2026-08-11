import { normalizeCrop } from "../data/cropStyles";

// Rotation analysis for a single field.
// Nitrogen and disease are assessed independently, then reconciled.
// Every rule below is a published Manitoba or industry recommendation.
// Sources are carried through to the UI.

export interface RotationYear {
  year: number;
  crop: string;
  lowConfidence?: boolean;
}

export interface NitrogenTransition {
  year: number;
  from: string;
  to: string;
  creditLb: number;
  demandLb: number;
  capturedLb: number;
  why: string;
}

export interface NitrogenAssessment {
  arrangedWell: boolean;
  headline: string;
  explanation: string;
  capturedLb: number;
  capturedValuePerAc: number;
  capturedValueField: number;
  bestPossibleLb: number;
  wastedLb: number;
  wastedValuePerAc: number;
  transitions: NitrogenTransition[];
  pricePerLb: number;
  caveat: string;
  // The pair that actually earned the money, for plain-language copy.
  creditCrop: string | null;
  creditFollower: string | null;
}

export type RuleVerdict = "PASS" | "WARN" | "FAIL" | "UNKNOWN";

export interface DiseaseRuleResult {
  pathogen: string;
  short: string;
  severity: "HARD" | "ADVISORY";
  binding: boolean;
  verdict: RuleVerdict;
  observedInterval: number | null;
  minimumInterval: number;
  preferredInterval: number;
  hostYears: number[];
  hostCrops: string[];
  plain: string;
  publisher: string;
  url: string;
}

export interface DiseaseAssessment {
  clean: boolean;
  headline: string;
  // One sentence a reader with no agronomy background can act on.
  plainCause: string;
  explanation: string;
  broken: string[];
  rules: DiseaseRuleResult[];
}

export interface YieldRisk {
  // One fungicide pass is a single decision, so it is priced per tight year
  // rather than summed across the window. Summing reads as a bill nobody
  // ever receives in one go.
  passPerAcre: number;
  fieldTotalPerPass: number;
  tightYears: number;
  windowYears: number;
  charges: { crop: string; year: number; observed: number; required: number }[];
  headline: string;
  basis: string;
  scoutingNote: string;
  doNotSum: string;
}

export interface RotationAnalysis {
  fieldId: string;
  acres: number;
  history: RotationYear[];
  windowStart: number;
  observedSequence: string[];
  recommendedSequence: string[];
  alreadyOptimal: boolean;
  // Binding breaks the reorderable window is responsible for.
  observedViolations: number;
  why: string;
  nitrogen: NitrogenAssessment;
  disease: DiseaseAssessment;
  yieldRisk: YieldRisk;
  sourceNote: string;
}

// Fertiliser-equivalent nitrogen a crop leaves for the crop that follows, lb/ac.
// Manitoba Soil Fertility Guide. Soybeans carry no credit in Manitoba.
const N_CREDIT: Record<string, number> = {
  Peas: 25,
  Lentils: 20,
  Soybeans: 0,
};

// Budgeted nitrogen demand, lb/ac. Manitoba Cost of Production 2026.
const N_DEMAND: Record<string, number> = {
  Canola: 130,
  Wheat: 110,
  Durum: 110,
  Barley: 90,
  Oats: 80,
  Flax: 70,
  Peas: 0,
  Lentils: 0,
  Soybeans: 0,
};

const PRICE_PER_LB = 0.8184; // marginal urea, $/lb N

// Manitoba's rotation costing adds one fungicide pass to a tight-rotation year.
const FUNGICIDE_PASS_PER_AC = 20.5;

const WINDOW = 5; // years of rotation that can still be reordered

interface PathogenRule {
  pathogen: string;
  short: string;
  hosts: string[];
  minimum: number;
  preferred: number;
  severity: "HARD" | "ADVISORY";
  binding: boolean;
  publisher: string;
  url: string;
}

const PATHOGEN_RULES: PathogenRule[] = [
  {
    pathogen: "Blackleg (Leptosphaeria maculans)",
    short: "Blackleg",
    hosts: ["Canola"],
    minimum: 3,
    preferred: 4,
    severity: "HARD",
    binding: true,
    publisher: "Canola Council of Canada",
    url: "https://www.canolacouncil.org/canola-watch/2020/08/19/blackleg-scouting-identification-and-next-steps/",
  },
  {
    pathogen: "Clubroot (Plasmodiophora brassicae)",
    short: "Clubroot",
    hosts: ["Canola"],
    minimum: 3,
    preferred: 4,
    severity: "HARD",
    binding: true,
    publisher: "Manitoba Agriculture",
    url: "https://www.gov.mb.ca/agriculture/crops/plant-diseases/clubroot-brassica.html",
  },
  {
    pathogen: "Fusarium head blight (F. graminearum)",
    short: "Fusarium head blight",
    hosts: ["Wheat", "Durum", "Barley", "Oats", "Corn"],
    minimum: 2,
    preferred: 3,
    severity: "HARD",
    binding: true,
    publisher: "Manitoba Agriculture",
    url: "https://www.gov.mb.ca/agriculture/crops/plant-diseases/dealing-with-fusarium-head-blight.html",
  },
  {
    pathogen: "Aphanomyces root rot (A. euteiches)",
    short: "Aphanomyces root rot",
    hosts: ["Peas", "Lentils"],
    minimum: 6,
    preferred: 8,
    severity: "HARD",
    binding: true,
    publisher: "Manitoba Pulse & Soybean Growers",
    url: "https://manitobapulse.ca/2025/01/aphanomyces-root-rot-in-peas/",
  },
  {
    pathogen: "Sclerotinia stem rot (S. sclerotiorum)",
    short: "Sclerotinia stem rot",
    hosts: ["Canola", "Peas", "Lentils"],
    minimum: 4,
    preferred: 4,
    severity: "ADVISORY",
    binding: false,
    publisher: "Manitoba Agriculture",
    url: "https://www.gov.mb.ca/agriculture/crops/plant-diseases/sclerotinia-canola.html",
  },
];

const minGap = (years: number[]): number | null => {
  if (years.length < 2) return null;
  const sorted = [...years].sort((a, b) => a - b);
  let smallest = Infinity;
  for (let i = 1; i < sorted.length; i++) smallest = Math.min(smallest, sorted[i] - sorted[i - 1]);
  return smallest;
};

function evaluateRule(rule: PathogenRule, history: RotationYear[]): DiseaseRuleResult {
  const hosts = history.filter((h) => rule.hosts.includes(h.crop));
  const hostYears = hosts.map((h) => h.year);
  const hostCrops = [...new Set(hosts.map((h) => h.crop))];
  const observed = minGap(hostYears);

  let verdict: RuleVerdict;
  let plain: string;
  if (observed === null) {
    verdict = "UNKNOWN";
    plain =
      hostYears.length === 1
        ? "Only one host year on record, so there is no interval to measure."
        : "No host crop in this history, so the rule does not bite.";
  } else if (observed < rule.minimum) {
    verdict = "FAIL";
    plain = "Below the minimum recommended interval.";
  } else if (observed < rule.preferred) {
    verdict = "WARN";
    plain = "Meets the minimum but short of the preferred interval.";
  } else {
    verdict = "PASS";
    plain = "Clears the recommended interval.";
  }

  return {
    pathogen: rule.pathogen,
    short: rule.short,
    severity: rule.severity,
    binding: rule.binding,
    verdict,
    observedInterval: observed,
    minimumInterval: rule.minimum,
    preferredInterval: rule.preferred,
    hostYears,
    hostCrops,
    plain,
    publisher: rule.publisher,
    url: rule.url,
  };
}

// Violations that the window can still do something about. Gaps that sit
// entirely in the past are fixed and are not the reordering's fault.
function windowViolations(history: RotationYear[], windowStart: number): number {
  let count = 0;
  for (const rule of PATHOGEN_RULES) {
    if (!rule.binding) continue;
    const hostYears = history
      .filter((h) => rule.hosts.includes(h.crop))
      .map((h) => h.year)
      .sort((a, b) => a - b);
    for (let i = 1; i < hostYears.length; i++) {
      const touchesWindow = hostYears[i] >= windowStart || hostYears[i - 1] >= windowStart;
      if (touchesWindow && hostYears[i] - hostYears[i - 1] < rule.minimum) count++;
    }
  }
  return count;
}

function nitrogenCapture(sequence: string[], precedingCrop: string | null): number {
  let total = 0;
  for (let i = 0; i < sequence.length; i++) {
    const from = i === 0 ? precedingCrop : sequence[i - 1];
    if (!from) continue;
    total += Math.min(N_CREDIT[from] ?? 0, N_DEMAND[sequence[i]] ?? 0);
  }
  return total;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const key = String(items[i]);
    if (seen.has(key)) continue; // identical crops produce identical orderings
    seen.add(key);
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([items[i], ...tail]);
  }
  return out;
}

const changesFrom = (a: string[], b: string[]) =>
  a.reduce((n, crop, i) => n + (crop === b[i] ? 0 : 1), 0);

export function analyzeRotation(
  fieldId: string,
  acres: number,
  rawHistory: RotationYear[],
  sourceNote: string
): RotationAnalysis {
  const history = rawHistory
    .map((h) => ({ ...h, crop: normalizeCrop(h.crop) }))
    .sort((a, b) => a.year - b.year);

  const window = history.slice(-WINDOW);
  const windowStart = window[0].year;
  const observedSequence = window.map((h) => h.crop);
  const preceding = history[history.length - window.length - 1]?.crop ?? null;

  // --- Nitrogen, ignoring disease -------------------------------------
  const transitions: NitrogenTransition[] = window.map((entry, i) => {
    const from = i === 0 ? preceding : window[i - 1].crop;
    const creditLb = from ? (N_CREDIT[from] ?? 0) : 0;
    const demandLb = N_DEMAND[entry.crop] ?? 0;
    const capturedLb = Math.min(creditLb, demandLb);
    let why: string;
    if (!from) {
      why = "No previous crop on record for this step.";
    } else if (capturedLb > 0) {
      why = `${from} supplies about ${creditLb} lb/ac of nitrogen and ${entry.crop} is budgeted ${demandLb} lb/ac, so the whole credit could offset fertiliser.`;
    } else if (creditLb > 0) {
      why = `${from} supplies nitrogen but ${entry.crop} buys none, so the credit had nowhere to go.`;
    } else if (demandLb > 0) {
      why = `${from} leaves no biological nitrogen, so ${entry.crop} had to buy all ${demandLb} lb/ac.`;
    } else {
      why = `Neither ${from} nor ${entry.crop} moves nitrogen, so this step is neutral.`;
    }
    return { year: entry.year, from: from ?? "-", to: entry.crop, creditLb, demandLb, capturedLb, why };
  });

  const capturedLb = transitions.reduce((s, t) => s + t.capturedLb, 0);
  const earner = [...transitions].sort((a, b) => b.capturedLb - a.capturedLb)[0];
  const bestPossibleLb = Math.max(
    ...permutations(observedSequence).map((seq) => nitrogenCapture(seq, preceding))
  );
  const wastedLb = Math.max(0, bestPossibleLb - capturedLb);
  const arrangedWell = wastedLb === 0;

  const nitrogen: NitrogenAssessment = {
    arrangedWell,
    headline: arrangedWell ? "Nitrogen is arranged well." : "Nitrogen is being left on the table.",
    explanation: arrangedWell
      ? capturedLb > 0
        ? "The nitrogen-supplying crop sits in front of a crop that buys fertiliser nitrogen. No reordering improves on it."
        : "Nothing in this rotation supplies biological nitrogen, so there is no credit to place."
      : `Reordering the same crops would move about ${wastedLb} lb/ac of nitrogen in front of a crop that could use it.`,
    capturedLb,
    capturedValuePerAc: capturedLb * PRICE_PER_LB,
    capturedValueField: capturedLb * PRICE_PER_LB * acres,
    bestPossibleLb,
    wastedLb,
    wastedValuePerAc: wastedLb * PRICE_PER_LB,
    transitions,
    pricePerLb: PRICE_PER_LB,
    caveat:
      "Fertiliser-equivalent value of a documented previous-crop credit. Manitoba does not sanction cutting rates by this amount, because yield potential rises and absorbs some of it.",
    creditCrop: earner && earner.capturedLb > 0 ? earner.from : null,
    creditFollower: earner && earner.capturedLb > 0 ? earner.to : null,
  };

  // --- Disease, ignoring nitrogen -------------------------------------
  const rules = PATHOGEN_RULES.map((rule) => evaluateRule(rule, history));
  const broken = rules.filter((r) => r.binding && r.verdict === "FAIL");
  const worst = broken[0];

  // One sentence naming the crop and the gap, for a reader with no agronomy
  // background. Rules that describe the same problem are said once.
  const shortfall = (r: DiseaseRuleResult) => (r.observedInterval ?? 0) / r.minimumInterval;
  const tightest = [...broken].sort((a, b) => shortfall(a) - shortfall(b))[0];
  const sameProblem = tightest
    ? broken.filter(
        (r) =>
          r.observedInterval === tightest.observedInterval &&
          r.minimumInterval === tightest.minimumInterval &&
          r.hostCrops.join() === tightest.hostCrops.join()
      )
    : [];
  const names = sameProblem.map((r) => r.short.toLowerCase());
  const nameList =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : (names[0] ?? "");
  const cropList = tightest ? tightest.hostCrops.join(" and ") : "";
  const gapPhrase =
    tightest?.observedInterval === 1 ? "every year" : `every ${tightest?.observedInterval} years`;
  const plainCause = tightest
    ? `${cropList} ${tightest.hostCrops.length > 1 ? "are" : "is"} grown ${gapPhrase} here. ` +
      `${nameList.charAt(0).toUpperCase()}${nameList.slice(1)} ${names.length > 1 ? "need" : "needs"} ` +
      `at least ${tightest.minimumInterval} years between them.`
    : "";

  const disease: DiseaseAssessment = {
    clean: broken.length === 0,
    plainCause,
    headline: worst
      ? `${worst.short} needs ${worst.minimumInterval} years between host crops and this rotation has ${worst.observedInterval}.`
      : "No binding rotation rule is broken.",
    explanation: broken.length
      ? "The rotation sits inside the minimum interval for at least one disease where rotation is the main defence."
      : "Every host crop clears its minimum interval on the years we can read.",
    broken: broken.map((r) => r.pathogen),
    rules,
  };

  // --- Reconcile: fewest binding violations, then most nitrogen -------
  const candidates = permutations(observedSequence).map((seq) => {
    const rewritten = history.map((h) => {
      const idx = window.findIndex((w) => w.year === h.year);
      return idx === -1 ? h : { ...h, crop: seq[idx] };
    });
    return {
      seq,
      violations: windowViolations(rewritten, windowStart),
      nitrogen: nitrogenCapture(seq, preceding),
      changes: changesFrom(seq, observedSequence),
    };
  });
  candidates.sort(
    (a, b) => a.violations - b.violations || b.nitrogen - a.nitrogen || a.changes - b.changes
  );
  const best = candidates[0];
  const observedViolations = windowViolations(history, windowStart);
  const alreadyOptimal = best.changes === 0;

  const why = alreadyOptimal
    ? observedViolations > 0
      ? "No reordering of these same crops clears the rule. The break has to come from a crop that is not in this rotation."
      : "This rotation already clears every binding rule and captures all the nitrogen on offer."
    : observedViolations > best.violations
      ? `As grown, this rotation breaks the ${broken[0]?.short ?? "rotation"} rule. Moving the same crops into this order separates the host years enough.`
      : `Same crops, better order. This sequence keeps every rule and puts the nitrogen where a crop can use it.`;

  // --- Yield risk ------------------------------------------------------
  const charges = rules
    .filter((r) => r.binding && r.verdict === "FAIL" && r.observedInterval !== null)
    .flatMap((r) =>
      r.hostYears
        .filter((y) => y >= windowStart)
        .map((y) => ({
          crop: history.find((h) => h.year === y)!.crop,
          year: y,
          observed: r.observedInterval!,
          required: r.minimumInterval,
        }))
    )
    // One fungicide pass per tight year, not one per pathogen.
    .filter((c, i, arr) => arr.findIndex((o) => o.year === c.year) === i);

  const tightYears = charges.length;
  const yieldRisk: YieldRisk = {
    passPerAcre: FUNGICIDE_PASS_PER_AC,
    fieldTotalPerPass: FUNGICIDE_PASS_PER_AC * acres,
    tightYears,
    windowYears: window.length,
    charges,
    headline: tightYears
      ? `Avoidable input cost of $${FUNGICIDE_PASS_PER_AC.toFixed(2)}/ac in each tight year, by Manitoba's own rotation costing.`
      : "No fungicide pass is charged against this rotation.",
    basis:
      "Manitoba's rotation costing adds a fungicide pass to a year where a host crop comes back inside its minimum interval. That is an input cost you can avoid, not a yield loss.",
    scoutingNote:
      "Actual yield loss cannot be read from crop history. It depends on how much disease is in the field, which needs scouting.",
    doNotSum:
      "Do not add this to the nitrogen figure. They depend on different decisions, a soil test and rate cut for one, a fungicide decision for the other.",
  };

  return {
    fieldId,
    acres,
    history,
    windowStart,
    observedSequence,
    recommendedSequence: best.seq,
    alreadyOptimal,
    observedViolations,
    why,
    nitrogen,
    disease,
    yieldRisk,
    sourceNote,
  };
}
