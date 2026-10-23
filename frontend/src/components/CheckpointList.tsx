import React, { useState } from 'react';
import type { Checkpoint } from '../types';
import { RISK_COLORS } from './MapView';
import { Wind, CloudRain, Snowflake, AlertTriangle, Eye, Clock, Filter } from 'lucide-react';

interface CheckpointListProps {
  checkpoints: Checkpoint[];
  onFocusCheckpoint: (cp: Checkpoint) => void;
  selectedCheckpointIndex?: number;
}

export const CheckpointList: React.FC<CheckpointListProps> = ({
  checkpoints,
  onFocusCheckpoint,
  selectedCheckpointIndex,
}) => {
  const [filter, setFilter] = useState<'all' | 'hazard' | 'notravel'>('all');

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (filter === 'notravel') return cp.overall_risk === 'No Travel';
    if (filter === 'hazard') return ['High', 'Severe', 'No Travel'].includes(cp.overall_risk);
    return true;
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F1E4D8] shadow-sm mt-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#EA580C]" />
          <h3 className="text-sm font-bold text-[#1F2937]">Route Checkpoints Telemetry</h3>
          <span className="text-xs text-[#6B7280]">({checkpoints.length} sampled points)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <button
            onClick={() => setFilter('all')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              filter === 'all'
                ? 'bg-[#F97316] text-white border-[#F97316] font-semibold shadow-xs'
                : 'bg-[#FFF9F4] text-[#6B7280] border-[#F1E4D8] hover:text-[#1F2937]'
            }`}
          >
            All ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilter('hazard')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              filter === 'hazard'
                ? 'bg-[#EA580C] text-white border-[#EA580C] font-semibold shadow-xs'
                : 'bg-[#FFF9F4] text-[#6B7280] border-[#F1E4D8] hover:text-[#EA580C]'
            }`}
          >
            Hazards ({checkpoints.filter((c) => ['High', 'Severe', 'No Travel'].includes(c.overall_risk)).length})
          </button>
          <button
            onClick={() => setFilter('notravel')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              filter === 'notravel'
                ? 'bg-[#7F1D1D] text-white border-[#7F1D1D] font-semibold shadow-xs'
                : 'bg-[#FFF9F4] text-[#7F1D1D] border-[#F1E4D8] hover:bg-[#FEF2F2]'
            }`}
          >
            No Travel ({checkpoints.filter((c) => c.overall_risk === 'No Travel').length})
          </button>
        </div>
      </div>

      {/* Checkpoints Scrollable Container */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredCheckpoints.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#6B7280]">
            No checkpoints match the selected filter.
          </div>
        ) : (
          filteredCheckpoints.map((cp) => {
            const riskColor = RISK_COLORS[cp.overall_risk] || '#94A3B8';
            const isSelected = selectedCheckpointIndex === cp.index;

            return (
              <div
                key={cp.index}
                onClick={() => onFocusCheckpoint(cp)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-white border-[#F97316] shadow-sm ring-1 ring-[#F97316]/30'
                    : 'bg-[#FFF9F4] border-[#F1E4D8] hover:bg-[#FFF3E8]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs font-mono font-bold text-[#1F2937] border border-[#F1E4D8] shadow-2xs">
                    #{cp.index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#1F2937]">
                        Mile {cp.distance_from_origin_miles.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono">
                        ({cp.latitude.toFixed(2)}°, {cp.longitude.toFixed(2)}°)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      ETA:{' '}
                      <span className="text-[#1F2937] font-semibold">
                        {new Date(cp.estimated_arrival_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weather Metrics */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center space-x-1" title="Wind Speed">
                    <Wind className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span className="font-semibold text-[#1F2937]">
                      {cp.wind_mph !== null ? `${cp.wind_mph} mph` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1" title="Rainfall Intensity">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-[#1F2937]">
                      {cp.rain_in_hr !== null ? `${cp.rain_in_hr} in/h` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1" title="Snowfall Intensity">
                    <Snowflake className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-semibold text-[#1F2937]">
                      {cp.snow_in_hr !== null ? `${cp.snow_in_hr} in/h` : 'N/A'}
                    </span>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: riskColor }}
                    >
                      {cp.overall_risk}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocusCheckpoint(cp);
                      }}
                      className="p-1 text-[#9CA3AF] hover:text-[#EA580C] transition cursor-pointer"
                      title="Center on map"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Override notice */}
                {cp.load_override_applied && (
                  <div className="text-[11px] text-[#EA580C] sm:col-span-full pl-10 flex items-center space-x-1 font-medium bg-[#FFF3E8] p-1.5 rounded-lg border border-[#FDBA74]/50">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                    <span>{cp.override_reason}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
