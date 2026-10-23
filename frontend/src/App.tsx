import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TripForm } from './components/TripForm';
import { RouteCard } from './components/RouteCard';
import { MapView } from './components/MapView';
import { ForecastSlider } from './components/ForecastSlider';
import { CheckpointList } from './components/CheckpointList';
import { RiskRulesModal } from './components/RiskRulesModal';
import { fetchHealth, planRoute } from './services/api';
import type { TripInputs, RouteOption, Checkpoint, PlanRouteResponse } from './types';
import { AlertCircle, Compass } from 'lucide-react';


export const App: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Planning state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<PlanRouteResponse | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(1);
  const [focusedCheckpoint, setFocusedCheckpoint] = useState<Checkpoint | null>(null);

  // 0-48h forecast slider & heatmap state
  const [hourOffset, setHourOffset] = useState<number>(0);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState<boolean>(true);
  const [heatmapMetric, setHeatmapMetric] = useState<'risk' | 'wind' | 'precipitation'>('risk');

  // Check backend health on mount
  useEffect(() => {
    fetchHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // Handle route planning submission
  const handlePlanRoute = async (inputs: TripInputs) => {
    setIsLoading(true);
    setError(null);
    setFocusedCheckpoint(null);
    setHourOffset(0);

    try {
      const result = await planRoute(inputs);
      setPlanResult(result);
      if (result.routes && result.routes.length > 0) {
        setSelectedRouteIndex(result.recommended_route_index || result.routes[0].route_index);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to plan route.');
    } finally {
      setIsLoading(false);
    }
  };

  // Selected route object
  const currentRoute: RouteOption | undefined = planResult?.routes.find(
    (r) => r.route_index === selectedRouteIndex
  ) || planResult?.routes[0];

  // Corridor forecast points for the active hour offset
  const corridorPoints = planResult?.corridor_forecast_grid?.[hourOffset] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Brand Header */}
      <Header
        backendOnline={backendOnline}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Route Alternatives Comparison (5 cols on lg) */}
        <section className="lg:col-span-5 space-y-6">
          <TripForm onSubmit={handlePlanRoute} isLoading={isLoading} />

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-200 mb-0.5">Planning Error</div>
                <div className="leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* Route Options Comparison List */}
          {planResult && planResult.routes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Route Alternatives ({planResult.routes.length})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  Ranked by Safety & Risk Exposure
                </span>
              </div>

              {planResult.routing_note && (
                <div className="text-[11px] text-slate-400 italic bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                  ℹ️ {planResult.routing_note}
                </div>
              )}

              <div className="space-y-3">
                {planResult.routes.map((r) => (
                  <RouteCard
                    key={r.route_index}
                    route={r}
                    isSelected={r.route_index === selectedRouteIndex}
                    onSelect={() => {
                      setSelectedRouteIndex(r.route_index);
                      setFocusedCheckpoint(null);
                    }}
                  />
                ))}
              </div>

              {/* Checkpoint Details Drawer for the selected route */}
              {currentRoute && (
                <CheckpointList
                  checkpoints={currentRoute.checkpoints}
                  onFocusCheckpoint={(cp) => setFocusedCheckpoint(cp)}
                  selectedCheckpointIndex={focusedCheckpoint?.index}
                />
              )}
            </div>
          )}
        </section>

        {/* Right Column: Interactive Map & 0-48h Forecast Slider (7 cols on lg) */}
        <section className="lg:col-span-7 space-y-4 lg:sticky lg:top-20">
          {/* 0-48h Forecast Slider Control */}
          <ForecastSlider
            departureTime={planResult?.departure_time || new Date().toISOString()}
            hourOffset={hourOffset}
            onHourOffsetChange={(h) => setHourOffset(h)}
            heatmapMetric={heatmapMetric}
            onHeatmapMetricChange={(m) => setHeatmapMetric(m)}
            isHeatmapVisible={isHeatmapVisible}
            onToggleHeatmap={() => setIsHeatmapVisible(!isHeatmapVisible)}
          />

          {/* Main Leaflet Map View */}
          <MapView
            routes={planResult ? planResult.routes : []}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={(idx) => {
              setSelectedRouteIndex(idx);
              setFocusedCheckpoint(null);
            }}
            hourOffset={hourOffset}
            corridorForecastPoints={corridorPoints}
            isHeatmapVisible={isHeatmapVisible}
            heatmapMetric={heatmapMetric}
            focusedCheckpoint={focusedCheckpoint}
          />
        </section>
      </main>

      {/* Risk Rules & Assessment Specifications Modal */}
      <RiskRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};

export default App;
