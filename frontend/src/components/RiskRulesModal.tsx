import React from 'react';
import { X, ShieldAlert, Scale, Award, Info, AlertTriangle } from 'lucide-react';

interface RiskRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesModal: React.FC<RiskRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-left">
      <div className="relative w-full max-w-2xl bg-white border border-[#F1E4D8] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F1E4D8] bg-[#FFF9F4]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] text-[#EA580C] flex items-center justify-center border border-[#FDBA74]/50">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937] m-0">Assessment Risk Rules & Ranking Hierarchy</h2>
              <p className="text-xs text-[#6B7280]">Strict Source of Truth Specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#374151]">
          {/* Section 1: Weather Hazard Thresholds */}
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-2 flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#EA580C]" />
              <span>1. Weather Hazard Thresholds</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#F1E4D8]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF9F4] text-[#4B5563] font-semibold border-b border-[#F1E4D8]">
                    <th className="p-2.5">Condition</th>
                    <th className="p-2.5 text-emerald-600">Low</th>
                    <th className="p-2.5 text-amber-600">Moderate</th>
                    <th className="p-2.5 text-orange-600">High</th>
                    <th className="p-2.5 text-rose-600">Severe</th>
                    <th className="p-2.5 text-red-800 font-bold">No Travel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E4D8] font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-[#1F2937]">Wind Speed</td>
                    <td className="p-2.5">&lt; 25 mph</td>
                    <td className="p-2.5">25–34 mph</td>
                    <td className="p-2.5">35–44 mph</td>
                    <td className="p-2.5">45–54 mph</td>
                    <td className="p-2.5 text-red-700 font-bold">≥ 55 mph</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-[#1F2937]">Rain Intensity</td>
                    <td className="p-2.5">&lt; 0.10 in/hr</td>
                    <td className="p-2.5">0.10–0.25</td>
                    <td className="p-2.5">0.25–0.50</td>
                    <td className="p-2.5">0.50–1.00</td>
                    <td className="p-2.5 text-red-700 font-bold">&gt; 1.00 in/hr</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-[#1F2937]">Snowfall Intensity</td>
                    <td className="p-2.5">&lt; 0.5 in/hr</td>
                    <td className="p-2.5">0.5–1.0</td>
                    <td className="p-2.5">1.0–2.0</td>
                    <td className="p-2.5">2.0–3.0</td>
                    <td className="p-2.5 text-red-700 font-bold">&gt; 3.0 in/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Load Specific Overrides */}
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-2 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-[#EA580C]" />
              <span>2. Truck Load-Specific Overrides</span>
            </h3>
            <div className="space-y-2.5 bg-[#FFF9F4] p-4 rounded-xl border border-[#F1E4D8]">
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-[#1F2937]">≥ 55 mph Wind</span>: Triggers{' '}
                  <span className="text-red-700 font-bold">No Travel</span> for all vehicle loads.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-[#1F2937]">45–54 mph Wind + Load &gt; 30,000 lb</span>: Triggers{' '}
                  <span className="text-red-700 font-bold">No Travel</span> override due to high-profile rollover risk.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-600 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-[#1F2937]">35–44 mph Wind + Load &gt; 40,000 lb</span>: Promoted to{' '}
                  <span className="text-orange-600 font-bold">Severe</span> risk level.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recommendation Priority */}
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>3. Exact Lexicographic Route Ranking</span>
            </h3>
            <div className="bg-[#FFF9F4] p-4 rounded-xl border border-[#F1E4D8] space-y-2">
              <p className="text-[#6B7280] mb-1">
                Routes are compared and recommended according to the exact strict priority order:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[#374151] font-medium">
                <li><span className="font-bold text-[#1F2937]">Fewest Severe miles</span> (Primary Safety Factor)</li>
                <li><span className="font-bold text-[#1F2937]">Fewest High miles</span> (Secondary Hazard Exposure)</li>
                <li><span className="font-bold text-[#1F2937]">Lowest average risk score</span> (1.0 to 5.0 scale)</li>
                <li><span className="font-bold text-[#1F2937]">Shortest travel time</span> (Travel duration tiebreaker)</li>
              </ol>
              <div className="mt-2.5 pt-2.5 border-t border-[#F1E4D8] text-[11px] text-[#B45309] flex items-start space-x-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Override:</strong> Any route encountering a No Travel checkpoint is flagged unsafe. Safe routes strictly take precedence over unsafe alternatives.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1E4D8] bg-white text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
