import React from 'react';
import { Navigation, ArrowRight, ShieldCheck, Wind, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onPlanRouteClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onPlanRouteClick,
  onExploreClick,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF9F4] to-white pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#F1E4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#FFF3E8] border border-[#FDBA74]/50 text-xs font-semibold text-[#EA580C]">
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
              <span>Commercial Freight Intelligence Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1F2937] leading-[1.12]">
              Every Mile. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#EA580C]">
                Smarter. Safer.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-xl">
              Plan smarter truck journeys with AI-powered route intelligence and weather risk insights at every checkpoint. Protect drivers, prevent rollover hazards, and optimize transit times.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <button
                onClick={onPlanRouteClick}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm shadow-md shadow-orange-500/25 transition group cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Plan a Route</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={onExploreClick}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#FFF9F4] text-[#1F2937] font-semibold text-sm border border-[#F1E4D8] transition shadow-xs cursor-pointer"
              >
                <span>Explore How It Works</span>
              </button>
            </div>

            <div className="flex items-center space-x-6 pt-4 text-xs font-medium text-[#6B7280]">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>3 Genuine Corridor Routes</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Real Hourly Forecasts</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Trailer Weight Overrides</span>
              </div>
            </div>
          </div>

          {/* Right Column: Stylized Minimalist Route Visual */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl bg-white border border-[#F1E4D8] p-6 shadow-xl shadow-orange-500/5 overflow-hidden">
              {/* Subtle map grid background */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#1F2937 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Header inside card */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1E4D8]">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Live Route Simulation
                  </div>
                  <div className="text-sm font-bold text-[#1F2937]">Chicago, IL → Denver, CO</div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recommended Path
                </span>
              </div>

              {/* Animated Interactive Route SVG */}
              <div className="relative h-64 w-full bg-[#FFF9F4] rounded-xl border border-[#F1E4D8] overflow-hidden flex items-center justify-center p-4">
                <svg
                  viewBox="0 0 500 240"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Faint alternative route 2 (dashed) */}
                  <path
                    d="M 50 180 Q 200 210, 450 70"
                    stroke="#CBD5E1"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />
                  {/* Faint alternative route 3 (dashed) */}
                  <path
                    d="M 50 180 Q 220 50, 450 70"
                    stroke="#E2E8F0"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />

                  {/* Primary Recommended Route Path */}
                  <path
                    d="M 50 180 Q 180 130, 310 110 T 450 70"
                    stroke="#FDBA74"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <path
                    d="M 50 180 Q 180 130, 310 110 T 450 70"
                    stroke="#F97316"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Checkpoint Nodes */}
                  <circle cx="50" cy="180" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="150" cy="148" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="250" cy="120" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="350" cy="98" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="450" cy="70" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                  {/* Start / End Labels */}
                  <text x="45" y="205" fill="#4B5563" fontSize="10" fontWeight="bold">
                    Chicago
                  </text>
                  <text x="420" y="55" fill="#4B5563" fontSize="10" fontWeight="bold">
                    Denver
                  </text>
                </svg>

                {/* Floating Telemetry Pill 1 */}
                <div className="absolute top-3 left-4 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-[#F1E4D8] shadow-sm text-[11px] space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-[#1F2937] font-semibold">
                    <Wind className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Crosswind: 28 mph</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    ✓ Safe for 38k lb Load
                  </div>
                </div>

                {/* Floating Telemetry Pill 2 */}
                <div className="absolute bottom-3 right-4 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-[#F1E4D8] shadow-sm text-[11px] space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-[#1F2937] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>0 Severe Miles</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280]">
                    17h 48m transit time
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-4 pt-3 border-t border-[#F1E4D8] grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Corridor Miles</div>
                  <div className="font-bold text-[#1F2937]">1,005 mi</div>
                </div>
                <div className="border-x border-[#F1E4D8]">
                  <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Checkpoints</div>
                  <div className="font-bold text-[#1F2937]">41 Points</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Risk Rating</div>
                  <div className="font-bold text-emerald-600">1.0 / 5.0 (Low)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
