export type ProvenanceStatus = "Observed" | "Estimated" | "Representative" | "Documented";

export interface RotationField {
  label: string;
  crops: string[];
}

export interface ProvenanceRow {
  input: string;
  status: ProvenanceStatus;
  note?: string;
}

export interface Soil {
  sandPct: number;
  siltPct: number;
  clayPct: number;
  organicCarbonPct: number;
  ph: number;
  zone: string;
  topsoilCm: number;
}

export interface EmissionField {
  label: string;
  crop: string;
  areaHa: number;
  directN2O: number;
  indirectN2O: number;
  energy: number;
  total: number;
}

// Mirrors the column/row structure of a Holos "Detailed Emission Report".
// All values in t CO₂e.
export interface EmissionsDetail {
  directN2O: number;
  indirectN2O: number;
  farmEnergy: number;
  upstream: number;
  entericCh4: number;
  manureCh4: number;
  residueExportsN2O: number;
  fields: EmissionField[];
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  province: string;
  lat: number;
  lon: number;
  parcelPolygon: [number, number][];
  totalEmissions: number;
  intensity: number;
  pcafScore: number;
  breakdown: { n2o: number; energy: number; soilCarbon: number };
  detail: EmissionsDetail;
  carbonNote?: string;
  rotation: RotationField[];
  practices: string[];
  soil: Soil;
  provenance: ProvenanceRow[];
  isReal: boolean;
}

// Deterministic PRNG so the sample portfolio is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260716);
const between = (a: number, b: number) => a + rand() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ~1.5 km square parcel centered on the pin.
function parcelAround(lat: number, lon: number): [number, number][] {
  const dLat = 0.75 / 110.574;
  const dLon = 0.75 / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat - dLat, lon - dLon],
    [lat - dLat, lon + dLon],
    [lat + dLat, lon + dLon],
    [lat + dLat, lon - dLon],
  ];
}

interface Region {
  province: string;
  provinceName: string;
  count: number;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  towns: string[];
  zones: string[];
}

const REGIONS: Region[] = [
  {
    province: "SK",
    provinceName: "Saskatchewan",
    count: 19,
    latMin: 49,
    latMax: 52,
    lonMin: -109,
    lonMax: -102,
    towns: ["Swift Current", "Moose Jaw", "Assiniboia", "Weyburn", "Estevan", "Kindersley", "Rosetown", "Gravelbourg", "Shaunavon", "Davidson"],
    zones: ["Brown", "Dark Brown", "Black"],
  },
  {
    province: "AB",
    provinceName: "Alberta",
    count: 17,
    latMin: 49,
    latMax: 53,
    lonMin: -114,
    lonMax: -110,
    towns: ["Lethbridge", "Brooks", "Taber", "Vulcan", "Olds", "Camrose", "Drumheller", "Stettler", "Hanna"],
    zones: ["Brown", "Dark Brown", "Black"],
  },
  {
    province: "MB",
    provinceName: "Manitoba",
    count: 15,
    latMin: 49,
    latMax: 51,
    lonMin: -101,
    lonMax: -96,
    towns: ["Brandon", "Portage la Prairie", "Morden", "Winkler", "Steinbach", "Carman", "Dauphin", "Killarney"],
    zones: ["Black"],
  },
  {
    province: "ON",
    provinceName: "Ontario",
    count: 9,
    latMin: 42,
    latMax: 44,
    lonMin: -82,
    lonMax: -80,
    towns: ["Chatham", "Sarnia", "Strathroy", "Tillsonburg", "Woodstock", "Essex", "St. Thomas"],
    zones: ["Gray-Brown Luvisolic"],
  },
  {
    province: "QC",
    provinceName: "Quebec",
    count: 8,
    latMin: 45,
    latMax: 46,
    lonMin: -74,
    lonMax: -72,
    towns: ["Saint-Hyacinthe", "Granby", "Drummondville", "Sorel-Tracy", "Victoriaville", "Nicolet"],
    zones: ["Gleysolic"],
  },
  {
    province: "BC",
    provinceName: "British Columbia",
    count: 6,
    latMin: 49,
    latMax: 50,
    lonMin: -123,
    lonMax: -122,
    towns: ["Abbotsford", "Chilliwack", "Langley", "Agassiz"],
    zones: ["Coastal"],
  },
  {
    province: "BC",
    provinceName: "British Columbia",
    count: 3,
    latMin: 55,
    latMax: 56,
    lonMin: -121,
    lonMax: -120,
    towns: ["Dawson Creek", "Fort St. John"],
    zones: ["Gray Luvisolic"],
  },
];

