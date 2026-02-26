/**
 * Crystal Harp App v2 — Main Entry Point
 * Sacred Forest Crystal Harp — Interactive Sound Healing Instrument
 */

import { audioEngine } from './audio/AudioEngine';
import { HarpView } from './ui/HarpView';
import { ScaleWheel } from './ui/ScaleWheel';
import { ScaleInfo } from './ui/ScaleInfo';
import type { ScaleDefinition, PlayMode } from './types';
import './styles/app.css';

class CrystalHarpApp {
  private harpView!: HarpView;
  private scaleWheel!: ScaleWheel;
  private scaleInfo!: ScaleInfo;
  private audioInitialized = false;

  async init(): Promise<void> {
    this.createLayout();
    this.setupComponents();
  }

  private createLayout(): void {
    const root = document.getElementById('crystal-harp-app');
    if (!root) {
      console.error('Missing #crystal-harp-app container');
      return;
    }

    root.innerHTML = `
      <div class="cha-wrapper">
        <!-- Background decoration -->
        <div class="cha-bg">
          <div class="bg-orb bg-orb-1"></div>
          <div class="bg-orb bg-orb-2"></div>
          <div class="bg-orb bg-orb-3"></div>
        </div>

        <!-- Header -->
        <header class="cha-header">
          <h2 class="cha-title">Sacred Forest Crystal Harp</h2>
          <p class="cha-subtitle" id="cha-subtitle">432 Hz · Pure Quartz</p>
        </header>

        <!-- Scale Wheel -->
        <div id="scale-wheel-container"></div>

        <!-- Controls: mode, glissando, volume — INLINE -->
        <div id="controls-container" class="controls">
          <div class="controls-row mode-row">
            <div class="mode-toggle">
              <button class="mode-btn active" id="mode-mallet">
                <span class="mode-icon">🥢</span>
                <span class="mode-text">Mallet</span>
              </button>
              <button class="mode-btn" id="mode-water">
                <span class="mode-icon">💧</span>
                <span class="mode-text">Water</span>
              </button>
            </div>
          </div>
          <div class="controls-row gliss-row">
            <button class="gliss-btn" id="gliss-up">
              <span class="gliss-arrow">↑</span>
              <span class="gliss-text">Glissando Up</span>
            </button>
            <button class="gliss-btn" id="gliss-down">
              <span class="gliss-arrow">↓</span>
              <span class="gliss-text">Glissando Down</span>
            </button>
          </div>
          <div class="controls-row vol-row">
            <button class="ctrl-btn mute-btn" id="mute-btn">🔊</button>
            <input type="range" class="vol-slider" id="vol-slider" min="0" max="100" value="70">
            <button class="ctrl-btn stop-btn" id="stop-btn" title="Stop all sounds">⏹</button>
          </div>
        </div>

        <!-- Crystal Harp Tubes -->
        <div id="harp-container"></div>

        <!-- Scale Info + Buy CTA -->
        <div id="scale-info-container"></div>

        <!-- Footer -->
        <footer class="cha-footer">
          <p>Sacred Forest® Crystal Harp · Handcrafted in Poland</p>
        </footer>
      </div>
    `;
  }

  private setupComponents(): void {
    // Harp view
    const harpEl = document.getElementById('harp-container')!;
    this.harpView = new HarpView(harpEl);
    this.harpView.setOnNotePlay(() => this.ensureAudio());

    // Scale info (must init BEFORE ScaleWheel.render triggers switchScale)
    const infoEl = document.getElementById('scale-info-container')!;
    this.scaleInfo = new ScaleInfo(infoEl);

    // Controls — bind events to inline HTML
    this.bindControls();

    // Scale wheel (render() triggers selectScale → switchScale callback)
    const wheelEl = document.getElementById('scale-wheel-container')!;
    this.scaleWheel = new ScaleWheel(wheelEl);
    this.scaleWheel.setOnSelect((scale) => this.switchScale(scale));
    this.scaleWheel.render();
  }

