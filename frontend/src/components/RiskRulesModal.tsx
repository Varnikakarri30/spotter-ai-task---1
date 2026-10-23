import React from 'react';
import { X, ShieldAlert, Scale, Award, Info, AlertTriangle } from 'lucide-react';

interface RiskRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesModal: React.FC<RiskRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white m-0">Assessment Risk Rules & Recommendation Hierarchy</h2>
              <p className="text-xs text-slate-400">Strict Source of Truth Specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section 1: Weather Hazard Thresholds */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>1. Weather Hazard Thresholds</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <th className="p-2.5">Condition</th>
                    <th className="p-2.5 text-emerald-400">Low</th>
                    <th className="p-2.5 text-amber-400">Moderate</th>
                    <th className="p-2.5 text-orange-400">High</th>
                    <th className="p-2.5 text-rose-400">Severe</th>
                    <th className="p-2.5 text-rose-500 font-bold">No Travel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-white">Wind Speed</td>
                    <td className="p-2.5">&lt; 25 mph</td>
                    <td className="p-2.5">25–34 mph</td>
                    <td className="p-2.5">35–44 mph</td>
                    <td className="p-2.5">45–54 mph</td>
                    <td className="p-2.5 text-rose-400 font-bold">≥ 55 mph</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-white">Rain Intensity</td>
                    <td className="p-2.5">&lt; 0.10 in/hr</td>
                    <td className="p-2.5">0.10–0.25</td>
                    <td className="p-2.5">0.25–0.50</td>
                    <td className="p-2.5">0.50–1.00</td>
                    <td className="p-2.5 text-rose-400 font-bold">&gt; 1.00 in/hr</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-white">Snowfall Intensity</td>
                    <td className="p-2.5">&lt; 0.5 in/hr</td>
                    <td className="p-2.5">0.5–1.0</td>
                    <td className="p-2.5">1.0–2.0</td>
                    <td className="p-2.5">2.0–3.0</td>
                    <td className="p-2.5 text-rose-400 font-bold">&gt; 3.0 in/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Load Specific Overrides */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>2. Truck Load-Specific Overrides</span>
            </h3>
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-white">≥ 55 mph Wind</span>: Triggers{' '}
                  <span className="text-rose-400 font-bold">No Travel</span> for all vehicle loads.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-white">45–54 mph Wind + Load &gt; 30,000 lb</span>: Triggers{' '}
                  <span className="text-rose-400 font-bold">No Travel</span> override due to high-profile rollover risk.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-white">35–44 mph Wind + Load &gt; 40,000 lb</span>: Promoted to{' '}
                  <span className="text-orange-400 font-bold">Severe</span> risk level.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recommendation Priority */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>3. Exact Lexicographic Route Ranking</span>
            </h3>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2 font-medium">
              <p className="text-slate-400 mb-1">
                Routes are compared and recommended according to the exact strict priority order:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-200">
                <li><span className="font-bold text-white">Fewest Severe miles</span> (Primary Safety Factor)</li>
                <li><span className="font-bold text-white">Fewest High miles</span> (Secondary Hazard Exposure)</li>
                <li><span className="font-bold text-white">Lowest average risk score</span> (1.0 to 5.0 scale)</li>
                <li><span className="font-bold text-white">Shortest travel time</span> (Travel duration tiebreaker)</li>
              </ol>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 flex items-start space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Override:</strong> Any route encountering a No Travel checkpoint is flagged unsafe. Safe routes strictly take precedence over unsafe alternatives.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
