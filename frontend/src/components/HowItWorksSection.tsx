import React from 'react';
import { ArrowRight, MapPin, GitFork, CloudRain, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: MapPin,
    title: 'Enter Journey Details',
    desc: 'Specify origin, destination, planned departure time, and trailer weight in pounds.',
  },
  {
    step: '02',
    icon: GitFork,
    title: 'Generate Corridors',
    desc: 'Spotter identifies up to three distinct physical highway alternatives for your freight trip.',
  },
  {
    step: '03',
    icon: CloudRain,
    title: 'Analyze Weather Risks',
    desc: 'Checkpoints sample hourly wind, rain, and snow forecasts matching your arrival time at each mile.',
  },
  {
    step: '04',
    icon: CheckCircle,
    title: 'Select Recommended Path',
    desc: 'Evaluate routes with fewest severe miles, safe load margins, and minimal travel duration.',
  },
];

interface HowItWorksSectionProps {
  onStartPlanning: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onStartPlanning }) => {
  return (
    <section id="how-it-works" className="py-20 bg-[#FFF9F4] border-b border-[#F1E4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-[#EA580C] mb-2">
            Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">
            How Spotter AI Works
          </h2>
          <p className="mt-4 text-base text-[#6B7280]">
            Four deterministic steps from journey setup to safest highway execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-[#F1E4D8] shadow-xs relative text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#FDBA74] tracking-tight">
                      {s.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FFF3E8] flex items-center justify-center text-[#EA580C]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#1F2937] mb-2">{s.title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onStartPlanning}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <span>Start Planning Your Route</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
