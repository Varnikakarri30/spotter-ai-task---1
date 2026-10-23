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
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Route Checkpoints Telemetry</h3>
          <span className="text-xs text-slate-400">({checkpoints.length} sampled points)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setFilter('all')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
              filter === 'all'
                ? 'bg-sky-500 text-white border-sky-400 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilter('hazard')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
              filter === 'hazard'
                ? 'bg-orange-500 text-white border-orange-400 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Hazards ({checkpoints.filter((c) => ['High', 'Severe', 'No Travel'].includes(c.overall_risk)).length})
          </button>
          <button
            onClick={() => setFilter('notravel')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
              filter === 'notravel'
                ? 'bg-rose-900 text-rose-200 border-rose-500 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            No Travel ({checkpoints.filter((c) => c.overall_risk === 'No Travel').length})
          </button>
        </div>
      </div>

      {/* Checkpoints Scrollable Container */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredCheckpoints.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No checkpoints match the selected filter.
          </div>
        ) : (
          filteredCheckpoints.map((cp) => {
            const riskColor = RISK_COLORS[cp.overall_risk] || '#64748b';
            const isSelected = selectedCheckpointIndex === cp.index;

            return (
              <div
                key={cp.index}
                onClick={() => onFocusCheckpoint(cp)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-mono font-bold text-slate-300 border border-slate-800">
                    #{cp.index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        Mile {cp.distance_from_origin_miles.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({cp.latitude.toFixed(2)}°, {cp.longitude.toFixed(2)}°)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ETA:{' '}
                      <span className="text-slate-200">
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
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">
                      {cp.wind_mph !== null ? `${cp.wind_mph} mph` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1" title="Rainfall Intensity">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-slate-200">
                      {cp.rain_in_hr !== null ? `${cp.rain_in_hr} in/h` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1" title="Snowfall Intensity">
                    <Snowflake className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="font-semibold text-slate-200">
                      {cp.snow_in_hr !== null ? `${cp.snow_in_hr} in/h` : 'N/A'}
                    </span>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
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
                      className="p-1 text-slate-400 hover:text-sky-400 transition"
                      title="Center on map"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Override notice */}
                {cp.load_override_applied && (
                  <div className="text-[10px] text-amber-300 sm:col-span-full pl-10 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
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
