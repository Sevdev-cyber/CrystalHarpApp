
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private activeOscillators: Set<{ oscs: OscillatorNode[], gain: GainNode }> = new Set();
  private activeBuffers: Set<{ source: AudioBufferSourceNode, gain: GainNode }> = new Set();
  private samplesPromise: Promise<void> | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private sampleMeta = [
    { note: 'D5', file: 'D5.mp3' },
    { note: 'D#5', file: 'D-sharp5.mp3' },
    { note: 'A#5', file: 'A-sharp5.mp3' },
    { note: 'C6', file: 'C6.mp3' },
  ];

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (typeof window !== 'undefined' && !this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.75;
      this.wetGain.gain.value = 0.25;
      this.dryGain.connect(this.masterGain);
      this.wetGain.connect(this.masterGain);
      this.setupReverb();
      this.loadSamples();
    }
  }

  private async setupReverb() {
    if (!this.ctx || !this.masterGain || !this.wetGain) return;

    // Shorter impulse response for a cleaner, less washy sound
    const length = this.ctx.sampleRate * 4.0;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let i = 0; i < 2; i++) {
      const channelData = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3.0);
      }
    }
    
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.wetGain);
  }

  private normalizeNoteLabel(label: string) {
    const match = label.match(/^([A-Ga-g])([#b]?)(\d)$/);
    if (!match) return label;
    const letter = match[1].toUpperCase();
    const accidental = match[2];
    const octave = match[3];
    const alias: Record<string, string> = {
      'Db': 'C#',
      'Eb': 'D#',
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#',
    };
    const note = `${letter}${accidental || ''}`;
    const normalized = alias[note] || note;
    return `${normalized}${octave}`;
  }

  private noteToMidi(label: string) {
    const match = label.match(/^([A-Ga-g])([#b]?)(\d)$/);
    if (!match) return null;
    const letter = match[1].toUpperCase();
    const accidental = match[2];
    const octave = parseInt(match[3], 10);
    const base: Record<string, number> = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };
    let semitone = base[letter];
    if (accidental === '#') semitone += 1;
    if (accidental === 'b') semitone -= 1;
    return (octave + 1) * 12 + semitone;
  }

  private midiToFreq(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private freqToMidi(freq: number) {
    return 69 + 12 * Math.log2(freq / 440);
  }

  private async loadSamples() {
    if (!this.ctx || this.samplesPromise) return this.samplesPromise;
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    this.samplesPromise = (async () => {
      for (const meta of this.sampleMeta) {
        if (this.sampleBuffers.has(meta.note)) continue;
        try {
          const url = `${baseUrl}samples/${meta.file}`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
          this.sampleBuffers.set(meta.note, audioBuffer);
        } catch (e) {}
      }
    })();
    return this.samplesPromise;
  }

  private tryPlaySample(frequency: number, duration: number, label?: string) {
    if (!this.ctx || !this.reverbNode) return false;
    const normalizedLabel = label ? this.normalizeNoteLabel(label) : null;
    const targetMidi = normalizedLabel ? this.noteToMidi(normalizedLabel) : this.freqToMidi(frequency);
    let best: { note: string; distance: number; freq: number } | null = null;

    for (const meta of this.sampleMeta) {
      const buffer = this.sampleBuffers.get(meta.note);
      if (!buffer) continue;
      const midi = this.noteToMidi(meta.note);
      if (midi === null || targetMidi === null) continue;
      const distance = Math.abs(targetMidi - midi);
      if (!best || distance < best.distance) {
        best = { note: meta.note, distance, freq: this.midiToFreq(midi) };
      }
    }

    if (!best) return false;
    const buffer = this.sampleBuffers.get(best.note);
    if (!buffer) return false;

    const ratio = frequency / best.freq;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(ratio, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    const totalDuration = Math.min(duration, buffer.duration / ratio);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);

    source.connect(gain);
    if (this.dryGain) gain.connect(this.dryGain);
    gain.connect(this.reverbNode);
    source.start();
    source.stop(now + totalDuration + 0.05);

    const nodeRef = { source, gain };
    this.activeBuffers.add(nodeRef);
    source.onended = () => {
      this.activeBuffers.delete(nodeRef);
    };
    return true;
  }

  public playCrystalNote(frequency: number, duration: number = 8.0, label?: string) {
    if (!this.ctx || !this.reverbNode) {
      this.initContext();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.loadSamples();

    if (this.tryPlaySample(frequency, duration, label)) {
      return;
    }

    const ctx = this.ctx!;
    const gain = ctx.createGain();
    
    // Crystal Singing Bowl Synthesis:
    // Focus on pure sine waves with microscopic detuning (0.1% to 0.3%) 
    // to create the signature "beating" or "pulsing" resonance.
    const harmonicRatios = [1.0, 1.003, 1.998, 3.0, 4.4]; 
    const harmonicGains = [0.6, 0.4, 0.15, 0.08, 0.05];
    const oscillators: OscillatorNode[] = [];

    harmonicRatios.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * ratio, ctx.currentTime);
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(harmonicGains[i], ctx.currentTime);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      oscillators.push(osc);
    });

    // Meditative Envelope: Soft Swell Attack
    gain.gain.setValueAtTime(0, ctx.currentTime);
    // Slow swell like a bowl being sung (700ms attack)
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.7);
    // Long sustain decay
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 2.5);
    // Deep fade out (8 seconds total)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    if (this.dryGain) gain.connect(this.dryGain);
    gain.connect(this.reverbNode!);
    
    oscillators.forEach(osc => osc.start());
    
    const nodeRef = { oscs: oscillators, gain };
    this.activeOscillators.add(nodeRef);

    oscillators.forEach(osc => {
      osc.stop(ctx.currentTime + duration + 1);
      osc.onended = () => {
        this.activeOscillators.delete(nodeRef);
      };
    });
  }

  public stopAllSounds() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeOscillators.forEach(node => {
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.linearRampToValueAtTime(0, now + 0.8); // Very soft stop
      setTimeout(() => {
        node.oscs.forEach(o => {
          try { o.stop(); } catch(e) {}
        });
      }, 900);
    });
    this.activeOscillators.clear();

    this.activeBuffers.forEach(node => {
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.linearRampToValueAtTime(0, now + 0.4);
      try { node.source.stop(now + 0.45); } catch(e) {}
    });
    this.activeBuffers.clear();
  }

  public setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(val / 100, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public isRunning() {
    return this.ctx?.state === 'running';
  }

  public async unlockAudio() {
    this.initContext();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    await this.loadSamples();
    try {
      // Tiny inaudible tick helps iOS finalize audio unlock.
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.masterGain ?? this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
    return this.ctx.state === 'running';
  }
}

export const audioService = new AudioService();
