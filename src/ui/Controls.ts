/**
 * Controls — Mallet/water toggle, volume, mute, stop, glissando buttons
 */

import type { PlayMode } from '../types';

export class Controls {
    private container: HTMLElement;
    private onModeChange?: (mode: PlayMode) => void;
    private onGlissando?: (direction: 'up' | 'down') => void;
    private currentMode: PlayMode = 'mallet';

    constructor(container: HTMLElement) {
        this.container = container;
    }

    setOnModeChange(cb: (mode: PlayMode) => void) {
        this.onModeChange = cb;
    }

    setOnGlissando(cb: (direction: 'up' | 'down') => void) {
        this.onGlissando = cb;
    }

    render(): void {
        this.container.className = 'controls';
        this.container.innerHTML = `
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
                    <span class="gliss-text">Glissando</span>
                </button>
                <button class="gliss-btn" id="gliss-down">
                    <span class="gliss-arrow">↓</span>
                    <span class="gliss-text">Glissando</span>
                </button>
            </div>
            <div class="controls-row vol-row">
                <button class="ctrl-btn mute-btn" id="mute-btn">🔊</button>
                <input type="range" class="vol-slider" id="vol-slider" min="0" max="100" value="70">
                <button class="ctrl-btn stop-btn" id="stop-btn">⏹</button>
            </div>
        `;

        this.bindEvents();
    }

    private bindEvents(): void {
        // Mode buttons
        document.getElementById('mode-mallet')?.addEventListener('click', () => this.setMode('mallet'));
        document.getElementById('mode-water')?.addEventListener('click', () => this.setMode('water'));

        // Glissando
        document.getElementById('gliss-up')?.addEventListener('click', () => this.onGlissando?.('up'));
        document.getElementById('gliss-down')?.addEventListener('click', () => this.onGlissando?.('down'));

        // Volume
        const volSlider = document.getElementById('vol-slider') as HTMLInputElement | null;
        volSlider?.addEventListener('input', () => {
            const event = new CustomEvent('volumechange', { detail: parseInt(volSlider.value) / 100 });
            this.container.dispatchEvent(event);
        });

        // Mute
        document.getElementById('mute-btn')?.addEventListener('click', () => {
            const event = new CustomEvent('mutetoggle');
            this.container.dispatchEvent(event);
        });

        // Stop
        document.getElementById('stop-btn')?.addEventListener('click', () => {
            const event = new CustomEvent('stopall');
            this.container.dispatchEvent(event);
        });
    }

    private setMode(mode: PlayMode): void {
        this.currentMode = mode;
        const mallet = document.getElementById('mode-mallet');
        const water = document.getElementById('mode-water');
        if (mallet) mallet.classList.toggle('active', mode === 'mallet');
        if (water) water.classList.toggle('active', mode === 'water');

        this.onModeChange?.(mode);
    }

    get mode(): PlayMode {
        return this.currentMode;
    }
}
