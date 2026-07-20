import { useMemo, useState } from "react";
import { FARMS, intensityBand } from "./data/farms";
import TopBar, { type Filters } from "./components/TopBar";
import MapView, { type MapStyle } from "./components/MapView";
import MapStyleToggle from "./components/MapStyleToggle";
import DetailPanel from "./components/DetailPanel";
import Legend from "./components/Legend";

export default function App() {
  const [filters, setFilters] = useState<Filters>({ query: "", province: "all", band: "all" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>("map");

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return FARMS.filter((f) => {
      if (filters.province !== "all" && f.province !== filters.province) return false;
      if (filters.band !== "all" && intensityBand(f.intensity) !== filters.band) return false;
      if (q && !`${f.name} ${f.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filters]);

  const selected = filtered.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <TopBar filters={filters} onChange={setFilters} />
      <div className="relative flex-1 overflow-hidden">
        <MapView farms={filtered} selected={selected} mapStyle={mapStyle} onSelect={setSelectedId} />
        {selected && <DetailPanel farm={selected} onClose={() => setSelectedId(null)} />}
        <MapStyleToggle value={mapStyle} onChange={setMapStyle} panelOpen={selected !== null} />
        <Legend />
      </div>
    </div>
  );
}
