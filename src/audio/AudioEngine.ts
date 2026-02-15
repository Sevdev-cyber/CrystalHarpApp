/**
 * Crystal Harp Audio Engine
 * Handles loading real samples, pitch-shifting, playback with long sustain,
 * and glissando.
 */

import type { PlayMode, ScaleNote } from '../types';

interface ActiveNote {
    source: AudioBufferSourceNode | OscillatorNode;
    gain: GainNode;
    startTime: number;
}

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sampleBuffers: Map<string, AudioBuffer> = new Map();
    private activeNotes: Map<string, ActiveNote> = new Map();
    private _volume = 0.7;
    private _mode: PlayMode = 'mallet';
    private _muted = false;
    private useSamples = false;

    // Sample base path (will be Shopify asset URL in production)
    private sampleBasePath = `${import.meta.env.BASE_URL}samples`;

    async init(): Promise<boolean> {
        try {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this._volume;
            this.masterGain.connect(this.ctx.destination);

            // Try to load real samples
            await this.loadSamples();

            return true;
        } catch (e) {
            console.warn('AudioEngine init failed:', e);
            return false;
        }
    }

    async unlock(): Promise<boolean> {
        if (!this.ctx) await this.init();
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }
        return this.ctx?.state === 'running' || false;
    }

    private async loadSamples(): Promise<void> {
        // Quick pre-check: test if any sample exists before trying all
        try {
            const probe = await fetch(`${this.sampleBasePath}/mallet/C5.mp3`, { method: 'HEAD' });
            if (!probe.ok) {
                console.log('AudioEngine: no samples found, using synthesis');
                this.useSamples = false;
                return;
            }
        } catch {
            console.log('AudioEngine: samples unavailable, using synthesis');
            this.useSamples = false;
            return;
        }

        // Full chromatic set C5–F6 (432Hz tuned)
        const sampleNames = [
            'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5',
            'G5', 'G#5', 'A5', 'A#5', 'B5',
            'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6',
        ];

        // Load all samples in parallel for speed
        // Filenames use 's' instead of '#' (e.g., Cs5.mp3 for C#5)
        const noteToFilename = (n: string) => n.replace('#', 's');

        const loadPromises = sampleNames.map(async (note) => {
            try {
                const filename = noteToFilename(note);
                const url = `${this.sampleBasePath}/mallet/${filename}.mp3`;
                const response = await fetch(url);
                if (!response.ok) return 0;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
                // Store under note name with # for internal lookups
                this.sampleBuffers.set(`mallet:${note}`, audioBuffer);
                return 1;
            } catch {
                return 0;
            }
        });

        const results = await Promise.all(loadPromises);
        const loaded = results.filter(r => r === 1).length;
        this.useSamples = loaded > 0;
        console.log(`AudioEngine: loaded ${loaded} samples, useSamples=${this.useSamples}`);
    }

    /**
     * Normalize flat labels to sharp equivalents for sample lookup
     */
    private normalizeLabel(label: string): string {
        const flatToSharp: Record<string, string> = {
            Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
        };
        const m = label.match(/^([A-G])(b)(\d)$/);
        if (m && flatToSharp[m[1] + m[2]]) {
            return flatToSharp[m[1] + m[2]] + m[3];
        }
        return label;
    }

    /**
     * Play a note from sample (with optional pitch shift)
     */
    play(note: ScaleNote): void {
        if (!this.ctx || !this.masterGain || this._muted) return;

        // Normalize flat labels to sharp for sample lookups
        const normalizedLabel = this.normalizeLabel(note.label);
        const normalizedSampleKey = this.normalizeLabel(note.sampleKey);

        // Fade out any existing instance of this note (natural overlap, no clicks)
        this.stopNote(note.label, 0.08);

        // Try exact sample match first (best quality), then nearest with pitch-shift
        const exactKey = `mallet:${normalizedLabel}`;
        const shiftKey = `mallet:${normalizedSampleKey}`;
        const exactBuffer = this.sampleBuffers.get(exactKey);
        const shiftBuffer = this.sampleBuffers.get(shiftKey);

        let active: ActiveNote;

        if (exactBuffer && this.useSamples) {
            // --- Direct sample playback (no pitch shift needed) ---
            const source = this.ctx.createBufferSource();
            source.buffer = exactBuffer;
            source.playbackRate.value = 1.0;

            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            source.connect(gain);
            gain.connect(this.masterGain);
            source.start();
            active = { source, gain, startTime: this.ctx.currentTime };
            source.onended = () => this.activeNotes.delete(note.label);

        } else if (shiftBuffer && this.useSamples) {
            // --- Fallback: nearest sample with pitch shift ---
            const source = this.ctx.createBufferSource();
            source.buffer = shiftBuffer;
            source.playbackRate.value = Math.pow(2, note.semitoneShift / 12);

            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;

            source.connect(gain);
            gain.connect(this.masterGain);
            source.start();

            active = { source, gain, startTime: this.ctx.currentTime };

            source.onended = () => {
                this.activeNotes.delete(note.label);
            };
        } else {
            // No sample available — skip this note
            return;
        }

        this.activeNotes.set(note.label, active);
    }



    /**
     * Play glissando — rapid note sequence
     */
    async playGlissando(notes: ScaleNote[], direction: 'up' | 'down' = 'up', delayMs = 60): Promise<void> {
        const ordered = direction === 'up' ? [...notes] : [...notes].reverse();
        for (const note of ordered) {
            this.play(note);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    /**
     * Stop a specific note with fade-out
     */
    stopNote(label: string, fadeTime = 0.5): void {
        const active = this.activeNotes.get(label);
        if (!active || !this.ctx) return;

        const now = this.ctx.currentTime;
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(active.gain.gain.value, now);
        active.gain.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);

        setTimeout(() => {
            try { active.source.stop(); } catch { /* already stopped */ }
            this.activeNotes.delete(label);
        }, fadeTime * 1000 + 50);
    }

    /**
     * Stop all playing notes
     */
    stopAll(fadeTime = 0.8): void {
        for (const label of this.activeNotes.keys()) {
            this.stopNote(label, fadeTime);
        }
    }

    /**
     * Check if any notes are currently playing
     */
    get isPlaying(): boolean {
        return this.activeNotes.size > 0;
    }

    /**
     * Get labels of currently playing notes
     */
    get playingNotes(): string[] {
        return Array.from(this.activeNotes.keys());
    }

    // --- Controls ---

    set volume(v: number) {
        this._volume = Math.max(0, Math.min(1, v));
        if (this.masterGain) {
            this.masterGain.gain.value = this._muted ? 0 : this._volume;
        }
    }

    get volume(): number {
        return this._volume;
    }

    set muted(m: boolean) {
        this._muted = m;
        if (this.masterGain) {
            this.masterGain.gain.value = m ? 0 : this._volume;
        }
    }

    get muted(): boolean {
        return this._muted;
    }

    set mode(m: PlayMode) {
        this._mode = m;
    }

    get mode(): PlayMode {
        return this._mode;
    }

    get hasSamples(): boolean {
        return this.useSamples;
    }
}

export const audioEngine = new AudioEngine();
