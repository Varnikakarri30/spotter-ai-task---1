import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { RouteOption, Checkpoint, CorridorForecastPoint, RiskLevel } from '../types';
import { Wind, CloudRain, Snowflake, AlertTriangle, Clock } from 'lucide-react';

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteIndex: number;
  onSelectRoute: (idx: number) => void;
  hourOffset: number;
  corridorForecastPoints: CorridorForecastPoint[];
  isHeatmapVisible: boolean;
  heatmapMetric: 'risk' | 'wind' | 'precipitation';
  focusedCheckpoint: Checkpoint | null;
}

// Semantic Risk color mapping (distinct from brand orange)
export const RISK_COLORS: Record<RiskLevel, string> = {
  'Low': '#10B981',
  'Moderate': '#F59E0B',
  'High': '#EA580C',
  'Severe': '#DC2626',
  'No Travel': '#7F1D1D',
  'Unknown': '#94A3B8',
};

// Auto fit bounds helper component
const MapBoundsFitter: React.FC<{ coordinates: [number, number][]; focusedCheckpoint: Checkpoint | null }> = ({
  coordinates,
  focusedCheckpoint,
}) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately so Leaflet recalculates container dimensions
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (focusedCheckpoint) {
      map.flyTo([focusedCheckpoint.latitude, focusedCheckpoint.longitude], 9, { duration: 1 });
      return;
    }

    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [coordinates, focusedCheckpoint, map]);

  return null;
};

