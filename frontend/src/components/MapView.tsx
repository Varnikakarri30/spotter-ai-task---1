import React, { useEffect, useMemo } from 'react';
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

// Risk color mapping
export const RISK_COLORS: Record<RiskLevel, string> = {
  'Low': '#10b981',
  'Moderate': '#eab308',
  'High': '#f97316',
  'Severe': '#ef4444',
  'No Travel': '#7f1d1d',
  'Unknown': '#64748b',
};

// Auto fit bounds helper component
const MapBoundsFitter: React.FC<{ coordinates: [number, number][]; focusedCheckpoint: Checkpoint | null }> = ({
  coordinates,
  focusedCheckpoint,
}) => {
  const map = useMap();

  useEffect(() => {
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

// Create custom origin / destination icons
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="background-color: ${color}; color: white; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; white-space: nowrap;">
        ${label}
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 24],
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
      if (w >= 55) return { color: '#7f1d1d', radius: 18, opacity: 0.85 };
      if (w >= 45) return { color: '#ef4444', radius: 16, opacity: 0.75 };
      if (w >= 35) return { color: '#f97316', radius: 14, opacity: 0.65 };
      if (w >= 25) return { color: '#eab308', radius: 12, opacity: 0.55 };
      return { color: '#0ea5e9', radius: 9, opacity: 0.4 };
    } else if (heatmapMetric === 'precipitation') {
      const p = pt.rain_in_hr + pt.snow_in_hr;
      if (p > 1.0) return { color: '#7f1d1d', radius: 18, opacity: 0.85 };
      if (p >= 0.5) return { color: '#ef4444', radius: 16, opacity: 0.75 };
      if (p >= 0.25) return { color: '#f97316', radius: 14, opacity: 0.65 };
      if (p >= 0.1) return { color: '#38bdf8', radius: 12, opacity: 0.55 };
      return { color: '#10b981', radius: 9, opacity: 0.35 };
    } else {
      // Risk metric
      let score = 1;
      if (pt.wind_mph >= 55 || pt.rain_in_hr > 1.0 || pt.snow_in_hr > 3.0) score = 5;
      else if (pt.wind_mph >= 45 || pt.rain_in_hr >= 0.5 || pt.snow_in_hr >= 2.0) score = 4;
      else if (pt.wind_mph >= 35 || pt.rain_in_hr >= 0.25 || pt.snow_in_hr >= 1.0) score = 3;
      else if (pt.wind_mph >= 25 || pt.rain_in_hr >= 0.1 || pt.snow_in_hr >= 0.5) score = 2;

      switch (score) {
        case 5: return { color: '#7f1d1d', radius: 18, opacity: 0.85 };
        case 4: return { color: '#ef4444', radius: 16, opacity: 0.75 };
        case 3: return { color: '#f97316', radius: 14, opacity: 0.65 };
        case 2: return { color: '#eab308', radius: 12, opacity: 0.55 };
        default: return { color: '#10b981', radius: 9, opacity: 0.4 };
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[680px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Sleek Dark CartoDB Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapBoundsFitter coordinates={allCoordinates} focusedCheckpoint={focusedCheckpoint} />

        {/* 1. Render Non-selected Route Polylines first (in background) */}
        {routes
          .filter((r) => r.route_index !== selectedRoute?.route_index)
          .map((r) => (
            <Polyline
              key={`alt-route-${r.route_index}`}
              positions={r.coordinates}
              pathOptions={{
                color: '#64748b',
                weight: 4,
                opacity: 0.55,
                dashArray: '8, 8',
              }}
              eventHandlers={{
                click: () => onSelectRoute(r.route_index),
              }}
            >
              <Popup>
                <div className="p-2 text-xs">
                  <div className="font-bold text-slate-200">{r.name}</div>
                  <div className="text-slate-400">{r.distance_miles} mi • {r.formatted_duration}</div>
                  <button
                    onClick={() => onSelectRoute(r.route_index)}
                    className="mt-1.5 px-2 py-1 bg-sky-600 text-white rounded text-[10px] font-semibold"
                  >
                    Select this Route
                  </button>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* 2. Render Selected Route Polyline (Glow & Bold) */}
        {selectedRoute && (
          <>
            {/* Outer Glow */}
            <Polyline
              positions={selectedRoute.coordinates}
              pathOptions={{
                color: selectedRoute.is_recommended ? '#06b6d4' : '#6366f1',
                weight: 10,
                opacity: 0.3,
              }}
            />
            {/* Core Path */}
            <Polyline
              positions={selectedRoute.coordinates}
              pathOptions={{
                color: selectedRoute.is_recommended ? '#38bdf8' : '#818cf8',
                weight: 5,
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
            const riskColor = RISK_COLORS[cp.overall_risk] || '#64748b';
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
                  color: isNoTravel ? '#ffffff' : '#0f172a',
                  weight: isNoTravel ? 2.5 : 1.5,
                }}
              >
                <Popup>
                  <div className="p-3 text-xs w-60">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                      <div>
                        <div className="font-bold text-white text-sm">
                          Checkpoint #{cp.index + 1}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mile {cp.distance_from_origin_miles.toFixed(1)} (Represents {cp.segment_miles.toFixed(1)} mi)
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: riskColor }}
                      >
                        {cp.overall_risk}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-300 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          <span>Estimated Arrival:</span>
                        </span>
                        <span className="font-semibold text-white">
                          {new Date(cp.estimated_arrival_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1 text-slate-400">
                          <Wind className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Wind Speed:</span>
                        </span>
                        <span className="font-semibold text-white">
                          {cp.wind_mph !== null ? `${cp.wind_mph} mph` : 'Missing'}
                          <span className="text-[10px] ml-1 text-slate-400">({cp.wind_risk})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1 text-slate-400">
                          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                          <span>Rain Intensity:</span>
                        </span>
                        <span className="font-semibold text-white">
                          {cp.rain_in_hr !== null ? `${cp.rain_in_hr} in/hr` : 'Missing'}
                          <span className="text-[10px] ml-1 text-slate-400">({cp.rain_risk})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1 text-slate-400">
                          <Snowflake className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Snowfall:</span>
                        </span>
                        <span className="font-semibold text-white">
                          {cp.snow_in_hr !== null ? `${cp.snow_in_hr} in/hr` : 'Missing'}
                          <span className="text-[10px] ml-1 text-slate-400">({cp.snow_risk})</span>
                        </span>
                      </div>
                    </div>

                    {/* Load Override Alert */}
                    {cp.load_override_applied && (
                      <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-start space-x-1 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{cp.override_reason}</span>
                      </div>
                    )}

                    {/* Missing Data Warning */}
                    {cp.has_missing_data && (
                      <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 mt-1">
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
          <Marker position={[originCoord[0], originCoord[1]]} icon={createPinIcon('#10b981', 'START')} />
        )}
        {destCoord && (
          <Marker position={[destCoord[0], destCoord[1]]} icon={createPinIcon('#ef4444', 'END')} />
        )}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-card rounded-xl p-2.5 border border-slate-700/80 shadow-xl max-w-xs pointer-events-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Weather Risk Severity
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-300">Low</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-300">Moderate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span className="text-slate-300">High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-300">Severe</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-950 border border-rose-500 inline-block" />
            <span className="text-rose-400 font-bold">No Travel</span>
          </span>
        </div>
      </div>
    </div>
  );
};
