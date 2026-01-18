
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CrystalHarp from './components/CrystalHarp';
import BackgroundDynamics from './components/BackgroundDynamics';
import ScaleWheel from './components/ScaleWheel';
import { audioService } from './services/audioService';
import { ScaleType, SCALES, SCALE_INFO } from './types';

const App: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentScale, setCurrentScale] = useState<ScaleType>('Chakra C');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [lowPower, setLowPower] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [audioReady, setAudioReady] = useState(() => audioService.isRunning());
  const [isVisible, setIsVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(max-width: 768px)')
    ];
    const mediaQueries = [reduceMotionQuery, ...mobileQueries];
    const updateLowPower = () => {
      const mobile = mobileQueries.some(mq => mq.matches);
      setIsMobileViewport(mobile);
      setLowPower(mobile || reduceMotionQuery.matches);
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
    if (typeof window === 'undefined') return;
    let embedded = false;
    try {
      embedded = window.self !== window.top;
    } catch {
      embedded = true;
    }
    setIsEmbedded(embedded);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const updateVisibility = () => setIsVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setHasScrolled(true);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const autoPause = lowPower || isEmbedded;
    if (!autoPause) {
      setIsIdle(false);
      return;
    }
    setIsIdle(false);
    const idleDelay = lowPower ? 4500 : 9000;
    const timeout = setTimeout(() => setIsIdle(true), idleDelay);
    return () => clearTimeout(timeout);
  }, [lastActivity, lowPower, isEmbedded]);

  useEffect(() => {
    audioService.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const embeddedScrollLock = isEmbedded && isMobileViewport;
  const useMobileEffects = true;
  const visualLowPower = lowPower || useMobileEffects;
  const reducedEffects = visualLowPower;
  const autoPause = lowPower || isEmbedded;
  const pulseClass = reducedEffects ? '' : 'animate-pulse';
  const motionEnabled = isVisible && (!autoPause || !isIdle);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('embedded', embeddedScrollLock);
    document.documentElement.classList.toggle('embedded', embeddedScrollLock);
    document.body.classList.toggle('reduced-effects', reducedEffects);
  }, [embeddedScrollLock, reducedEffects]);

  return (
    <div className={`relative w-full flex flex-col bg-white overflow-x-hidden select-none transition-colors duration-1000 ${embeddedScrollLock ? 'h-[100svh] overflow-hidden' : 'min-h-screen'}`}>
      {/* Dynamic Ethereal Forest Background Visualization */}
      <BackgroundDynamics activityIntensity={lastActivity} lowPower={visualLowPower} motionEnabled={motionEnabled} />

      {/* Decorative Forest/Crystal Light Elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-glow ${pulseClass}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-100/20 rounded-full blur-glow ${lowPower ? '' : 'animate-pulse delay-700'}`}></div>
      <div className={`absolute top-[20%] right-[-5%] w-[30%] h-[40%] bg-blue-100/10 rounded-full blur-glow ${lowPower ? '' : 'animate-pulse delay-1000'}`}></div>
      
      <Header 
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        volume={volume}
        onVolumeChange={setVolume}
        audioReady={audioReady}
        onEnableAudio={handleEnableAudio}
        reducedEffects={reducedEffects}
      />

      {!audioReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:hidden pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-white/90 backdrop-blur-xl px-6 py-4 shadow-xl border border-white/80">
            <button
              type="button"
              onClick={handleEnableAudio}
              className="text-emerald-700 text-[10px] font-black tracking-[0.25em] uppercase"
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col items-center justify-center p-4 min-h-0 z-10 ${embeddedScrollLock ? 'overflow-y-auto overscroll-contain' : ''}`}>
        <div className="w-full max-w-5xl transition-all duration-1000 ease-in-out opacity-100 transform translate-y-0">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-bold mb-3 text-iridescent italic px-4">
              Sacred Forest Crystal Harp
            </h2>
            <p className="text-emerald-800/50 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
              {SCALE_INFO[currentScale].subtitle} • 432 Hz
            </p>
          </div>

          <div className="mb-10">
            <ScaleWheel
              currentScale={currentScale}
              onSelect={setCurrentScale}
            />
          </div>

          <CrystalHarp 
            notes={SCALES[currentScale]} 
            onInteract={handleActivity}
            lowPower={visualLowPower}
            motionEnabled={motionEnabled}
          />
        </div>
      </main>

      {!hasScrolled && (
        <div className="fixed bottom-12 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="absolute -bottom-12 w-40 h-40 rounded-full bg-emerald-200/20 blur-3xl"></div>
            <div className="absolute -bottom-8 w-28 h-28 rounded-full bg-teal-200/20 blur-2xl"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70 shadow-[0_0_18px_rgba(16,185,129,0.45)] animate-pulse"></div>
            <div className="mt-2 w-5 h-5 rounded-full border border-emerald-300/50 animate-pulse"></div>
          </div>
        </div>
      )}

      <footer className="absolute bottom-6 left-0 right-0 text-center text-emerald-900/20 text-[9px] uppercase tracking-[0.6em] pointer-events-none font-bold">
        Sacred Forest Ancient Resonance
      </footer>
    </div>
  );
};

export default App;
