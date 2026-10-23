import React from 'react';
import { Truck, Info } from 'lucide-react';

interface HeaderProps {
  backendOnline: boolean | null;
  onOpenRulesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ backendOnline, onOpenRulesModal }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white m-0">Spotter</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              AI Routing
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Weather-Aware Commercial Truck Routing Engine</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenRulesModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          title="View Weather Risk Thresholds & Load Overrides"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Risk Threshold Rules</span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              backendOnline === true
                ? 'bg-emerald-400 animate-pulse'
                : backendOnline === false
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300 hidden sm:inline">
            {backendOnline === true ? 'Engine Online' : backendOnline === false ? 'Engine Offline' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
