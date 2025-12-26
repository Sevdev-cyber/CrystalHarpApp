
import React from 'react';

interface SoundControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const SoundControls: React.FC<SoundControlsProps> = ({ isMuted, onMuteToggle, volume, onVolumeChange }) => {
  return (
    <div className="fixed bottom-8 right-8 z-30 flex items-center gap-5 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
      <button 
        onClick={onMuteToggle}
        className="text-slate-400 hover:text-indigo-500 transition-all hover:scale-110"
      >
        {isMuted ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="5,5" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      <div className="flex items-center gap-3">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          className="w-24 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-400"
        />
      </div>

      <div className="h-6 w-[1px] bg-slate-100 mx-1"></div>

      <div className="flex items-center gap-3">
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-tight">
          Harmonic<br/><span className="text-indigo-400">Sphere</span>
        </div>
        <div className="flex items-center gap-1.5 h-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-0.5 bg-indigo-200 rounded-full animate-pulse`} style={{ height: `${i*3+4}px`, animationDelay: `${i*150}ms` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SoundControls;
