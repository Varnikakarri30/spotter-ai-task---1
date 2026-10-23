import React, { useState } from 'react';
import { MapPin, Navigation, Calendar, Scale, Gauge, AlertCircle, ArrowRight } from 'lucide-react';
import type { TripInputs } from '../types';

interface TripFormProps {
  onSubmit: (inputs: TripInputs) => void;
  isLoading: boolean;
}

const PRESET_ROUTES = [
  { label: 'Chicago → Denver', origin: 'Chicago, IL', dest: 'Denver, CO' },
  { label: 'Dallas → Atlanta', origin: 'Dallas, TX', dest: 'Atlanta, GA' },
  { label: 'Seattle → LA', origin: 'Seattle, WA', dest: 'Los Angeles, CA' },
  { label: 'KC → Salt Lake City', origin: 'Kansas City, MO', dest: 'Salt Lake City, UT' },
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
    <div className="card-spotter p-6 bg-white border border-[#F1E4D8] text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] flex items-center justify-center text-[#EA580C]">
            <Navigation className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-[#1F2937]">Trip Configuration</h2>
        </div>
        <span className="text-[11px] font-semibold text-[#6B7280] bg-[#FFF9F4] px-2.5 py-1 rounded-full border border-[#F1E4D8]">
          US Commercial Freight
        </span>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">
          Route Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_ROUTES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.origin, p.dest)}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-[#FFF9F4] hover:bg-[#FFF3E8] text-[#4B5563] hover:text-[#EA580C] border border-[#F1E4D8] transition truncate font-medium cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">
            Origin Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL or address"
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition"
              required
            />
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">
            Destination Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Denver, CO or address"
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition"
              required
            />
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">
            Departure Date & Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F97316]">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition"
              required
            />
          </div>
        </div>

        {/* Load Weight */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#374151] flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Truck Load Weight</span>
            </label>
            <span className="text-xs font-bold text-[#EA580C]">
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
            className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition mb-2"
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
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  loadWeightLb === chip.val
                    ? 'bg-[#FFF3E8] text-[#EA580C] border-[#FDBA74] font-bold'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FFF9F4]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checkpoint Interval */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#374151] flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Weather Checkpoint Interval</span>
            </label>
            <span className="text-[11px] text-[#9CA3AF]">Sampling Density</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([10, 25, 50] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setCheckpointIntervalMiles(interval)}
                className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  checkpointIntervalMiles === interval
                    ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm shadow-orange-500/20'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FFF9F4] hover:text-[#1F2937]'
                }`}
              >
                {interval} Miles
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Routes & Forecasts...</span>
            </>
          ) : (
            <>
              <span>Find Best Route</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
