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
      className={`relative rounded-2xl p-4 cursor-pointer transition-all border ${
        isSelected
          ? 'bg-slate-800/95 border-sky-500 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/30'
          : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Top Banner: Recommendation & Safety Badges */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          {route.is_recommended ? (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-sm shadow-emerald-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>RECOMMENDED</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
              Alternative #{route.rank}
            </span>
          )}

          {route.is_safe ? (
            <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span>Safe</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[11px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>No Travel Warning</span>
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-white">{route.formatted_duration}</span>
          <span className="text-xs text-slate-400 block">{route.distance_miles.toFixed(0)} mi</span>
        </div>
      </div>

      <div className="text-xs font-medium text-slate-200 mb-2 truncate">
        {route.name}
      </div>

      {/* Visual Risk Exposure Bar (Segment Miles) */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Corridor Risk Breakdown</span>
          <span>{totalMiles.toFixed(0)} miles</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          {lowPct > 0 && <div style={{ width: `${lowPct}%` }} className="bg-emerald-500" title={`Low Risk: ${route.low_miles} mi`} />}
          {modPct > 0 && <div style={{ width: `${modPct}%` }} className="bg-amber-400" title={`Moderate Risk: ${route.moderate_miles} mi`} />}
          {highPct > 0 && <div style={{ width: `${highPct}%` }} className="bg-orange-500" title={`High Risk: ${route.high_miles} mi`} />}
          {severePct > 0 && <div style={{ width: `${severePct}%` }} className="bg-rose-500" title={`Severe Risk: ${route.severe_miles} mi`} />}
          {noTravelPct > 0 && <div style={{ width: `${noTravelPct}%` }} className="bg-rose-950" title={`No Travel: ${route.no_travel_miles} mi`} />}
        </div>
      </div>

      {/* Lexicographic Evaluation Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 mb-2.5">
        <div className="text-center">
          <div className="text-[10px] uppercase font-semibold text-slate-400">1. Severe Miles</div>
          <div className={`text-sm font-bold ${route.severe_miles > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
            {route.severe_miles.toFixed(1)} mi
          </div>
        </div>
        <div className="text-center border-x border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">2. High Miles</div>
          <div className={`text-sm font-bold ${route.high_miles > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
            {route.high_miles.toFixed(1)} mi
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase font-semibold text-slate-400">3. Avg Risk</div>
          <div className="text-sm font-bold text-sky-400">
            {route.average_risk_score.toFixed(2)}<span className="text-[10px] text-slate-500 font-normal">/5.0</span>
          </div>
        </div>
      </div>

      {/* Rationale explanation */}
      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
        {route.recommendation_reason}
      </p>

      {/* No Travel Alerts if any */}
      {route.has_no_travel && (
        <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
          <div className="font-semibold flex items-center space-x-1 text-rose-400 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
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