// Create custom origin / destination pins
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="background-color: ${color}; color: white; font-weight: 700; font-size: 10px; letter-spacing: 0.5px; padding: 4px 9px; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; white-space: nowrap;">
        ${label}
      </div>
    `,
    iconSize: [64, 24],
    iconAnchor: [32, 24],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  hourOffset,
  corridorForecastPoints,
  isHeatmapVisible,
  heatmapMetric,
  focusedCheckpoint,
}) => {
  const [tileTheme, setTileTheme] = useState<'osm' | 'gray' | 'streets'>('osm');
  const selectedRoute = routes.find((r) => r.route_index === selectedRouteIndex) || routes[0];

  // All coordinates for auto bounds
  const allCoordinates = useMemo(() => {
    return selectedRoute ? selectedRoute.coordinates : [];
  }, [selectedRoute]);

  const originCoord = selectedRoute?.coordinates[0];
  const destCoord = selectedRoute?.coordinates[selectedRoute.coordinates.length - 1];

  // Heatmap color evaluator
  const getHeatmapColorAndRadius = (pt: CorridorForecastPoint) => {
    if (heatmapMetric === 'wind') {
      const w = pt.wind_mph;
      if (w >= 55) return { color: '#7F1D1D', radius: 18, opacity: 0.85 };
      if (w >= 45) return { color: '#DC2626', radius: 16, opacity: 0.75 };
      if (w >= 35) return { color: '#EA580C', radius: 14, opacity: 0.65 };
      if (w >= 25) return { color: '#F59E0B', radius: 12, opacity: 0.55 };
      return { color: '#0EA5E9', radius: 9, opacity: 0.4 };
    } else if (heatmapMetric === 'precipitation') {
      const p = pt.rain_in_hr + pt.snow_in_hr;
      if (p > 1.0) return { color: '#7F1D1D', radius: 18, opacity: 0.85 };
      if (p >= 0.5) return { color: '#DC2626', radius: 16, opacity: 0.75 };
      if (p >= 0.25) return { color: '#EA580C', radius: 14, opacity: 0.65 };
      if (p >= 0.1) return { color: '#0284C7', radius: 12, opacity: 0.55 };
      return { color: '#10B981', radius: 9, opacity: 0.35 };
    } else {
      // Risk metric
      let score = 1;
      if (pt.wind_mph >= 55 || pt.rain_in_hr > 1.0 || pt.snow_in_hr > 3.0) score = 5;
      else if (pt.wind_mph >= 45 || pt.rain_in_hr >= 0.5 || pt.snow_in_hr >= 2.0) score = 4;
      else if (pt.wind_mph >= 35 || pt.rain_in_hr >= 0.25 || pt.snow_in_hr >= 1.0) score = 3;
      else if (pt.wind_mph >= 25 || pt.rain_in_hr >= 0.1 || pt.snow_in_hr >= 0.5) score = 2;

      switch (score) {
        case 5: return { color: '#7F1D1D', radius: 18, opacity: 0.85 };
        case 4: return { color: '#DC2626', radius: 16, opacity: 0.75 };
        case 3: return { color: '#EA580C', radius: 14, opacity: 0.65 };
        case 2: return { color: '#F59E0B', radius: 12, opacity: 0.55 };
        default: return { color: '#10B981', radius: 9, opacity: 0.4 };
      }
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-[#F1E4D8] shadow-sm bg-white"
      style={{ height: '620px', minHeight: '520px' }}
    >
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        {/* Unwatermarked Free Open Tile Layers */}
        {tileTheme === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        ) : tileTheme === 'gray' ? (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapBoundsFitter coordinates={allCoordinates} focusedCheckpoint={focusedCheckpoint} />

        {/* 1. Render Non-selected Route Polylines first (in background) */}
        {routes
          .filter((r) => r.route_index !== selectedRoute?.route_index)
          .map((r) => (
            <Polyline
              key={`alt-route-${r.route_index}`}
              positions={r.coordinates}
              pathOptions={{
                color: '#94A3B8',
                weight: 4,
                opacity: 0.65,
                dashArray: '6, 6',
              }}
              eventHandlers={{
                click: () => onSelectRoute(r.route_index),
              }}
            >
              <Popup>
                <div className="p-3 text-xs min-w-44">
                  <div className="font-bold text-[#1F2937] text-sm">{r.name}</div>
                  <div className="text-[#6B7280] my-1">{r.distance_miles.toFixed(0)} mi • {r.formatted_duration}</div>
                  <button
                    onClick={() => onSelectRoute(r.route_index)}
                    className="mt-2 w-full py-1.5 px-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Select Option #{r.rank}
                  </button>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* 2. Render Selected Route Polyline */}
        {selectedRoute && (
          <>
            {/* Outer Subtle Highlight */}
            <Polyline
              positions={selectedRoute.coordinates}
              pathOptions={{
                color: selectedRoute.is_recommended ? '#FDBA74' : '#CBD5E1',
                weight: 9,
                opacity: 0.45,
              }}
            />
            {/* Core Path */}
            <Polyline
              positions={selectedRoute.coordinates}
              pathOptions={{
                color: selectedRoute.is_recommended ? '#F97316' : '#475569',
                weight: 4.5,
                opacity: 0.95,
              }}
            />
          </>
        )}

        {/* 3. Weather Corridor Heatmap Halos (Slider-controlled) */}
        {isHeatmapVisible &&
          corridorForecastPoints.map((pt, idx) => {
            const { color, radius, opacity } = getHeatmapColorAndRadius(pt);
            return (
              <CircleMarker
                key={`heat-${idx}-${hourOffset}`}
                center={[pt.latitude, pt.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: opacity,
                  stroke: false,
                }}
              />
            );
          })}

        {/* 4. Checkpoints for Selected Route */}
        {selectedRoute &&
          selectedRoute.checkpoints.map((cp) => {
            const riskColor = RISK_COLORS[cp.overall_risk] || '#94A3B8';
            const isNoTravel = cp.overall_risk === 'No Travel';
            const isSevere = cp.overall_risk === 'Severe';

            return (
              <CircleMarker
                key={`cp-${cp.index}`}
                center={[cp.latitude, cp.longitude]}
                radius={isNoTravel ? 8 : isSevere ? 7 : 5.5}
                pathOptions={{
                  fillColor: riskColor,
                  fillOpacity: 1,
                  color: '#FFFFFF',
                  weight: isNoTravel ? 2.5 : 1.5,
                }}
              >
                <Popup>
                  <div className="p-3.5 text-xs w-64 bg-white">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F1E4D8]">
                      <div>
                        <div className="font-bold text-[#1F2937] text-sm">
                          Checkpoint #{cp.index + 1}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          Mile {cp.distance_from_origin_miles.toFixed(1)} (Represents {cp.segment_miles.toFixed(1)} mi)
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: riskColor }}
                      >
                        {cp.overall_risk}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[#374151] mb-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-[#6B7280]">
                          <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                          <span>Estimated Arrival:</span>
                        </span>
                        <span className="font-semibold text-[#1F2937]">
                          {new Date(cp.estimated_arrival_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-[#6B7280]">
                          <Wind className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>Wind Speed:</span>
                        </span>
                        <span className="font-semibold text-[#1F2937]">
                          {cp.wind_mph !== null ? `${cp.wind_mph} mph` : 'Missing'}
                          <span className="text-[10px] ml-1 text-[#6B7280]">({cp.wind_risk})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-[#6B7280]">
                          <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                          <span>Rain Intensity:</span>
                        </span>
                        <span className="font-semibold text-[#1F2937]">
                          {cp.rain_in_hr !== null ? `${cp.rain_in_hr} in/hr` : 'Missing'}
                          <span className="text-[10px] ml-1 text-[#6B7280]">({cp.rain_risk})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-[#6B7280]">
                          <Snowflake className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Snowfall:</span>
                        </span>
                        <span className="font-semibold text-[#1F2937]">
                          {cp.snow_in_hr !== null ? `${cp.snow_in_hr} in/hr` : 'Missing'}
                          <span className="text-[10px] ml-1 text-[#6B7280]">({cp.snow_risk})</span>
                        </span>
                      </div>
                    </div>

                    {/* Load Override Alert */}
                    {cp.load_override_applied && (
                      <div className="p-2 rounded-lg bg-[#FFF3E8] border border-[#FDBA74] text-[11px] text-[#EA580C] flex items-start space-x-1.5 mt-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                        <span>{cp.override_reason}</span>
                      </div>
                    )}

                    {/* Missing Data Warning */}
                    {cp.has_missing_data && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 mt-1.5 font-medium">
                        ⚠️ Incomplete forecast telemetry at this coordinate.
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 5. Origin and Destination Pins */}
        {originCoord && (
          <Marker position={[originCoord[0], originCoord[1]]} icon={createPinIcon('#10B981', 'START')} />
        )}
        {destCoord && (
          <Marker position={[destCoord[0], destCoord[1]]} icon={createPinIcon('#DC2626', 'DEST')} />
        )}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-[#F1E4D8] shadow-md max-w-sm pointer-events-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Weather Risk Severity
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setTileTheme(tileTheme === 'osm' ? 'gray' : tileTheme === 'gray' ? 'streets' : 'osm')}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFF9F4] hover:bg-[#FFF3E8] text-[#EA580C] font-semibold border border-[#F1E4D8] transition cursor-pointer"
              title="Switch Map Tiles (OpenStreetMap / Light Gray / Streets)"
            >
              {tileTheme === 'osm' ? 'Map: OSM' : tileTheme === 'gray' ? 'Map: Light Gray' : 'Map: Streets'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-1 ring-emerald-600/20" />
            <span className="text-[#374151] font-medium">Low</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ring-1 ring-amber-600/20" />
            <span className="text-[#374151] font-medium">Moderate</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] inline-block ring-1 ring-orange-600/20" />
            <span className="text-[#374151] font-medium">High</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block ring-1 ring-rose-700/20" />
            <span className="text-[#374151] font-medium">Severe</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-600 inline-block" />
            <span className="text-red-800 font-bold">No Travel</span>
          </span>
        </div>
      </div>
    </div>
  );
};

