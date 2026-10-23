import React, { useState } from 'react';
import { Truck, Navigation, Menu, X, Info } from 'lucide-react';

interface NavbarProps {
  backendOnline: boolean | null;
  onOpenRulesModal: () => void;
  activeView: 'landing' | 'planner';
  onSelectView: (view: 'landing' | 'planner') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendOnline,
  onOpenRulesModal,
  activeView,
  onSelectView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (activeView !== 'landing') {
      onSelectView('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1E4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectView('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:bg-[#EA580C] transition">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-bold tracking-tight text-[#1F2937]">Spotter</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#EA580C] border border-[#FDBA74]/50">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Weather-Aware Routing</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#4B5563]">
            <button
              onClick={() => onSelectView('landing')}
              className={`transition hover:text-[#EA580C] ${
                activeView === 'landing' ? 'text-[#EA580C] font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="transition hover:text-[#EA580C]"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="transition hover:text-[#EA580C]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('safety')}
              className="transition hover:text-[#EA580C]"
            >
              Safety Rules
            </button>
            <button
              onClick={onOpenRulesModal}
              className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-[#FFF9F4] text-[#EA580C] border border-[#F1E4D8] hover:bg-[#FFF3E8] transition"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Thresholds</span>
            </button>
          </div>

          {/* Right Action & Engine Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#FFF9F4] border border-[#F1E4D8] text-xs font-medium text-[#6B7280]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-500 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span>{backendOnline === true ? 'Engine Online' : backendOnline === false ? 'Engine Offline' : 'Connecting'}</span>
            </div>

            <button
              onClick={() => onSelectView('planner')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
                activeView === 'planner'
                  ? 'bg-[#1F2937] text-white hover:bg-black'
                  : 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/20'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{activeView === 'planner' ? 'Control Center' : 'Plan a Route'}</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => onSelectView('planner')}
              className="px-3 py-1.5 rounded-lg bg-[#F97316] text-white text-xs font-semibold"
            >
              Plan
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#4B5563] hover:text-[#1F2937] hover:bg-[#FFF9F4]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#F1E4D8] bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onSelectView('landing');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-[#1F2937]"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left py-2 text-sm font-medium text-[#4B5563]"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 text-sm font-medium text-[#4B5563]"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('safety')}
            className="block w-full text-left py-2 text-sm font-medium text-[#4B5563]"
          >
            Safety Guidelines
          </button>
          <button
            onClick={() => {
              onOpenRulesModal();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-[#EA580C]"
          >
            Risk Threshold Rules
          </button>
          <div className="pt-2 border-t border-[#F1E4D8] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Engine: {backendOnline ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={() => {
                onSelectView('planner');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-semibold"
            >
              Open Route Planner
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