const SURNAMES = [
  "Anderson", "Braun", "Carlson", "Dueck", "Enns", "Friesen", "Gustafson", "Harder", "Isaak", "Janzen",
  "Klassen", "Larsen", "Martens", "Neufeld", "Olson", "Penner", "Quiring", "Rempel", "Schmidt", "Thiessen",
  "Unger", "Vogel", "Wiebe", "Zacharias", "Hansen", "Kowalski", "Tremblay", "Gagnon", "Bergeron", "McLeod",
  "Fraser", "Sinclair", "Dahl", "Lindgren", "Berg", "Nyberg", "Sorensen", "Hofer", "Reimer", "Wall",
  "Peters", "Dyck", "Toews", "Loewen", "Sawatzky",
];

const RANCH_PLACES = [
  "Willow Creek", "Cypress Hills", "Eagle Butte", "Antler Valley", "Birch Coulee", "Pine Ridge",
  "Silver Sage", "Buffalo Plains", "Aspen Grove", "Clearwater", "Highwood", "Meadowbrook",
  "Stonegate", "Prairie Rose", "Big Sky", "Wolf Willow", "Grasslands", "Sunrise Bench",
  "Coyote Flats", "Old Wives Lake",
];

const NAME_POOL = shuffle([
  ...SURNAMES.map((s) => `${s} Farms`),
  ...RANCH_PLACES.map((p) => `${p} Ranch`),
  ...SURNAMES.map((s) => `${s} Acres`),
]);

const PRACTICE_POOL = [
  "No-till",
  "Minimum till",
  "Cover crops",
  "Diverse rotation",
  "Variable-rate fertilizer",
  "Rotational grazing",
  "Shelterbelts",
  "Precision seeding",
  "Regular soil testing",
  "4R nutrient stewardship",
];

const WHEAT_LIKE = ["Wheat", "Wheat", "Wheat", "Durum", "Barley"] as const;
const BREAK_CROPS = ["Lentils", "Canola", "Peas", "Flax", "Oats"] as const;

function genRotation(): RotationField[] {
  return Array.from({ length: 16 }, (_, i) => {
    const len = pick([2, 4, 4, 6] as const);
    const crops: string[] = [];
    for (let y = 0; y < len; y++) {
      crops.push(y % 2 === 0 ? pick(WHEAT_LIKE) : pick(BREAK_CROPS));
    }
    return { label: `F${String(i + 1).padStart(2, "0")}`, crops };
  });
}

function genPractices(): string[] {
  return shuffle(PRACTICE_POOL).slice(0, 2 + Math.floor(rand() * 3));
}

function genProvenance(): ProvenanceRow[] {
  return [
    { input: "Crops", status: "Observed", note: "Satellite crop map" },
    { input: "Soil", status: "Observed", note: "Soil survey" },
    { input: "Yield", status: "Estimated", note: "Regional average" },
    { input: "Fertilizer", status: "Estimated", note: "Largest source of uncertainty" },
  ];
}

