
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScaleNote } from '../types';
import { audioService } from '../services/audioService';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
}

interface CrystalHarpProps {
  notes: ScaleNote[];
  onInteract: () => void;
  lowPower?: boolean;
  motionEnabled?: boolean;
}

const CrystalHarp: React.FC<CrystalHarpProps> = ({ notes, onInteract, lowPower = false, motionEnabled = true }) => {
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveAmplitude, setWaveAmplitude] = useState(0);
  const [glissandoSpeed, setGlissandoSpeed] = useState(300); 
  const [sustain, setSustain] = useState(18.0); 
  const requestRef = useRef<number | null>(null);
  const [time, setTime] = useState(0);
  const waveSegments = lowPower ? 30 : 80;
  const perfMode = lowPower;
  const canAnimate = motionEnabled && !lowPower;

  useEffect(() => {
    if (!motionEnabled) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
      setWaveAmplitude(0);
      return;
    }
    let lastFrame = 0;
    const frameInterval = lowPower ? 1000 / 24 : 1000 / 60;
    const decay = lowPower ? 0.9 : 0.96;
    const animate = (t: number) => {
      if (t - lastFrame >= frameInterval) {
        lastFrame = t;
        setTime(t / 1000);
        setWaveAmplitude(prev => Math.max(0, prev * decay));
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [lowPower, motionEnabled]);

  const spawnParticles = (idx: number, color: string) => {
    const newParticles: Particle[] = [];
    // Creating "Light Blooms" rather than sharp particles
    const count = perfMode ? 1 : 3; 
    const yPos = 85 - (idx * (75 / Math.max(1, notes.length - 1 || 1))); 

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: 50 + (Math.random() * 40 - 20),
        y: yPos,
        color,
        angle: (Math.random() * (Math.PI / 2)) - (Math.PI / 4) - (Math.PI / 2), // Drift slowly upwards
        speed: 0.08 + Math.random() * (perfMode ? 0.12 : 0.3), // Ultra slow movement
        size: (perfMode ? 120 : 250) + Math.random() * (perfMode ? 160 : 300), // Massive soft blooms
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, perfMode ? 4500 : 8000); // Longer lifespan for softer transition
  };

  const handleInteraction = useCallback((freq: number, label: string, idx: number, color: string, duration?: number) => {
    const finalDuration = duration ?? sustain;
    audioService.playCrystalNote(freq, finalDuration, label);
    onInteract();
    setActiveNotes(prev => ({ ...prev, [label]: true }));
    spawnParticles(idx, color);
    setWaveAmplitude(prev => Math.min(lowPower ? 180 : 250, prev + (lowPower ? 25 : 45)));
    
    setTimeout(() => {
      setActiveNotes(prev => ({ ...prev, [label]: false }));
    }, 3000);
  }, [onInteract, sustain]);

  const playChord = (indices: number[], durationAdd: number = 2) => {
    indices.forEach((idx, i) => {
      if (notes[idx]) {
        setTimeout(() => {
          handleInteraction(notes[idx].freq, notes[idx].label, idx, notes[idx].color, sustain + durationAdd);
        }, i * 400); 
      }
    });
  };

  const playGlissando = (direction: 'up' | 'down') => {
    const sequence = direction === 'up' ? notes.map((_, i) => i) : [...notes.map((_, i) => i)].reverse();
    sequence.forEach((idx, i) => {
      setTimeout(() => {
        handleInteraction(notes[idx].freq, notes[idx].label, idx, notes[idx].color, sustain + 1.0);
      }, i * glissandoSpeed);
    });
  };

  const stopAll = () => {
    audioService.stopAllSounds();
    setActiveNotes({});
    setWaveAmplitude(0);
  };

  const renderWave = (offset: number, speedMult: number, freqMult: number, segments: number) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 100;
      const sinVal = Math.sin((time * speedMult) + (i * freqMult) + offset);
      const y = 50 + sinVal * (waveAmplitude * 0.2 + 5);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-6xl mx-auto select-none px-6 pb-20">
      
      {/* Background Sound Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full scale-110">
          <polyline points={renderWave(0, 0.3, 0.05, waveSegments)} fill="none" stroke="url(#forestWave1)" strokeWidth="0.4" />
          <polyline points={renderWave(Math.PI, 0.2, 0.04, waveSegments)} fill="none" stroke="url(#forestWave2)" strokeWidth="0.3" />
          <defs>
            <linearGradient id="forestWave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="forestWave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Ethereal Light Blooms */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${perfMode || !motionEnabled ? 'blur-[40px] opacity-20' : 'blur-[100px] animate-ethereal-glow opacity-0'}`}
            style={{
              left: `${p.x}%`,
              bottom: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              '--particle-angle': `${p.angle}rad`,
              '--particle-speed': `${p.speed}`,
              mixBlendMode: 'screen',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main Harp Section */}
      <div className="relative w-full h-[540px] flex flex-col-reverse items-center justify-between py-6 z-10 mb-10">
        {notes.map((note, idx) => (
          <div 
            key={note.label}
            className="group relative flex items-center justify-center w-full cursor-pointer h-14"
            onClick={() => handleInteraction(note.freq, note.label, idx, note.color)}
          >
            <div className={`absolute h-12 rounded-full ${perfMode ? 'blur-[24px]' : 'blur-[50px]'} transition-all duration-1000 ${activeNotes[note.label] ? 'opacity-80 scale-150' : 'opacity-10'}`} 
                 style={{ width: `${note.width}%`, backgroundColor: note.color }}></div>

            <div 
              className={`relative h-9 md:h-11 rounded-full border-[2.5px] transition-all duration-700 transform group-hover:scale-y-110 ${perfMode ? 'shadow-lg backdrop-blur-lg' : 'shadow-xl backdrop-blur-2xl'} overflow-hidden`}
              style={{ 
                width: `${note.width}%`,
                borderColor: activeNotes[note.label] ? '#fff' : `${note.color}88`,
                background: activeNotes[note.label] 
                  ? `linear-gradient(to right, ${note.color}44, #fff, ${note.color}44)` 
                  : `linear-gradient(to right, rgba(255,255,255,0.98), ${note.color}22, rgba(255,255,255,0.98))`,
                boxShadow: activeNotes[note.label] 
                  ? `0 0 70px 25px ${note.color}77, inset 0 0 35px #fff` 
                  : `0 8px 30px rgba(0,0,0,0.05), inset 0 0 15px rgba(255,255,255,1)`,
              }}
            >
              <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white to-transparent pointer-events-none opacity-90"></div>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 ${canAnimate ? 'animate-glass-sweep' : ''} opacity-70`}></div>
              {activeNotes[note.label] && (
                <div className={`absolute inset-0 w-full h-full bg-white opacity-40 ${canAnimate ? 'animate-pulse' : ''} rounded-full`}></div>
              )}
              <span className={`absolute right-10 top-1/2 -translate-y-1/2 text-[10px] md:text-[12px] font-black tracking-[0.7em] uppercase transition-all duration-700 ${activeNotes[note.label] ? 'opacity-100 scale-110 text-emerald-900' : 'opacity-30 text-emerald-800'}`}>
                {note.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Performance Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 mb-10 z-20">
        <button 
          className="group w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-4 rounded-full bg-emerald-600 text-white shadow-lg hover:shadow-emerald-200/50 hover:bg-emerald-700 transition-all font-black tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] uppercase active:scale-95"
          onClick={() => playChord([0, 2, 4, 7])}
        >
          Sacred Root
        </button>
        <button 
          className="group w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-4 rounded-full bg-teal-600 text-white shadow-lg hover:shadow-teal-200/50 hover:bg-teal-700 transition-all font-black tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] uppercase active:scale-95"
          onClick={() => playChord([2, 4, 6, 7])}
        >
          Spirit Heart
        </button>
        <button 
          className="group w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-4 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-blue-200/50 hover:bg-blue-700 transition-all font-black tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] uppercase active:scale-95 flex items-center justify-center gap-3"
          onClick={() => playGlissando('up')}
        >
          Ascend
        </button>
        <button 
          className="group w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-4 rounded-full bg-indigo-600 text-white shadow-lg hover:shadow-indigo-200/50 hover:bg-indigo-700 transition-all font-black tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] uppercase active:scale-95 flex items-center justify-center gap-3"
          onClick={() => playGlissando('down')}
        >
          Descend
        </button>
      </div>

      {/* Footer Controls */}
      <div className="mt-12 w-full flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-6 z-20">
        <button 
          className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-[11px] uppercase transition-all shadow-xl shadow-emerald-200/50 hover:scale-[1.03] active:scale-95"
          onClick={() => {
            notes.forEach((n, i) => {
              setTimeout(() => handleInteraction(n.freq, n.label, i, n.color, sustain + 8.0), i * 350);
            });
          }}
        >
          Forest Cascade
        </button>
        <button 
          className={`group w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-emerald-900/40 hover:text-rose-600 font-black tracking-[0.3em] sm:tracking-[0.4em] text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-3 bg-white/40 ${perfMode ? 'backdrop-blur-lg' : 'backdrop-blur-xl'} rounded-full border border-white/60`}
          onClick={stopAll}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
          Silence
        </button>
      </div>

      {/* Control Panel (Sliders) */}
      <div className="w-full max-w-5xl z-20">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 px-10 py-8 bg-white/40 ${perfMode ? 'backdrop-blur-2xl shadow-lg' : 'backdrop-blur-[40px] shadow-xl'} border border-white/80 rounded-[3rem]`}>
          
          {/* Glissando Speed */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-800/40">Glissando Flow</label>
              <span className="text-[10px] text-emerald-900/30 font-bold uppercase">{glissandoSpeed}ms</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-emerald-800/30 font-bold uppercase">Rapid</span>
              <input 
                type="range" 
                min="100" 
                max="800" 
                step="20"
                value={glissandoSpeed}
                onChange={(e) => setGlissandoSpeed(parseInt(e.target.value))}
                className="flex-1 custom-range accent-emerald-500"
              />
              <span className="text-[9px] text-emerald-800/30 font-bold uppercase">Slow</span>
            </div>
          </div>

          {/* Resonance Sustain Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-800/40">Resonance Sustain</label>
              <span className="text-[10px] text-blue-900/40 font-black tracking-widest">{sustain.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-blue-800/30 font-bold uppercase">Brief</span>
              <input 
                type="range" 
                min="1" 
                max="25" 
                step="0.5"
                value={sustain}
                onChange={(e) => setSustain(parseFloat(e.target.value))}
                className="flex-1 custom-range accent-blue-500"
              />
              <span className="text-[9px] text-blue-800/30 font-bold uppercase">Eternal</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ethereal-glow {
          0% { 
            transform: translate(-50%, 50%) scale(0.5); 
            opacity: 0; 
          }
          30% { 
            opacity: 0.2; 
          }
          100% {
            transform: translate(
              calc(-50% + cos(var(--particle-angle)) * var(--particle-speed) * 450px),
              calc(50% + sin(var(--particle-angle)) * var(--particle-speed) * -450px)
            ) scale(1.8);
            opacity: 0;
          }
        }
        .animate-ethereal-glow {
          animation: ethereal-glow 8s cubic-bezier(0.2, 0.4, 0.3, 1) forwards;
        }
        @keyframes glass-sweep {
          0% { transform: translateX(-200%) skewX(30deg); }
          100% { transform: translateX(200%) skewX(30deg); }
        }
        .animate-glass-sweep {
          animation: glass-sweep 18s infinite linear;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ethereal-glow,
          .animate-glass-sweep {
            animation: none;
          }
        }
        .custom-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
          outline: none;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 4px solid currentColor;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default CrystalHarp;
