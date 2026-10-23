import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Layers } from 'lucide-react';

interface ForecastSliderProps {
  departureTime: string;
  hourOffset: number;
  onHourOffsetChange: (offset: number) => void;
  heatmapMetric: 'risk' | 'wind' | 'precipitation';
  onHeatmapMetricChange: (metric: 'risk' | 'wind' | 'precipitation') => void;
  isHeatmapVisible: boolean;
  onToggleHeatmap: () => void;
}

export const ForecastSlider: React.FC<ForecastSliderProps> = ({
  departureTime,
  hourOffset,
  onHourOffsetChange,
  heatmapMetric,
  onHeatmapMetricChange,
  isHeatmapVisible,
  onToggleHeatmap,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (hourOffset >= 48) {
          setIsPlaying(false);
        } else {
          onHourOffsetChange(hourOffset + 1);
        }
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, hourOffset, onHourOffsetChange]);

  const targetDate = new Date(new Date(departureTime).getTime() + hourOffset * 3600 * 1000);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Trip Corridor Forecast Slider
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
            +{hourOffset}h from Departure
          </span>
        </div>

        <div className="text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700/60 inline-flex items-center space-x-1.5">
          <span className="text-slate-400">Forecast Time:</span>
          <span className="text-white font-semibold">{formattedDate}</span>
        </div>
      </div>

      {/* Slider & Controls */}
      <div className="flex items-center space-x-3 mb-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl transition ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20'
          }`}
          title={isPlaying ? 'Pause corridor forecast animation' : 'Play 48-hour forecast timeline'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onHourOffsetChange(0);
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
          title="Reset to departure time"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={hourOffset}
            onChange={(e) => {
              setIsPlaying(false);
              onHourOffsetChange(Number(e.target.value));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono text-slate-400 w-10 text-right">{hourOffset}h / 48h</span>
      </div>

      {/* Quick Jump Scrub Markers & Heatmap Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        {/* Quick Hour Jump Buttons */}
        <div className="flex items-center space-x-1">
          {[0, 12, 24, 36, 48].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onHourOffsetChange(h);
              }}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                hourOffset === h
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {h === 0 ? 'Dep (0h)' : `+${h}h`}
            </button>
          ))}
        </div>

        {/* Heatmap Layer Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
              isHeatmapVisible
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heatmap: {isHeatmapVisible ? 'ON' : 'OFF'}</span>
          </button>

          {isHeatmapVisible && (
            <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('risk')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  heatmapMetric === 'risk' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Weather Risk Heatmap"
              >
                Risk
              </button>
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('wind')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  heatmapMetric === 'wind' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Wind Speed Heatmap"
              >
                Wind
              </button>
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('precipitation')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  heatmapMetric === 'precipitation' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Rain & Snow Heatmap"
              >
                Precip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
