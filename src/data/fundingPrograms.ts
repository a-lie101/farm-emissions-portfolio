// OFCAF program records. Rule-based, transparent, auditable.
// Figures come from public program information, see docs/research-appendix.md.
// Cost-share percentages and caps are program facts, never computed.

export type FundingCategory = "nitrogen_management" | "cover_cropping" | "rotational_grazing";

export interface CostShareEntry {
  pct?: number;
  pctNewApplicant?: number;
  perProjectCapCAD?: number;
  equipmentCapCAD?: number;
  note?: string;
}

export interface FundingProgram {
  id: string;
  name: string;
  deliveryOrg: string;
  provinces: string[];
  categories: FundingCategory[];
  costShare: Record<string, CostShareEntry>;
  perFarmCapCAD: number;
  keyRequirements: string[];
  intakeNote: string;
  status: { label: string; asOf: string };
  url: string;
}

export const FUNDING_PROGRAMS: FundingProgram[] = [
  {
    id: "ofcaf-on-oscia",
    name: "On-Farm Climate Action Fund (Ontario)",
    deliveryOrg: "Ontario Soil and Crop Improvement Association (OSCIA)",
    provinces: ["ON"],
    categories: ["nitrogen_management", "cover_cropping", "rotational_grazing"],
    costShare: {
      cover_cropping: { pct: 65, pctNewApplicant: 75, perProjectCapCAD: 30000 },
      cover_cropping_equipment: { pct: 50, perProjectCapCAD: 30000 },
      nitrogen_management: {
        equipmentCapCAD: 30000,
        note: "Equipment cap applies across all approved applications 2022-2028.",
      },
    },
    perFarmCapCAD: 100000,
    keyRequirements: [
      "Practice must be new to the acres applied for",
      "Knowledge Sharing Event participation required",
      "Valid Ontario farm business registration",
    ],
    intakeNote:
      "Intakes are first come, first served and have filled within hours. Feb 2026 nitrogen intake allocated in about 65 minutes.",
    status: { label: "Between intakes, next not announced", asOf: "2026-08" },
    url: "https://www.ontariosoilcrop.org/ontario-on-farm-climate-action-fund/",
  },
  {
    id: "ofcaf-sk-sweap",
    name: "SWEAP, On-Farm Climate Action Fund (Saskatchewan)",
    deliveryOrg: "Saskatchewan Association of Watersheds",
    provinces: ["SK"],
    categories: ["nitrogen_management", "cover_cropping", "rotational_grazing"],
    costShare: {
      program_pool: {
        note: "$40M program pool, 2025-2028. Rebate style, per-practice caps set by delivery org.",
      },
    },
    perFarmCapCAD: 100000,
    keyRequirements: [
      "New practice or expansion onto new acres (post Feb 2022)",
      "Plan endorsed by a licensed agrology professional",
      "One funding award per parcel of land",
    ],
    intakeNote: "First come, first served. Program pool is finite and demand is high across provinces.",
    status: { label: "Active program period 2025-2028, verify current intake", asOf: "2026-08" },
    url: "https://saskwatersheds.ca/",
  },
  {
    id: "ofcaf-ab-rdar",
    name: "On-Farm Climate Action Fund (Alberta)",
    deliveryOrg: "Results Driven Agriculture Research (RDAR)",
    provinces: ["AB"],
    categories: ["nitrogen_management", "cover_cropping", "rotational_grazing"],
    costShare: {
      program_pool: { note: "$10,000 project minimum introduced in 2026. Verify current terms." },
    },
    perFarmCapCAD: 100000,
    keyRequirements: ["Active Alberta producer", "BMP action plan required"],
    intakeNote: "Oversubscribed. 900+ applications in first 30 days of the 2026-2027 intake.",
    status: { label: "Cyclic intakes, verify current window", asOf: "2026-08" },
    url: "https://rdar.ca/funding-opportunities/ofcaf",
  },
  // Minimal generic fallback for provinces without a detailed row.
  {
    id: "ofcaf-federal-generic",
    name: "On-Farm Climate Action Fund",
    deliveryOrg: "Regional delivery organization (varies by province)",
    provinces: ["*"],
    categories: ["nitrogen_management", "cover_cropping", "rotational_grazing"],
    costShare: {
      program_pool: { note: "Cost-share rates set by regional delivery organizations." },
    },
    perFarmCapCAD: 100000,
    keyRequirements: ["New practice or new acres", "Program ends March 2028"],
    intakeNote: "Intakes are first come, first served across all provinces.",
    status: { label: "Verify regional delivery organization", asOf: "2026-08" },
    url: "https://agriculture.canada.ca/en/programs/agricultural-climate-solutions-farm-climate-action-fund",
  },
];
