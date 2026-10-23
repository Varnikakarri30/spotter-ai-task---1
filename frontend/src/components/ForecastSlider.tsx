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
    <div className="bg-white rounded-2xl p-4.5 border border-[#F1E4D8] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#EA580C]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
            Corridor Forecast Slider
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF3E8] text-[#EA580C] border border-[#FDBA74]/60">
            +{hourOffset}h from Departure
          </span>
        </div>

        <div className="text-xs font-medium text-[#4B5563] bg-[#FFF9F4] px-3 py-1 rounded-xl border border-[#F1E4D8] inline-flex items-center space-x-1.5">
          <span className="text-[#6B7280]">Forecast Time:</span>
          <span className="text-[#1F2937] font-semibold">{formattedDate}</span>
        </div>
      </div>

      {/* Slider & Controls */}
      <div className="flex items-center space-x-3 mb-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isPlaying
              ? 'bg-[#EA580C] text-white font-bold shadow-xs'
              : 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
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
          className="p-2 rounded-xl bg-[#FFF9F4] hover:bg-[#FFF3E8] text-[#4B5563] transition border border-[#F1E4D8] cursor-pointer"
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
            className="w-full h-2 bg-[#F1E4D8] rounded-lg appearance-none cursor-pointer accent-[#F97316] focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono font-semibold text-[#6B7280] w-12 text-right">{hourOffset}h / 48h</span>
      </div>

      {/* Quick Jump Scrub Markers & Heatmap Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F1E4D8]">
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
              className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                hourOffset === h
                  ? 'bg-[#FFF3E8] text-[#EA580C] border-[#FDBA74] font-bold'
                  : 'bg-[#FFF9F4] text-[#6B7280] border-[#F1E4D8] hover:text-[#1F2937]'
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
            className={`flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isHeatmapVisible
                ? 'bg-[#FFF3E8] text-[#EA580C] border-[#FDBA74] font-semibold'
                : 'bg-[#FFF9F4] text-[#6B7280] border-[#F1E4D8] hover:text-[#1F2937]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heatmap: {isHeatmapVisible ? 'ON' : 'OFF'}</span>
          </button>

          {isHeatmapVisible && (
            <div className="flex items-center space-x-0.5 bg-[#FFF9F4] p-0.5 rounded-lg border border-[#F1E4D8]">
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('risk')}
                className={`text-[10px] px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  heatmapMetric === 'risk' ? 'bg-[#F97316] text-white font-bold shadow-xs' : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
                title="Weather Risk Heatmap"
              >
                Risk
              </button>
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('wind')}
                className={`text-[10px] px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  heatmapMetric === 'wind' ? 'bg-[#F97316] text-white font-bold shadow-xs' : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
                title="Wind Speed Heatmap"
              >
                Wind
              </button>
              <button
                type="button"
                onClick={() => onHeatmapMetricChange('precipitation')}
                className={`text-[10px] px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  heatmapMetric === 'precipitation' ? 'bg-[#F97316] text-white font-bold shadow-xs' : 'text-[#6B7280] hover:text-[#1F2937]'
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
