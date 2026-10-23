import React from 'react';
import type { RouteOption } from '../types';
import { Award, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect }) => {
  const totalMiles = route.distance_miles || 1;
  const lowPct = Math.round((route.low_miles / totalMiles) * 100);
  const modPct = Math.round((route.moderate_miles / totalMiles) * 100);
  const highPct = Math.round((route.high_miles / totalMiles) * 100);
  const severePct = Math.round((route.severe_miles / totalMiles) * 100);
  const noTravelPct = Math.round((route.no_travel_miles / totalMiles) * 100);

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-4.5 cursor-pointer transition-all border text-left ${
        isSelected
          ? 'bg-white border-[#F97316] shadow-md shadow-orange-500/10 ring-2 ring-[#F97316]/20'
          : 'bg-white border-[#F1E4D8] hover:border-[#FDBA74] hover:shadow-xs'
      }`}
    >
      {/* Top Bar: Badges & Travel Time */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          {route.is_recommended ? (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FFF3E8] text-[#EA580C] border border-[#FDBA74] text-[11px] font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>RECOMMENDED</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#6B7280] text-xs font-semibold border border-slate-200">
              Option #{route.rank}
            </span>
          )}

          {route.is_safe ? (
            <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Safe</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>No Travel Hazard</span>
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-[#1F2937]">{route.formatted_duration}</span>
          <span className="text-xs text-[#6B7280] block font-medium">{route.distance_miles.toFixed(0)} mi</span>
        </div>
      </div>

      <div className="text-xs font-semibold text-[#1F2937] mb-2 truncate">
        {route.name}
      </div>

      {/* Visual Risk Exposure Bar (Segment Miles) */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#6B7280] font-medium mb-1">
          <span>Corridor Risk Breakdown</span>
          <span>{totalMiles.toFixed(0)} miles</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/60">
          {lowPct > 0 && <div style={{ width: `${lowPct}%` }} className="bg-emerald-500" title={`Low Risk: ${route.low_miles} mi`} />}
          {modPct > 0 && <div style={{ width: `${modPct}%` }} className="bg-amber-400" title={`Moderate Risk: ${route.moderate_miles} mi`} />}
          {highPct > 0 && <div style={{ width: `${highPct}%` }} className="bg-orange-500" title={`High Risk: ${route.high_miles} mi`} />}
          {severePct > 0 && <div style={{ width: `${severePct}%` }} className="bg-red-600" title={`Severe Risk: ${route.severe_miles} mi`} />}
          {noTravelPct > 0 && <div style={{ width: `${noTravelPct}%` }} className="bg-rose-950" title={`No Travel: ${route.no_travel_miles} mi`} />}
        </div>
      </div>

      {/* Lexicographic Evaluation Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-[#FFF9F4] p-2.5 rounded-xl border border-[#F1E4D8] mb-2.5">
        <div className="text-center">
          <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">1. Severe Miles</div>
          <div className={`text-sm font-extrabold ${route.severe_miles > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {route.severe_miles.toFixed(1)} mi
          </div>
        </div>
        <div className="text-center border-x border-[#F1E4D8]">
          <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">2. High Miles</div>
          <div className={`text-sm font-extrabold ${route.high_miles > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
            {route.high_miles.toFixed(1)} mi
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase font-bold text-[#9CA3AF]">3. Avg Risk</div>
          <div className="text-sm font-extrabold text-[#1F2937]">
            {route.average_risk_score.toFixed(2)}<span className="text-[10px] text-[#9CA3AF] font-normal">/5.0</span>
          </div>
        </div>
      </div>

      {/* Rationale explanation */}
      <p className="text-[11px] text-[#4B5563] leading-relaxed bg-white p-2.5 rounded-lg border border-[#F1E4D8]">
        {route.recommendation_reason}
      </p>

      {/* No Travel Alerts if any */}
      {route.has_no_travel && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
          <div className="font-bold flex items-center space-x-1 text-rose-700 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Hazard Alert: No Travel Condition</span>
          </div>
          {route.no_travel_reasons.map((r, i) => (
            <div key={i} className="pl-4 text-[10px] leading-tight list-disc">
              • {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
