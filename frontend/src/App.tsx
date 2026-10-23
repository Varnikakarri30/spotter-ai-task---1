import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { SafetySection } from './components/SafetySection';
import { Footer } from './components/Footer';
import { TripForm } from './components/TripForm';
import { RouteCard } from './components/RouteCard';
import { MapView } from './components/MapView';
import { ForecastSlider } from './components/ForecastSlider';
import { CheckpointList } from './components/CheckpointList';
import { RiskRulesModal } from './components/RiskRulesModal';
import { fetchHealth, planRoute } from './services/api';
import type { TripInputs, RouteOption, Checkpoint, PlanRouteResponse } from './types';
import { AlertCircle, Compass, ArrowLeft, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'landing' | 'planner'>('landing');
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

  const handleStartPlanning = () => {
    setActiveView('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreHowItWorks = () => {
    if (activeView !== 'landing') {
      setActiveView('landing');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Selected route object
  const currentRoute: RouteOption | undefined = planResult?.routes.find(
    (r) => r.route_index === selectedRouteIndex
  ) || planResult?.routes[0];

  // Corridor forecast points for the active hour offset
  const corridorPoints = planResult?.corridor_forecast_grid?.[hourOffset] || [];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F2937] flex flex-col font-sans selection:bg-[#FDBA74] selection:text-[#1F2937]">
      {/* Universal Navigation */}
      <Navbar
        backendOnline={backendOnline}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main View Switcher */}
      {activeView === 'landing' ? (
        /* Immersive Landing Page View */
        <main className="flex-1 flex flex-col">
          <HeroSection
            onPlanRouteClick={handleStartPlanning}
            onExploreClick={handleExploreHowItWorks}
          />
          <FeaturesSection />
          <HowItWorksSection onStartPlanning={handleStartPlanning} />
          <SafetySection
            onPlanRouteClick={handleStartPlanning}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        </main>
      ) : (
        /* Operational Route Planner & Control Center View */
        <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Planner Control Header & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#F1E4D8]">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveView('landing');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-1 text-xs font-semibold text-[#6B7280] hover:text-[#EA580C] transition py-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
                <span className="text-xs text-[#9CA3AF]">/</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#EA580C] border border-[#FDBA74]/50">
                  Control Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937]">
                Freight Routing & Safety Operations
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Evaluate up to 3 physical highway corridors against live arrival-time weather forecasts and rollover thresholds.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-[#F1E4D8] hover:bg-[#FFF9F4] text-xs font-semibold text-[#4B5563] hover:text-[#EA580C] shadow-2xs transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
                <span>Threshold Rules</span>
              </button>
            </div>
          </div>

          {/* Operational Grid: Form & Routes (Left) vs Forecast Slider & Map (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start flex-1">
            {/* Left Column: Form & Route Alternatives (5 cols on lg) */}
            <section className="lg:col-span-5 space-y-6">
              <TripForm onSubmit={handlePlanRoute} isLoading={isLoading} />

              {/* Error Banner */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900 mb-0.5">Planning Error</div>
                    <div className="leading-relaxed">{error}</div>
                  </div>
                </div>
              )}

              {/* Route Options Comparison List */}
              {planResult && planResult.routes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-[#EA580C]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                        Route Alternatives ({planResult.routes.length})
                      </h2>
                    </div>
                    <span className="text-[11px] text-[#6B7280] font-medium">
                      Ranked by Safety & Risk Exposure
                    </span>
                  </div>

                  {planResult.routing_note && (
                    <div className="text-[11px] text-[#6B7280] italic bg-[#FFF9F4] px-3.5 py-2 rounded-xl border border-[#F1E4D8]">
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
          </div>
        </main>
      )}

      {/* Universal Polished Footer */}
      <Footer
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onSelectView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Risk Rules & Assessment Specifications Modal */}
      <RiskRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};

export default App;

