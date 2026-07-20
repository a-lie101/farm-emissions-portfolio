import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { intensityColor, type Farm } from "../data/farms";

export type MapStyle = "map" | "satellite";

// Leaflet only re-measures on window resize; the container can be 0-sized at
// mount (stylesheet still loading in dev), which anchors the map to a stale origin.
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function FlyToSelection({ farm }: { farm: Farm | null }) {
  const map = useMap();
  useEffect(() => {
    if (farm) {
      map.flyToBounds(L.latLngBounds(farm.parcelPolygon), {
        paddingTopLeft: [440, 60],
        paddingBottomRight: [60, 60],
        maxZoom: 13,
        duration: 0.9,
      });
    }
  }, [farm, map]);
  return null;
}

function ZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

// Pins grow as you zoom in, Google Maps-style.
function pinDiameter(zoom: number): number {
  return Math.max(12, Math.min(32, 10 + (zoom - 4) * 2));
}

function pinIcon(color: string, size: number, selected: boolean): L.DivIcon {
  const d = selected ? size + 6 : size;
  return L.divIcon({
    className: "farm-pin-wrap",
    html: `<div class="farm-pin${selected ? " farm-pin--selected" : ""}" style="width:${d}px;height:${d}px;background:${color}"></div>`,
    iconSize: [d, d],
    iconAnchor: [d / 2, d / 2],
  });
}

function clusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 25 ? 42 : 50;
  return L.divIcon({
    className: "farm-pin-wrap",
    html: `<div class="farm-cluster" style="width:${size}px;height:${size}px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  farms: Farm[];
  selected: Farm | null;
  mapStyle: MapStyle;
  onSelect: (id: string) => void;
}

export default function MapView({ farms, selected, mapStyle, onSelect }: Props) {
  const [zoom, setZoom] = useState(4);
  const size = pinDiameter(zoom);

  return (
    <MapContainer
      center={[56, -96]}
      zoom={4}
      zoomControl={false}
      className="h-full w-full"
    >
      {mapStyle === "map" ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
      ) : (
        <>
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
        </>
      )}
      <ZoomControl position="topright" />
      <AutoResize />
      <ZoomTracker onZoom={setZoom} />
      <FlyToSelection farm={selected} />

      {selected && (
        <Polygon
          positions={selected.parcelPolygon}
          pathOptions={{
            color: "#15803d",
            weight: 2,
            fillColor: "#22c55e",
            fillOpacity: 0.28,
          }}
        />
      )}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={false}
        disableClusteringAtZoom={10}
        iconCreateFunction={clusterIcon}
      >
        {farms.map((farm) => {
          const isSelected = selected?.id === farm.id;
          return (
            <Marker
              key={farm.id}
              position={[farm.lat, farm.lon]}
              icon={pinIcon(intensityColor(farm.intensity), size, isSelected)}
              eventHandlers={{ click: () => onSelect(farm.id) }}
            >
              <Tooltip direction="top" offset={[0, -size / 2]}>
                <span className="font-semibold">{farm.name}</span>
                <br />
                {farm.intensity.toFixed(2)} t CO{"₂"}e/ha
              </Tooltip>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
