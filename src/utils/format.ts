// Single currency formatter for all estimated dollar figures.
// Rounds to 3 significant figures max so estimates never imply
// false precision ($9,873.42 becomes $9,870).
export function formatCAD(value: number): string {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "$0";
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, Math.max(magnitude - 2, 0));
  const rounded = Math.round(value / factor) * factor;
  return "$" + rounded.toLocaleString("en-CA", { maximumFractionDigits: 0 });
}
