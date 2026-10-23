import React, { useState } from 'react';
import { MapPin, Navigation, Calendar, Scale, Gauge, Sparkles, AlertCircle } from 'lucide-react';
import type { TripInputs } from '../types';


interface TripFormProps {
  onSubmit: (inputs: TripInputs) => void;
  isLoading: boolean;
}

const PRESET_ROUTES = [
  { label: 'Chicago → Denver', origin: 'Chicago, IL', dest: 'Denver, CO' },
  { label: 'Dallas → Atlanta', origin: 'Dallas, TX', dest: 'Atlanta, GA' },
  { label: 'Seattle → LA', origin: 'Seattle, WA', dest: 'Los Angeles, CA' },
  { label: 'Kansas City → Salt Lake City', origin: 'Kansas City, MO', dest: 'Salt Lake City, UT' },
];

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, isLoading }) => {
  // Default departure time: current time + 1 hour, formatted as YYYY-MM-DDTHH:mm
  const getDefaultDeparture = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [origin, setOrigin] = useState('Chicago, IL');
  const [destination, setDestination] = useState('Denver, CO');
  const [departureTime, setDepartureTime] = useState(getDefaultDeparture);
  const [loadWeightLb, setLoadWeightLb] = useState<number>(38000);
  const [checkpointIntervalMiles, setCheckpointIntervalMiles] = useState<10 | 25 | 50>(25);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!origin.trim()) {
      setValidationError('Please specify an origin location.');
      return;
    }
    if (!destination.trim()) {
      setValidationError('Please specify a destination location.');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setValidationError('Origin and destination cannot be identical.');
      return;
    }
    if (!departureTime) {
      setValidationError('Please choose a departure date and time.');
      return;
    }
    if (loadWeightLb < 0 || isNaN(loadWeightLb)) {
      setValidationError('Truck load weight must be a positive number.');
      return;
    }

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime,
      loadWeightLb: Number(loadWeightLb),
      checkpointIntervalMiles,
    });
  };

  const handleApplyPreset = (o: string, d: string) => {
    setOrigin(o);
    setDestination(d);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          <span>Trip Configuration</span>
        </h2>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
          US Commercial Freight
        </span>
      </div>

      {/* Preset Route Buttons */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Quick Route Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_ROUTES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.origin, p.dest)}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Origin Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL or address"
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Destination Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="w-4 h-4 text-rose-400" />
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Denver, CO or address"
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Departure Date & Time</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        {/* Truck Load Weight */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Truck Load Weight</span>
            </label>
            <span className="text-xs font-semibold text-amber-400">
              {Number(loadWeightLb).toLocaleString()} lbs
            </span>
          </div>
          <input
            type="number"
            min={0}
            max={120000}
            step={500}
            value={loadWeightLb}
            onChange={(e) => setLoadWeightLb(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition mb-2"
          />

          {/* Quick Weight Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '15k lb (Light)', val: 15000 },
              { label: '35k lb (>30k rule)', val: 35000 },
              { label: '45k lb (>40k rule)', val: 45000 },
              { label: '65k lb (Max)', val: 65000 },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLoadWeightLb(chip.val)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                  loadWeightLb === chip.val
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checkpoint Interval Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              <span>Weather Checkpoint Interval</span>
            </label>
            <span className="text-[11px] text-slate-400">Sampling Density</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([10, 25, 50] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setCheckpointIntervalMiles(interval)}
                className={`py-1.5 text-xs font-medium rounded-xl border transition ${
                  checkpointIntervalMiles === interval
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {interval} Miles
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Routes & Forecasts...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Calculate Safe Routes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
