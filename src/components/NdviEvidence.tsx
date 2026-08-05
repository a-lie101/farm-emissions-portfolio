import { useMemo, useState } from "react";
import { FALL_NDVI_BY_YEAR, NDVI_TIMESERIES, fallVerdict, type NdviVerdict } from "../data/gavelinNdvi";

const COVER = "#18a058";
const REFERENCE = "#3b6fd4";

const VERDICT_STYLES: Record<NdviVerdict, { label: string; cls: string }> = {
  detected: { label: "Detected", cls: "bg-emerald-100 text-emerald-700" },
  likely: { label: "Likely", cls: "bg-amber-100 text-amber-700" },
  none: { label: "Not seen", cls: "bg-slate-100 text-slate-500" },
};

function SeriesLegend() {
  return (
    <div className="mb-2 flex gap-4">
      {[
        [COVER, "Cover-cropped field"],
        [REFERENCE, "Reference field"],
      ].map(([color, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// Grouped bars: fall-window NDVI per year, cover vs reference.
function FallBars() {
  const W = 352;
  const H = 128;
  const padL = 26;
  const padT = 6;
  const plotH = H - padT - 14;
  const yMax = 0.5;
  const groupW = (W - padL) / FALL_NDVI_BY_YEAR.length;
  const barW = 15;

  const y = (v: number) => padT + plotH * (1 - Math.min(v, yMax) / yMax);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Fall NDVI by year, cover-cropped vs reference field">
        {[0, 0.25, 0.5].map((tick) => (
          <g key={tick}>
            <line x1={padL} x2={W} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 5} y={y(tick) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        {FALL_NDVI_BY_YEAR.map((row, i) => {
          const cx = padL + groupW * i + groupW / 2;
          return (
            <g key={row.year}>
              <title>{`${row.year}: cover ${row.cover.toFixed(2)}, reference ${row.reference.toFixed(2)}`}</title>
              <rect x={cx - barW - 1} width={barW} y={y(row.cover)} height={y(0) - y(row.cover)} rx="2" fill={COVER} />
              <rect x={cx + 1} width={barW} y={y(row.reference)} height={y(0) - y(row.reference)} rx="2" fill={REFERENCE} />
              <text x={cx} y={H - 3} textAnchor="middle" fontSize="9" fill="#64748b">
                {row.year}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={W} y1={y(0)} y2={y(0)} stroke="#cbd5e1" strokeWidth="1" />
      </svg>
      <div className="mt-1.5 grid grid-cols-6 gap-1" style={{ paddingLeft: `${(padL / W) * 100}%` }}>
        {FALL_NDVI_BY_YEAR.map((row) => {
          const v = VERDICT_STYLES[fallVerdict(row)];
          return (
            <span
              key={row.year}
              className={`rounded-full px-1 py-0.5 text-center text-[9px] font-bold ${v.cls}`}
            >
              {v.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Full Sentinel-2 time series, 2020–2025.
function TimeSeries() {
  const W = 352;
  const H = 158;
  const padL = 26;
  const padR = 4;
  const padT = 8;
  const padB = 16;
  const t0 = Date.parse("2020-01-01");
  const t1 = Date.parse("2026-03-01");
  const vMin = -0.1;
  const vMax = 0.85;

  const x = (date: string) => padL + ((Date.parse(date) - t0) / (t1 - t0)) * (W - padL - padR);
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - vMin) / (vMax - vMin));

  const paths = useMemo(() => {
    const build = (key: "cover" | "reference") => {
      let d = "";
      let pen = false;
      for (const p of NDVI_TIMESERIES) {
        const v = p[key];
        if (v === null) {
          pen = false;
          continue;
        }
        d += `${pen ? "L" : "M"}${x(p.date).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      }
      return d;
    };
    return { cover: build("cover"), reference: build("reference") };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [hover, setHover] = useState<number | null>(null);
  const hoverPoint = hover !== null ? NDVI_TIMESERIES[hover] : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < NDVI_TIMESERIES.length; i++) {
      const d = Math.abs(x(NDVI_TIMESERIES[i].date) - mx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHover(best);
  };

  const years = [2021, 2022, 2023, 2024, 2025];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Sentinel-2 NDVI time series 2020 to 2025, cover-cropped vs reference field"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.4, 0.8].map((tick) => (
          <g key={tick}>
            <line x1={padL} x2={W - padR} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 5} y={y(tick) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {years.map((yr) => (
          <line
            key={yr}
            x1={x(`${yr}-01-01`)}
            x2={x(`${yr}-01-01`)}
            y1={padT}
            y2={H - padB}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        {[2020, ...years].map((yr) => (
          <text key={yr} x={x(`${yr}-07-01`)} y={H - 4} textAnchor="middle" fontSize="8" fill="#94a3b8">
            {yr}
          </text>
        ))}
        <path d={paths.reference} fill="none" stroke={REFERENCE} strokeWidth="1.4" strokeLinejoin="round" opacity="0.85" />
        <path d={paths.cover} fill="none" stroke={COVER} strokeWidth="1.4" strokeLinejoin="round" opacity="0.9" />
        {/* Selective direct labels at each series' clearest peak */}
        <text x={x("2020-07-26")} y={y(0.79) - 4} textAnchor="middle" fontSize="8" fontWeight="600" fill="#475569">
          Reference
        </text>
        <text x={x("2021-09-09")} y={y(0.59) - 4} textAnchor="middle" fontSize="8" fontWeight="600" fill="#475569">
          Cover crop
        </text>
        {hoverPoint && (
          <g>
            <line
              x1={x(hoverPoint.date)}
              x2={x(hoverPoint.date)}
              y1={padT}
              y2={H - padB}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {hoverPoint.cover !== null && <circle cx={x(hoverPoint.date)} cy={y(hoverPoint.cover)} r="3" fill={COVER} stroke="#fff" strokeWidth="1" />}
            {hoverPoint.reference !== null && (
              <circle cx={x(hoverPoint.date)} cy={y(hoverPoint.reference)} r="3" fill={REFERENCE} stroke="#fff" strokeWidth="1" />
            )}
          </g>
        )}
      </svg>
      {hoverPoint && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] shadow-md"
          style={{
            left: `${(x(hoverPoint.date) / W) * 100}%`,
            transform: x(hoverPoint.date) > W * 0.6 ? "translateX(-105%)" : "translateX(8px)",
          }}
        >
          <p className="font-semibold text-slate-700">{hoverPoint.date}</p>
          <p className="text-slate-600">
            Cover: <span className="font-semibold">{hoverPoint.cover?.toFixed(2) ?? "—"}</span>
          </p>
          <p className="text-slate-600">
            Reference: <span className="font-semibold">{hoverPoint.reference?.toFixed(2) ?? "—"}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function NdviEvidence() {
  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        Practice claims are cross-checked against satellite greenness (NDVI): one cover-cropped
        field compared with a reference field on the same farm. Green cover after harvest is the
        fingerprint of a cover crop.
      </p>

      <SeriesLegend />

      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Fall greenness by year
      </p>
      <FallBars />

      <p className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Full time series, 2020–2025
      </p>
      <TimeSeries />

      <p className="mt-2 text-xs text-slate-500">
        Cover crop clearly detected in fall 2021, likely in 2025; not detected 2022–24 (drought
        years — consistent with failed establishment or no seeding).
      </p>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Source: Sentinel-2 NDVI, field means · 400 cloud-free observations
      </p>
    </div>
  );
}
