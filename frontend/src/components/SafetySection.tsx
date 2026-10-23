import React from 'react';
import { AlertTriangle, ShieldCheck, Scale, ArrowRight } from 'lucide-react';

interface SafetySectionProps {
  onPlanRouteClick: () => void;
  onOpenRulesModal: () => void;
}

export const SafetySection: React.FC<SafetySectionProps> = ({
  onPlanRouteClick,
  onOpenRulesModal,
}) => {
  return (
    <section id="safety" className="py-20 bg-white border-b border-[#F1E4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FFF9F4] border border-[#F1E4D8] p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="max-w-3xl space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFF3E8] text-xs font-semibold text-[#EA580C] border border-[#FDBA74]/40">
              <ShieldCheck className="w-4 h-4" />
              <span>Safety & Risk Engineering</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Why Weather Awareness Matters for Commercial Freight
            </h2>

            <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
              Standard GPS navigation systems optimize exclusively for mileage and traffic delay. They do not account for high-profile trailer aerodynamics, sudden crosswind gusts on mountain passes, or icing intensity at specific arrival times.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-[#F1E4D8]">
                <div className="flex items-center space-x-2 text-[#DC2626] font-bold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Crosswind Rollover Hazards</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Winds of 45–54 mph with loads over 30,000 lbs trigger automatic No Travel safety overrides to protect drivers from trailer turnover.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#F1E4D8]">
                <div className="flex items-center space-x-2 text-[#EA580C] font-bold text-sm mb-1">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>Dynamic Heavy-Load Rules</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Heavier rigs (over 40,000 lbs) facing 35–44 mph winds are escalated to Severe risk due to increased braking distance and lateral momentum.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                onClick={onPlanRouteClick}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <span>Plan a Route Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenRulesModal}
                className="text-xs font-semibold text-[#EA580C] hover:underline py-2"
              >
                View Full Assessment Risk Threshold Table →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
