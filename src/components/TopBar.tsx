import { FARMS } from "../data/farms";
import logo from "../assets/logo.png";
import AccountMenu from "./AccountMenu";

export interface Filters {
  query: string;
  province: string;
  band: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const PROVINCES = [
  ["all", "Province"],
  ["SK", "Saskatchewan"],
  ["AB", "Alberta"],
  ["MB", "Manitoba"],
  ["ON", "Ontario"],
  ["QC", "Quebec"],
  ["BC", "British Columbia"],
];

const BANDS = [
  ["all", "Intensity"],
  ["low", "Low (< 0.5)"],
  ["medium", "Medium (0.5–0.9)"],
  ["high", "High (> 0.9)"],
];

const totalEmissions = Math.round(FARMS.reduce((s, f) => s + f.totalEmissions, 0));
const avgPcaf = FARMS.reduce((s, f) => s + f.pcafScore, 0) / FARMS.length;

export default function TopBar({ filters, onChange }: Props) {
  const selectClass =
    "h-9 w-28 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-emerald-500";

  return (
    <header className="relative z-[1200] flex h-16 shrink-0 items-center gap-6 border-b border-slate-200 bg-white px-5">
      <img src={logo} alt="ESGTree" className="h-7 w-auto" />

      {/* Centered on the viewport, not the leftover flex space */}
      <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium text-slate-500 xl:block">
        <span className="font-semibold text-slate-800">{FARMS.length}</span> farms {"·"}{" "}
        <span className="font-semibold text-slate-800">{totalEmissions.toLocaleString()}</span> t CO{"₂"}e
        financed {"·"} avg PCAF Score{" "}
        <span className="font-semibold text-slate-800">{avgPcaf.toFixed(1)}</span>
      </span>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search farms"
            className="h-9 w-32 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>
        <select
          className={selectClass}
          value={filters.province}
          onChange={(e) => onChange({ ...filters, province: e.target.value })}
          aria-label="Filter by province"
        >
          {PROVINCES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.band}
          onChange={(e) => onChange({ ...filters, band: e.target.value })}
          aria-label="Filter by emissions intensity"
        >
          {BANDS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <AccountMenu />
      </div>
    </header>
  );
}
