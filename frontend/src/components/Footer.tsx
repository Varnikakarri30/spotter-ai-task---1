import React from 'react';
import { Truck } from 'lucide-react';

interface FooterProps {
  onOpenRulesModal: () => void;
  onSelectView: (view: 'landing' | 'planner') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenRulesModal, onSelectView }) => {
  return (
    <footer className="bg-white border-t border-[#F1E4D8] py-12 text-[#6B7280] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#F1E4D8]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#1F2937]">Spotter AI</span>
              <span className="block text-[11px] text-[#9CA3AF]">Weather-Aware Commercial Truck Routing Engine</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#4B5563]">
            <button onClick={() => onSelectView('landing')} className="hover:text-[#EA580C] transition">
              Overview
            </button>
            <button onClick={() => onSelectView('planner')} className="hover:text-[#EA580C] transition">
              Route Planner
            </button>
            <button onClick={onOpenRulesModal} className="hover:text-[#EA580C] transition">
              Risk Thresholds & Overrides
            </button>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#EA580C] transition"
            >
              Open-Meteo Weather API
            </a>
            <a
              href="https://openrouteservice.org/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#EA580C] transition"
            >
              OpenRouteService API
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
          <p>
            Spotter AI provides forecast-based decision support. Real-time road and weather conditions may change rapidly. Always consult official state DOT road reports before transit.
          </p>
          <p className="shrink-0">
            Full Stack Developer Hiring Assessment Submission
          </p>
        </div>
      </div>
    </footer>
  );
};
