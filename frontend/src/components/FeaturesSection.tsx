import React from 'react';
import { Route, CloudSun, ShieldAlert, Award, Map, Scale } from 'lucide-react';

const FEATURES = [
  {
    icon: Route,
    title: 'Intelligent Route Planning',
    desc: 'Generate up to 3 genuinely distinct physical highway corridors without duplicate paths or fictional geometries.',
  },
  {
    icon: CloudSun,
    title: 'Weather-Aware Checkpoints',
    desc: 'Sample real-time forecasts every 10, 25, or 50 miles, aligned with the truck’s estimated arrival time at each point.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Intelligence',
    desc: 'Categorize hazards into Low, Moderate, High, Severe, and No Travel using continuous wind, rain, and snow thresholds.',
  },
  {
    icon: Award,
    title: 'Smart Recommendation',
    desc: 'Deterministic lexicographical ranking prioritizing fewest Severe miles, lowest High miles, and shortest drive time.',
  },
  {
    icon: Map,
    title: 'Interactive Weather Map',
    desc: 'Inspect road corridors, click checkpoints for micro-telemetry, and scrub future weather with the 0–48h forecast slider.',
  },
  {
    icon: Scale,
    title: 'Load-Aware Safety',
    desc: 'Factor trailer weight (>30k lb and >40k lb) to elevate wind risks and prevent rollover hazards on crosswind highways.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-white border-b border-[#F1E4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-[#EA580C] mb-2">
            Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">
            Built for Commercial Fleet Safety
          </h2>
          <p className="mt-4 text-base text-[#6B7280]">
            Every feature is engineered to provide dispatchers and drivers with deterministic, trustworthy decision support before wheels hit the asphalt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="card-spotter p-6 text-left group hover:border-[#FDBA74]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] border border-[#FDBA74]/40 flex items-center justify-center text-[#EA580C] mb-4 group-hover:scale-105 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#1F2937] mb-2 group-hover:text-[#EA580C] transition">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