function genPcafScore(): number {
  const r = rand();
  return r < 0.15 ? 2 : r < 0.85 ? 3 : 4;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

// Split a farm's summary totals into Holos-style per-gas and per-field detail
// so the numbers in the expander always reconcile with the headline figures.
function genDetail(n2oT: number, energyT: number, areaHa: number, rotation: RotationField[]): EmissionsDetail {
  const directN2O = round1(n2oT * between(0.93, 0.97));
  const indirectN2O = round1(n2oT - directN2O);
  const residueExportsN2O = rand() < 0.6 ? round1(directN2O * between(0.05, 0.15)) : 0;
  const fieldsDirect = round1(directN2O - residueExportsN2O);

  const crops = [...new Set(rotation.flatMap((f) => f.crops))];
  const count = 4 + Math.floor(rand() * 5);
  const weights = Array.from({ length: count }, () => between(0.7, 1.3));
  if (rand() < 0.35) weights[Math.floor(rand() * count)] = between(2.2, 3.2);
  const weightSum = weights.reduce((s, w) => s + w, 0);

  const fields: EmissionField[] = weights.map((w, i) => {
    const share = w / weightSum;
    const d = round1(fieldsDirect * share);
    const ind = round1(indirectN2O * share);
    const e = round1(energyT * share);
    return {
      label: `Field #${i + 1}`,
      crop: pick(crops),
      areaHa: Math.round(areaHa / count),
      directN2O: d,
      indirectN2O: ind,
      energy: e,
      total: round1(d + ind + e),
    };
  });

  return {
    directN2O,
    indirectN2O,
    farmEnergy: round1(energyT),
    upstream: 0,
    entericCh4: 0,
    manureCh4: 0,
    residueExportsN2O,
    fields,
  };
}

const GAVELIN: Farm = {
  id: "gavelin-farms",
  name: "Gavelin Farms",
  location: "McCord, Saskatchewan",
  province: "SK",
  lat: 49.508,
  lon: -105.884,
  parcelPolygon: [
    [49.4935, -105.9068],
    [49.4935, -105.8618],
    [49.5227, -105.8618],
    [49.5225, -105.9067],
  ],
  totalEmissions: 654,
  intensity: 0.85,
  pcafScore: 3,
  // Gross annual emissions from the full-farm Holos run (768 ha, 12 fields).
  // Soil carbon is a measured sink: ~75 t CO₂/yr removed (Holos multi-year results).
  breakdown: { n2o: 504, energy: 150, soilCarbon: -75 },
  carbonNote:
    "Multi-year Holos (2009 onward): +1,280 t CO₂ removed; 8 of 12 fields gaining soil carbon (avg +455 kg C/ha).",
  // Exact values from the Holos "Detailed Emission Report" (kg CO₂e → t, 1 dp).
  // R2 block fields are the per-field rows from the original detailed report;
  // R1 + standalone fields are split so all totals reconcile with the full-farm report.
  detail: {
    directN2O: 484.7,
    indirectN2O: 19.7,
    farmEnergy: 149.7,
    upstream: 0,
    entericCh4: 0,
    manureCh4: 0,
    residueExportsN2O: 40.4,
    fields: [
      { label: "R1-1", crop: "Wheat", areaHa: 64, directN2O: 38.0, indirectN2O: 1.0, energy: 12.6, total: 51.6 },
      { label: "R1-2", crop: "Canola", areaHa: 64, directN2O: 36.5, indirectN2O: 0.9, energy: 13.0, total: 50.4 },
      { label: "R1-3", crop: "Wheat", areaHa: 64, directN2O: 41.2, indirectN2O: 1.0, energy: 12.4, total: 54.6 },
      { label: "R1-4", crop: "Lentils", areaHa: 64, directN2O: 24.3, indirectN2O: 0.7, energy: 12.1, total: 37.1 },
      { label: "R2-1", crop: "Wheat", areaHa: 64, directN2O: 26.5, indirectN2O: 1.8, energy: 11.1, total: 39.4 },
      { label: "R2-2", crop: "Dry/Field peas", areaHa: 64, directN2O: 27.9, indirectN2O: 1.9, energy: 12.5, total: 42.3 },
      { label: "R2-3", crop: "Wheat", areaHa: 64, directN2O: 99.6, indirectN2O: 4.6, energy: 13.5, total: 117.7 },
      { label: "R2-4", crop: "Lentils", areaHa: 64, directN2O: 28.8, indirectN2O: 2.0, energy: 13.1, total: 43.8 },
      { label: "R2-5", crop: "Wheat", areaHa: 64, directN2O: 45.3, indirectN2O: 2.6, energy: 13.1, total: 61.0 },
      { label: "R2-6", crop: "Flax", areaHa: 64, directN2O: 28.4, indirectN2O: 1.9, energy: 12.0, total: 42.3 },
      { label: "S1", crop: "Peas", areaHa: 64, directN2O: 22.6, indirectN2O: 0.6, energy: 11.9, total: 35.1 },
      { label: "S2", crop: "Wheat", areaHa: 64, directN2O: 25.2, indirectN2O: 0.7, energy: 12.5, total: 38.4 },
    ],
  },
  // Real Holos rotations: two phase-offset blocks + two standalone fields.
  // Within a block each field runs the same cycle offset by one year.
  rotation: [
    { label: "R1-1", crops: ["Wheat", "Canola", "Wheat", "Lentils"] },
    { label: "R1-2", crops: ["Canola", "Wheat", "Lentils", "Wheat"] },
    { label: "R1-3", crops: ["Wheat", "Lentils", "Wheat", "Canola"] },
    { label: "R1-4", crops: ["Lentils", "Wheat", "Canola", "Wheat"] },
    { label: "R2-1", crops: ["Wheat", "Peas", "Wheat", "Lentils", "Wheat", "Flax"] },
    { label: "R2-2", crops: ["Peas", "Wheat", "Lentils", "Wheat", "Flax", "Wheat"] },
    { label: "R2-3", crops: ["Wheat", "Lentils", "Wheat", "Flax", "Wheat", "Peas"] },
    { label: "R2-4", crops: ["Lentils", "Wheat", "Flax", "Wheat", "Peas", "Wheat"] },
    { label: "R2-5", crops: ["Wheat", "Flax", "Wheat", "Peas", "Wheat", "Lentils"] },
    { label: "R2-6", crops: ["Flax", "Wheat", "Peas", "Wheat", "Lentils", "Wheat"] },
    { label: "S1", crops: ["Peas", "Wheat", "Lentils", "Wheat", "Wheat", "Lentils"] },
    { label: "S2", crops: ["Wheat", "Peas"] },
  ],
  practices: [
    "No-till (all 12 fields)",
    "Diverse rotation, strong pulse phase",
    "Flax & canola oilseed phases",
  ],
  soil: {
    sandPct: 39,
    siltPct: 33,
    clayPct: 24,
    organicCarbonPct: 1.6,
    ph: 7.0,
    zone: "Brown Chernozem",
    topsoilCm: 13,
  },
  provenance: [
    { input: "Crops / rotation", status: "Observed", note: "Read from AAFC satellite crop map" },
    { input: "Soil", status: "Representative", note: "Brown-zone profile, not the exact polygon" },
    { input: "Tillage", status: "Documented", note: "Gavelin's no-till practice" },
    { input: "Yield", status: "Estimated", note: "Regional average (SAD default)" },
    { input: "Fertilizer nitrogen", status: "Estimated", note: "Largest source of uncertainty; inferred from yield" },
  ],
  isReal: true,
};

function generateFarms(): Farm[] {
  const farms: Farm[] = [GAVELIN];
  let nameIdx = 0;

  for (const region of REGIONS) {
    for (let i = 0; i < region.count; i++) {
      const lat = between(region.latMin, region.latMax);
      const lon = between(region.lonMin, region.lonMax);
      const name = NAME_POOL[nameIdx++ % NAME_POOL.length];
      const town = pick(region.towns);
      const totalEmissions = Math.round(between(100, 800));
      const n2o = Math.round(totalEmissions * between(0.75, 0.85));
      const intensity = Math.round(between(0.3, 1.2) * 100) / 100;
      const rotation = genRotation();
      const sand = Math.round(between(22, 55));
      const silt = Math.round(between(20, 42));
      const clay = Math.max(8, Math.round(98 - sand - silt - between(0, 8)));

      farms.push({
        id: `farm-${farms.length}`,
        name,
        location: `${town}, ${region.provinceName}`,
        province: region.province,
        lat,
        lon,
        parcelPolygon: parcelAround(lat, lon),
        totalEmissions,
        intensity,
        pcafScore: genPcafScore(),
        breakdown: { n2o, energy: totalEmissions - n2o, soilCarbon: 0 },
        detail: genDetail(n2o, totalEmissions - n2o, Math.round(totalEmissions / intensity), rotation),
        rotation,
        practices: genPractices(),
        soil: {
          sandPct: sand,
          siltPct: silt,
          clayPct: clay,
          organicCarbonPct: Math.round(between(1.2, 4.5) * 10) / 10,
          ph: Math.round(between(5.8, 8.0) * 10) / 10,
          zone: pick(region.zones),
          topsoilCm: Math.round(between(10, 30)),
        },
        provenance: genProvenance(),
        isReal: false,
      });
    }
  }

  // Nudge sample scores (never Gavelin's) so the portfolio average is exactly 3.0.
  const target = farms.length * 3;
  let sum = farms.reduce((s, f) => s + f.pcafScore, 0);
  for (let i = 1; i < farms.length && sum !== target; i++) {
    if (sum > target && farms[i].pcafScore > 2) {
      farms[i].pcafScore--;
      sum--;
    } else if (sum < target && farms[i].pcafScore < 4) {
      farms[i].pcafScore++;
      sum++;
    }
  }

  return farms;
}

export const FARMS: Farm[] = generateFarms();

export type IntensityBand = "low" | "medium" | "high";

export function intensityBand(intensity: number): IntensityBand {
  if (intensity < 0.5) return "low";
  if (intensity <= 0.9) return "medium";
  return "high";
}

export const BAND_COLORS: Record<IntensityBand, string> = {
  low: "#18a058",
  medium: "#f59e0b",
  high: "#ef4444",
};

export function intensityColor(intensity: number): string {
  return BAND_COLORS[intensityBand(intensity)];
}
