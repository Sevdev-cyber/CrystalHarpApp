/**
 * Crystal Harp Widget — Lightweight Embeddable Player
 * For Shopify product pages — renders a single scale's harp
 * 
 * Usage:
 *   <div data-crystal-harp data-scale="chakra-c"></div>
 *   <script src="crystal-harp-widget.js" defer></script>
 */

import { SCALES } from './types';
import type { ScaleDefinition, ScaleNote } from './types';
import './styles/widget.css';

// ─── Lightweight Audio Engine (subset of full AudioEngine) ─────────

class WidgetAudio {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private activeNotes: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();

    async init(): Promise<boolean> {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            return this.ctx.state === 'running';
        }
        try {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);
            return true;
        } catch {
            return false;
        }
    }

    play(note: ScaleNote): void {
        if (!this.ctx || !this.masterGain) return;

        // Stop existing instance of this note
        this.stop(note.label);

        const now = this.ctx.currentTime;

        // Main oscillator (sine — crystal purity)
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = note.freq;

        // Harmonic overtone (octave, quieter)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = note.freq * 2;

        const gain = this.ctx.createGain();
        const gain2 = this.ctx.createGain();

        // Crystal envelope: instant attack, long natural decay
        const attackTime = 0.005;
        const decayTime = 15;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.7, now + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.1, now + attackTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.4);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);

        osc.start();
        osc2.start();
        osc.stop(now + decayTime + 0.1);
        osc2.stop(now + decayTime * 0.4 + 0.1);

        osc.onended = () => this.activeNotes.delete(note.label);
        this.activeNotes.set(note.label, { osc, gain });
    }

    stop(label: string): void {
        const active = this.activeNotes.get(label);
        if (!active || !this.ctx) return;
        const now = this.ctx.currentTime;
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(active.gain.gain.value, now);
        active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => {
            try { active.osc.stop(); } catch { /* ok */ }
            this.activeNotes.delete(label);
        }, 350);
    }
}

// ─── Widget Renderer ───────────────────────────────────────────────

class CrystalHarpWidget {
    private container: HTMLElement;
    private scale: ScaleDefinition;
    private appUrl: string;
    private audio = new WidgetAudio();
    private audioReady = false;
    private tubes: HTMLElement[] = [];
    private isDragging = false;
    private lastTriggered = -1;

    constructor(container: HTMLElement, scale: ScaleDefinition, appUrl: string) {
        this.container = container;
        this.scale = scale;
        this.appUrl = appUrl;
        this.render();
        this.setupGlobalListeners();
    }

    private render(): void {
        this.container.classList.add('ch-widget');
        this.container.style.setProperty('--ch-accent', this.scale.colors.primary);
        this.container.style.setProperty('--ch-glow', this.scale.colors.glow);

        // Prompt
        const prompt = document.createElement('div');
        prompt.className = 'ch-prompt';
        prompt.innerHTML = `<span class="ch-prompt-icon">🔔</span> <span>Tap to play · ${this.scale.name} · 432 Hz</span>`;

        // Tubes container
        const tubesWrap = document.createElement('div');
        tubesWrap.className = 'ch-tubes';

        // Render reversed: highest pitch (shortest) at top → lowest (longest) at bottom
        const reversed = [...this.scale.notes].reverse();
        this.tubes = new Array(this.scale.notes.length);

        reversed.forEach((note, visualIdx) => {
            const actualIdx = this.scale.notes.length - 1 - visualIdx;
            const tube = this.createTube(note, actualIdx, this.scale.notes.length);
            this.tubes[actualIdx] = tube;
            tubesWrap.appendChild(tube);
        });

        this.container.appendChild(prompt);
        this.container.appendChild(tubesWrap);

        // "Compare other scales" link
        if (this.appUrl) {
            const compareLink = document.createElement('a');
            compareLink.className = 'ch-compare-link';
            compareLink.href = this.appUrl;
            compareLink.target = '_blank';
            compareLink.rel = 'noopener';
            compareLink.innerHTML = '🎵 Compare all scales →';
            this.container.appendChild(compareLink);
        }
    }

    private createTube(note: ScaleNote, index: number, total: number): HTMLElement {
        const tube = document.createElement('div');
        tube.className = 'ch-tube';
        tube.dataset.index = String(index);

        // Width: longest at bottom, shortest at top
        const maxW = 95;
        const minW = 38;
        const width = maxW - ((maxW - minW) * index / (total - 1));
        tube.style.setProperty('--ch-tube-w', `${width}%`);

        // Height (thickness): uniform for easy tapping
        tube.style.setProperty('--ch-tube-h', '42px');

        tube.style.setProperty('--ch-tube-color', note.color);

        // Label
        const label = document.createElement('span');
        label.className = 'ch-label';
        label.textContent = note.label;
        tube.appendChild(label);

        // Glow
        const glow = document.createElement('div');
        glow.className = 'ch-glow';
        tube.appendChild(glow);

        // Events
        tube.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.triggerNote(index);
            this.isDragging = true;
            this.lastTriggered = index;
        });

        tube.addEventListener('pointerenter', (e) => {
            if (this.isDragging && e.pressure > 0 && index !== this.lastTriggered) {
                this.triggerNote(index);
                this.lastTriggered = index;
            }
        });

        return tube;
    }

    private async triggerNote(index: number): Promise<void> {
        if (!this.audioReady) {
            this.audioReady = await this.audio.init();
            // Hide prompt
            const prompt = this.container.querySelector('.ch-prompt');
            if (prompt) prompt.classList.add('ch-hidden');
        }

        const note = this.scale.notes[index];
        this.audio.play(note);

        // Animate
        const tube = this.tubes[index];
        if (tube) {
            tube.classList.add('ch-playing');
            setTimeout(() => tube.classList.remove('ch-playing'), 1500);
        }
    }

    private setupGlobalListeners(): void {
        document.addEventListener('pointerup', () => {
            this.isDragging = false;
            this.lastTriggered = -1;
        });
        document.addEventListener('pointercancel', () => {
            this.isDragging = false;
            this.lastTriggered = -1;
        });
    }
}

// ─── Auto-init: find all [data-crystal-harp] elements ──────────────

function initWidgets(): void {
    const containers = document.querySelectorAll<HTMLElement>('[data-crystal-harp]');
    containers.forEach((el) => {
        const scaleId = el.dataset.scale || 'chakra-c';
        const appUrl = el.dataset.appUrl || '';
        const scale = SCALES.find(s => s.id === scaleId) || SCALES[0];
        new CrystalHarpWidget(el, scale, appUrl);
    });
}

// Init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
} else {
    initWidgets();
}
