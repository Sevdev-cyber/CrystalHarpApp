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

// --- Iframe height reporting (auto-resize when embedded) ---
let lastReportedHeight = 0;
let reportTimer: ReturnType<typeof setTimeout> | null = null;

function reportHeight(): void {
  if (window.parent === window) return; // not in iframe
  if (reportTimer) return; // already scheduled
  reportTimer = setTimeout(() => {
    reportTimer = null;
    const wrapper = document.querySelector('.cha-wrapper');
    const height = wrapper ? wrapper.scrollHeight : document.body.scrollHeight;
    // Only report if height actually changed (avoid infinite loop)
    if (Math.abs(height - lastReportedHeight) > 5) {
      lastReportedHeight = height;
      window.parent.postMessage({ type: 'crystal-harp-height', height }, '*');
    }
  }, 200);
}

// --- App initialization ---
const app = new CrystalHarpApp();

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
    setTimeout(reportHeight, 500);
    setTimeout(reportHeight, 1500);
    window.addEventListener('resize', reportHeight);
  });
} else {
  app.init();
  setTimeout(reportHeight, 500);
  setTimeout(reportHeight, 1500);
  window.addEventListener('resize', reportHeight);
}
