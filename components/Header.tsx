
import React from 'react';
import { ScaleType, SCALES } from '../types';

interface HeaderProps {
  activeTab: 'harp' | 'meditation';
  onTabChange: (tab: 'harp' | 'meditation') => void;
  currentScale: ScaleType;
  onScaleChange: (scale: ScaleType) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  audioReady: boolean;
  onEnableAudio: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  currentScale, 
  onScaleChange,
  isMuted,
  onMuteToggle,
  volume,
  onVolumeChange,
  audioReady,
  onEnableAudio
}) => {
  const scaleList = Object.keys(SCALES) as ScaleType[];

  return (
    <header className="w-full px-8 py-4 flex justify-between items-center z-30 backdrop-blur-xl bg-white/60 border-b border-slate-100 shadow-sm sticky top-0">
      <div className="flex items-center gap-3 min-w-fit">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 via-rose-50 to-teal-50 flex items-center justify-center shadow-inner border border-white/50">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-widest text-slate-800 uppercase italic hidden sm:inline">Lumina</span>
      </div>

      <nav className="flex items-center gap-4 md:gap-10">
        <button 
          onClick={() => onTabChange('harp')}
          className={`text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase transition-all whitespace-nowrap ${activeTab === 'harp' ? 'text-indigo-500 border-b-2 border-indigo-400 pb-1' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Harp Sanctuary
        </button>
        <button 
          onClick={() => onTabChange('meditation')}
          className={`text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase transition-all whitespace-nowrap ${activeTab === 'meditation' ? 'text-rose-500 border-b-2 border-rose-400 pb-1' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Inner Grace
        </button>
      </nav>

      <div className="flex items-center gap-4 lg:gap-8">
        {/* Integrated Sound Controls */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-50/50 px-4 py-2 rounded-2xl border border-slate-100">
          <button 
            onClick={onMuteToggle}
            className="text-slate-400 hover:text-indigo-500 transition-all"
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="5,5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
          <div className="flex items-center gap-1 h-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-0.5 bg-indigo-300 rounded-full animate-pulse`} style={{ height: `${i*3+4}px`, animationDelay: `${i*200}ms` }}></div>
            ))}
          </div>
        </div>

        {!audioReady && (
          <button
            type="button"
            onClick={onEnableAudio}
            className="hidden sm:inline-flex px-3 py-2 rounded-full bg-emerald-600 text-white text-[9px] md:text-[10px] font-black tracking-[0.25em] uppercase shadow-md hover:bg-emerald-700 transition-all"
          >
            Enable Sound
          </button>
        )}

        {/* Scale Selector */}
        <div className="relative group">
          <select 
            value={currentScale}
            onChange={(e) => onScaleChange(e.target.value as ScaleType)}
            className="appearance-none bg-white/80 border border-slate-200 rounded-full px-4 md:px-6 py-2 pr-10 text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all hover:bg-white shadow-sm"
          >
            {scaleList.map(s => (
              <option key={s} value={s}>{s} Scale</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
