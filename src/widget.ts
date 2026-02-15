/**
 * Crystal Harp Widget — Lightweight Embeddable Player
 * For Shopify product pages — renders a single scale's harp
 * 
 * Usage:
 *   <div data-crystal-harp data-scale="chakra-c"></div>
 *   <script src="crystal-harp-widget.iife.js" defer></script>
 */

import { SCALES } from './types';
import type { ScaleDefinition, ScaleNote } from './types';
import './styles/widget.css';

// ─── Sample-based Audio Engine ─────────────────────────────────────

const SAMPLE_BASE = 'https://sevdev-cyber.github.io/CrystalHarpApp/samples/mallet/';
const ALL_NOTES = [
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
    'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6'
];

function noteToSemitone(note: string): number {
    const map: Record<string, number> = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    const m = note.match(/^([A-G]#?)(\d)$/);
    if (!m) return 0;
    return (parseInt(m[2]) + 1) * 12 + (map[m[1]] ?? 0);
}

function normalizeLabel(label: string): string {
    const flatMap: Record<string, string> = {
        'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
        'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
    };
    for (const [flat, sharp] of Object.entries(flatMap)) {
        if (label.startsWith(flat)) return sharp + label.slice(flat.length);
    }
    return label;
}

function findNearestSample(targetNote: string): { sampleNote: string; shift: number } {
    const normalized = normalizeLabel(targetNote);
    const targetSemi = noteToSemitone(normalized);
    let best = ALL_NOTES[0], bestDiff = 999;
    for (const n of ALL_NOTES) {
        const d = targetSemi - noteToSemitone(n);
        if (Math.abs(d) < Math.abs(bestDiff)) { bestDiff = d; best = n; }
    }
    return { sampleNote: best, shift: bestDiff };
}

class WidgetAudio {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();
    private activeNotes: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
    private loading = false;
    private loaded = false;

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
            if (!this.loaded && !this.loading) this.loadSamples();
            return true;
        } catch {
            return false;
        }
    }

    private async loadSamples(): Promise<void> {
        if (!this.ctx || this.loading) return;
        this.loading = true;
        const noteToFile = (n: string) => n.replace('#', 's') + '.mp3';

        await Promise.all(ALL_NOTES.map(async (note) => {
            try {
                const resp = await fetch(SAMPLE_BASE + noteToFile(note));
                if (!resp.ok) return;
                const buf = await this.ctx!.decodeAudioData(await resp.arrayBuffer());
                this.buffers.set(note, buf);
            } catch { /* skip failed samples */ }
        }));

        this.loaded = true;
        this.loading = false;
    }

    play(note: ScaleNote): void {
        if (!this.ctx || !this.masterGain) return;

        const label = normalizeLabel(note.label);
        this.stop(note.label);

        // Find exact or nearest sample
        const exactBuf = this.buffers.get(label);
        const { sampleNote, shift } = findNearestSample(label);
        const nearBuf = this.buffers.get(sampleNote);

        const buffer = exactBuf || nearBuf;
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = exactBuf ? 1.0 : Math.pow(2, shift / 12);

        const gain = this.ctx.createGain();
        gain.gain.value = 1.0;
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start();

        source.onended = () => this.activeNotes.delete(note.label);
        this.activeNotes.set(note.label, { source, gain });
    }

    stop(label: string): void {
        const active = this.activeNotes.get(label);
        if (!active || !this.ctx) return;
        const now = this.ctx.currentTime;
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(active.gain.gain.value, now);
        active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => {
            try { active.source.stop(); } catch { /* ok */ }
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
        tube.addEventListener('pointerdown', () => {
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
