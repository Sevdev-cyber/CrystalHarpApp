
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private activeOscillators: Set<{ oscs: OscillatorNode[], gain: GainNode }> = new Set();

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (typeof window !== 'undefined' && !this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this.setupReverb();
    }
  }

  private async setupReverb() {
    if (!this.ctx || !this.masterGain) return;
    
    // 8-second lush impulse response for a deep meditative hall sound
    const length = this.ctx.sampleRate * 8.0;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let i = 0; i < 2; i++) {
      const channelData = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3.0);
      }
    }
    
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.masterGain);
  }

  public playCrystalNote(frequency: number, duration: number = 8.0) {
    if (!this.ctx || !this.reverbNode) {
      this.initContext();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
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