  private bindControls(): void {
    // Mode toggle
    const malletBtn = document.getElementById('mode-mallet');
    const waterBtn = document.getElementById('mode-water');

    const setMode = (mode: PlayMode) => {
      audioEngine.mode = mode;
      malletBtn?.classList.toggle('active', mode === 'mallet');
      waterBtn?.classList.toggle('active', mode === 'water');
    };

    malletBtn?.addEventListener('click', () => setMode('mallet'));
    waterBtn?.addEventListener('click', () => setMode('water'));

    // Glissando
    document.getElementById('gliss-up')?.addEventListener('click', async () => {
      await this.ensureAudio();
      this.harpView.playGlissando('up');
    });
    document.getElementById('gliss-down')?.addEventListener('click', async () => {
      await this.ensureAudio();
      this.harpView.playGlissando('down');
    });

    // Volume
    const volSlider = document.getElementById('vol-slider') as HTMLInputElement | null;
    volSlider?.addEventListener('input', () => {
      audioEngine.volume = parseInt(volSlider.value) / 100;
    });

    // Mute
    const muteBtn = document.getElementById('mute-btn');
    muteBtn?.addEventListener('click', () => {
      audioEngine.muted = !audioEngine.muted;
      if (muteBtn) muteBtn.innerHTML = audioEngine.muted ? '🔇' : '🔊';
      muteBtn?.classList.toggle('muted', audioEngine.muted);
    });

    // Stop all
    document.getElementById('stop-btn')?.addEventListener('click', () => {
      audioEngine.stopAll();
    });
  }

  private switchScale(scale: ScaleDefinition): void {
    // Stop current sounds
    audioEngine.stopAll(0.3);

    // Update all components
    this.harpView.render(scale);
    this.harpView.setOnNotePlay(() => this.ensureAudio());
    this.scaleInfo.render(scale);

    // Update subtitle
    const subtitle = document.getElementById('cha-subtitle');
    if (subtitle) {
      subtitle.textContent = `${scale.subtitle} · 432 Hz`;
    }

    // Update CSS accent
    document.documentElement.style.setProperty('--accent', scale.colors.primary);
    document.documentElement.style.setProperty('--accent-light', scale.colors.secondary);
    document.documentElement.style.setProperty('--accent-glow', scale.colors.glow);
  }

  private async ensureAudio(): Promise<void> {
    if (this.audioInitialized) return;
    const ok = await audioEngine.unlock();
    if (ok) {
      this.audioInitialized = true;
    }
  }
}



// --- App initialization ---
const app = new CrystalHarpApp();

// --- Iframe integration: resize + scroll forwarding ---
function setupIframeIntegration() {
  if (window.parent === window) return; // not in iframe

  // Mark html so CSS can disable min-height:100vh and hide overflow
  document.documentElement.classList.add('cha-in-iframe');

  // --- 1. Auto-resize: report content height to parent ---
  let lastH = 0;
  const sendHeight = () => {
    const wrapper = document.querySelector('.cha-wrapper');
    if (!wrapper) return;
    const h = wrapper.scrollHeight;
    if (h !== lastH && h > 100) {
      lastH = h;
      window.parent.postMessage({ type: 'cha-resize', height: h }, '*');
    }
  };

  if (typeof ResizeObserver !== 'undefined') {
    const wrapper = document.querySelector('.cha-wrapper');
    if (wrapper) new ResizeObserver(sendHeight).observe(wrapper);
  }
  setInterval(sendHeight, 800);
  setTimeout(sendHeight, 400);
  setTimeout(sendHeight, 1200);

  // --- 2. Forward scroll events to parent page ---
  // Wheel events (desktop)
  window.addEventListener('wheel', (e: WheelEvent) => {
    window.parent.postMessage({
      type: 'cha-scroll',
      deltaY: e.deltaY,
      deltaX: e.deltaX
    }, '*');
  }, { passive: true });

  // Touch events (mobile) - track movement and forward
  let touchStartY = 0;
  let touchActive = false;

  window.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchActive = true;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e: TouchEvent) => {
    if (!touchActive || e.touches.length !== 1) return;
    const deltaY = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    if (Math.abs(deltaY) > 1) {
      window.parent.postMessage({
        type: 'cha-scroll',
        deltaY: deltaY,
        deltaX: 0
      }, '*');
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    touchActive = false;
  }, { passive: true });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
    setupIframeIntegration();
  });
} else {
  app.init();
  setupIframeIntegration();
}
