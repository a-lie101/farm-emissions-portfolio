import { useEffect, useRef, useState } from "react";

const MENU_ITEMS: { label: string; icon: string }[] = [
  { label: "Organization profile", icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" },
  { label: "Account settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z" },
  { label: "Help & support", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-2.5-12.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" },
];

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#0c1b33] text-xs font-bold text-white shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-slate-300 ${
          open ? "ring-2 ring-emerald-500" : ""
        }`}
      >
        AC
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[1300] w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1b33] text-sm font-bold text-white">
              AC
            </span>
            <div>
              <p className="font-display text-sm font-bold text-slate-900">Agri Credit Canada</p>
              <p className="text-xs text-slate-500">Agricultural lender · Demo organization</p>
            </div>
          </div>

          <p className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Sample institution financing <span className="font-semibold text-slate-700">78 large
            corporate farm operations</span> across six provinces. All portfolio data is
            illustrative except the Gavelin Farms demo.
          </p>

          <div className="py-1.5">
            {MENU_ITEMS.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon} />
                </svg>
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 py-1.5">
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
