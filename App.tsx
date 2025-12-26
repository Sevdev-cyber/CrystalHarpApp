
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CrystalHarp from './components/CrystalHarp';
import MindfulChat from './components/MindfulChat';
import BackgroundDynamics from './components/BackgroundDynamics';
import { audioService } from './services/audioService';
import { ScaleType, SCALES } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'harp' | 'meditation'>('harp');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentScale, setCurrentScale] = useState<ScaleType>('Chakra C');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [lowPower, setLowPower] = useState(false);
  const [audioReady, setAudioReady] = useState(() => audioService.isRunning());

  const handleActivity = () => {
    setLastActivity(Date.now());
    setAudioReady(prev => (prev ? prev : audioService.isRunning()));
  };

  const handleEnableAudio = async () => {
    const ready = await audioService.unlockAudio();
    setAudioReady(ready);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(max-width: 768px)')
    ];
    const updateLowPower = () => {
      setLowPower(mediaQueries.some(mq => mq.matches));
    };
    updateLowPower();
    mediaQueries.forEach(mq => {
      if (mq.addEventListener) mq.addEventListener('change', updateLowPower);
      else mq.addListener(updateLowPower);
    });
    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) mq.removeEventListener('change', updateLowPower);
        else mq.removeListener(updateLowPower);
      });
    };
  }, []);

  useEffect(() => {
    audioService.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const pulseClass = lowPower ? '' : 'animate-pulse';

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-white overflow-hidden select-none transition-colors duration-1000">
      {/* Dynamic Ethereal Forest Background Visualization */}
      <BackgroundDynamics activityIntensity={lastActivity} lowPower={lowPower} />

      {/* Decorative Forest/Crystal Light Elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-glow ${pulseClass}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-100/20 rounded-full blur-glow ${lowPower ? '' : 'animate-pulse delay-700'}`}></div>
      <div className={`absolute top-[20%] right-[-5%] w-[30%] h-[40%] bg-blue-100/10 rounded-full blur-glow ${lowPower ? '' : 'animate-pulse delay-1000'}`}></div>
      
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentScale={currentScale} 
        onScaleChange={setCurrentScale}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        volume={volume}
        onVolumeChange={setVolume}
        audioReady={audioReady}
        onEnableAudio={handleEnableAudio}
      />

      {!audioReady && (
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={handleEnableAudio}
            className="px-5 py-3 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-[0.25em] uppercase shadow-lg hover:bg-emerald-700 transition-all"
          >
            Enable Sound
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-4 z-10">
        {activeTab === 'harp' ? (
          <div className="w-full max-w-5xl transition-all duration-1000 ease-in-out opacity-100 transform translate-y-0">
            <div className="text-center mb-6">
              <h2 className="text-4xl md:text-6xl font-bold mb-3 text-iridescent italic px-4">
                Sacred Forest Crystal Harp
              </h2>
              <p className="text-emerald-800/40 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
                {currentScale} Frequencies • Earth & Celestial Harmony
              </p>
            </div>
            <CrystalHarp 
              notes={SCALES[currentScale]} 
              onInteract={handleActivity}
              lowPower={lowPower}
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl transition-all duration-700 ease-in-out opacity-100 transform translate-y-0">
             <MindfulChat />
          </div>
        )}
      </main>

      <footer className="absolute bottom-6 left-0 right-0 text-center text-emerald-900/20 text-[9px] uppercase tracking-[0.6em] pointer-events-none font-bold">
        Sacred Forest Ancient Resonance
      </footer>
    </div>
  );
};

export default App;
