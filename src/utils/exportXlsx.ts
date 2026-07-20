import * as XLSX from "xlsx";
import type { Farm } from "../data/farms";

const toKg = (t: number) => Math.round(t * 1000 * 100) / 100;

// Mirrors the layout of a Holos "Detailed Emission Report": per-gas columns,
// one row per field, an Exports section, and a totals row — all in kg CO₂e.
export function exportFarmReport(farm: Farm) {
  const { detail } = farm;

  const header = [
    "",
    "Farm",
    "Component name",
    "Emission source",
    "Enteric CH₄ (kg CO₂e)",
    "Manure CH₄ (kg CO₂e)",
    "Direct N₂O (kg CO₂e)",
    "Indirect N₂O (kg CO₂e)",
    "Farm Energy CO₂ (kg CO₂e)",
    "Upstream CO2 (kg CO₂e)",
    "Subtotal (kg CO₂e)",
  ];

  const fieldRows = detail.fields.map((f) => [
    "",
    farm.name,
    `Crop rotation [${f.label}]`,
    `${f.crop}, ${f.areaHa} (ha)`,
    0,
    0,
    toKg(f.directN2O),
    toKg(f.indirectN2O),
    toKg(f.energy),
    0,
    toKg(f.total),
  ]);

  const rows: (string | number)[][] = [
    header,
    ["Crops"],
    ...fieldRows,
  ];

  if (detail.residueExportsN2O > 0) {
    rows.push(
      ["Exports"],
      [
        "",
        farm.name,
        "Exports",
        "Crop residue exports",
        0,
        0,
        toKg(detail.residueExportsN2O),
        0,
        0,
        0,
        toKg(detail.residueExportsN2O),
      ]
    );
  }

  const subtotal =
    detail.entericCh4 +
    detail.manureCh4 +
    detail.directN2O +
    detail.indirectN2O +
    detail.farmEnergy +
    detail.upstream;

  rows.push([
    "",
    "",
    "",
    "Totals",
    toKg(detail.entericCh4),
    toKg(detail.manureCh4),
    toKg(detail.directN2O),
    toKg(detail.indirectN2O),
    toKg(detail.farmEnergy),
    toKg(detail.upstream),
    toKg(subtotal),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 4 },
    { wch: 18 },
    { wch: 26 },
    { wch: 26 },
    ...Array.from({ length: 7 }, () => ({ wch: 20 })),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detailed Emission Report");
  const slug = farm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  XLSX.writeFile(wb, `${slug}-emissions-report.xlsx`);
}
