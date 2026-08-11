// Shared crop colours so the rotation grid and the rotation analysis
// tab always agree on what a crop looks like.
export interface CropStyle {
  bg: string;
  text: string;
  abbr: string;
  pulse?: boolean;
}

export const CROP_STYLES: Record<string, CropStyle> = {
  Wheat: { bg: "#fef3c7", text: "#92400e", abbr: "W" },
  Durum: { bg: "#fde68a", text: "#78350f", abbr: "D" },
  Barley: { bg: "#ffedd5", text: "#9a3412", abbr: "B" },
  Oats: { bg: "#e7e5e4", text: "#57534e", abbr: "O" },
  Canola: { bg: "#fef9c3", text: "#a16207", abbr: "C" },
  Flax: { bg: "#dbeafe", text: "#1e40af", abbr: "F" },
  Soybeans: { bg: "#e0e7ff", text: "#3730a3", abbr: "S", pulse: true },
  Lentils: { bg: "#d1fae5", text: "#065f46", abbr: "L", pulse: true },
  Peas: { bg: "#dcfce7", text: "#166534", abbr: "P", pulse: true },
};

export const FALLBACK_CROP_STYLE: CropStyle = { bg: "#f1f5f9", text: "#475569", abbr: "?" };

export const cropStyle = (crop: string): CropStyle => CROP_STYLES[crop] ?? FALLBACK_CROP_STYLE;

// Satellite crop labels carry a class suffix. The rotation rules only
// care about the crop family.
export function normalizeCrop(raw: string): string {
  const name = raw.split(" - ")[0].trim();
  if (name.startsWith("Wheat")) return "Wheat";
  return name;
}
