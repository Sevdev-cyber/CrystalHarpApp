import React from 'react';
import { ScaleType, SCALE_INFO, SCALE_ORDER } from '../types';

interface ScaleWheelProps {
  currentScale: ScaleType;
  onSelect: (scale: ScaleType) => void;
  compact?: boolean;
}

const ScaleWheel: React.FC<ScaleWheelProps> = ({ currentScale, onSelect, compact = false }) => {
  const radius = compact ? 34 : 42;
  const containerClass = compact ? 'w-full max-w-[280px] mx-auto' : 'w-full max-w-md mx-auto';
  const buttonClass = compact
    ? 'absolute w-20 px-2 py-1.5 rounded-full border text-[7px] font-black uppercase tracking-[0.16em] leading-tight text-center whitespace-normal transition-all shadow-md'
    : 'absolute w-24 md:w-28 px-2 py-2 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-[0.18em] leading-tight text-center whitespace-normal transition-all shadow-lg';
  const centerTitleClass = compact ? 'text-base md:text-lg' : 'text-lg md:text-xl';

  return (
    <div className={containerClass}>
      <div className="relative aspect-square">
        <div className={`absolute inset-0 rounded-full bg-white/60 border border-white/90 ${compact ? 'shadow-xl shadow-emerald-100/30' : 'shadow-2xl shadow-emerald-100/40'}`}></div>
        <div className="absolute inset-[12%] rounded-full border border-emerald-200/40 bg-gradient-to-br from-emerald-50/70 via-white/70 to-blue-50/60"></div>

        {SCALE_ORDER.map((scale, index) => {
          const angle = (index / SCALE_ORDER.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const isActive = scale === currentScale;

          return (
            <button
              key={scale}
              type="button"
              onClick={() => onSelect(scale)}
              className={`${buttonClass} ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200'
                  : 'bg-white/90 text-slate-600 border-slate-200 hover:text-emerald-700 hover:border-emerald-300'
              }`}
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {SCALE_INFO[scale].title}
            </button>
          );
        })}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[55%] h-[55%] rounded-full bg-white/90 border border-white/90 shadow-inner flex items-center justify-center px-4">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[0.5em] text-emerald-700/40 font-bold">Scale</div>
              <div className={`${centerTitleClass} font-bold text-slate-800 italic mt-1`}>
                {SCALE_INFO[currentScale].title}
              </div>
              <div className={`text-[10px] text-emerald-700/60 font-semibold uppercase tracking-[0.2em] ${compact ? 'mt-1' : 'mt-2'}`}>
                {SCALE_INFO[currentScale].subtitle}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${compact ? 'mt-4' : 'mt-6'} text-center`}>
        <div className="text-[9px] uppercase tracking-[0.4em] text-slate-400 font-bold">
          Notes In Scale
        </div>
        <div className={`mt-2 ${compact ? 'text-[10px]' : 'text-[11px] md:text-xs'} text-slate-500 font-medium`}>
          {SCALE_INFO[currentScale].notes}
        </div>
      </div>
    </div>
  );
};

export default ScaleWheel;
