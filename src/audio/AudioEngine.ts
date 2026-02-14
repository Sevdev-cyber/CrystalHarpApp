/**
 * Crystal Harp Audio Engine
 * Handles loading real samples, pitch-shifting, playback with long sustain,
 * and glissando. Falls back to synthesized tones if samples unavailable.
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
     * Play a note — either from sample (with pitch shift) or synthesized
     */
    play(note: ScaleNote): void {
        if (!this.ctx || !this.masterGain || this._muted) return;

        // Stop any existing instance with very short crossfade (prevents stutter)
        this.stopNote(note.label, 0.03);

        // Try exact sample match first (best quality), then nearest with pitch-shift
        const exactKey = `mallet:${note.label}`;
        const shiftKey = `mallet:${note.sampleKey}`;
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
            // --- Synthesized fallback (crystal-like tone) ---
            active = this.playSynthesized(note);
        }

        this.activeNotes.set(note.label, active);
    }

    /**
     * Synthesized crystal harp tone (placeholder until real samples)
     * Creates a bell-like tone with slow decay (~20-30 seconds)
     */
    private playSynthesized(note: ScaleNote): ActiveNote {
        const ctx = this.ctx!;
        const now = ctx.currentTime;

        // Main oscillator (sine for crystal purity)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = note.freq;

        // Harmonic overtones for crystal character
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = note.freq * 2; // octave

        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = note.freq * 3; // fifth above octave

        // Gains for each oscillator
        const gain = ctx.createGain();
        const gain2 = ctx.createGain();
        const gain3 = ctx.createGain();

        // Crystal-like envelope: quick attack, very long decay
        const attackTime = this._mode === 'mallet' ? 0.005 : 0.3; // mallet = instant, water = slow attack
        const sustainLevel = this._mode === 'mallet' ? 0.8 : 0.6;
        const decayTime = 25; // 25 seconds natural decay

        // Main tone
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

        // Overtone 1 (octave) — decays faster
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(sustainLevel * 0.15, now + attackTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.4);

        // Overtone 2 (higher) — decays fastest
        gain3.gain.setValueAtTime(0, now);
        gain3.gain.linearRampToValueAtTime(sustainLevel * 0.05, now + attackTime * 0.5);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.2);

        osc.connect(gain);
        osc2.connect(gain2);
        osc3.connect(gain3);
        gain.connect(this.masterGain!);
        gain2.connect(this.masterGain!);
        gain3.connect(this.masterGain!);

        osc.start();
        osc2.start();
        osc3.start();

        // Auto-stop after decay
        osc.stop(now + decayTime + 0.1);
        osc2.stop(now + decayTime * 0.4 + 0.1);
        osc3.stop(now + decayTime * 0.2 + 0.1);

        osc.onended = () => {
            this.activeNotes.delete(note.label);
        };

        return { source: osc, gain, startTime: now };
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
