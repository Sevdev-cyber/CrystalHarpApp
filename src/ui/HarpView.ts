/**
 * HarpView — Crystal tube rendering with touch/click and glissando
 */

import type { ScaleNote, ScaleDefinition } from '../types';
import { audioEngine } from '../audio/AudioEngine';

export class HarpView {
    private container: HTMLElement;
    private tubes: HTMLElement[] = [];
    private currentScale: ScaleDefinition | null = null;
    private isDragging = false;
    private lastTriggeredTube = -1;
    private onNotePlay?: (note: ScaleNote, index: number) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.classList.add('harp-view');
        this.setupGlobalListeners();
    }

    setOnNotePlay(cb: (note: ScaleNote, index: number) => void) {
        this.onNotePlay = cb;
    }

    render(scale: ScaleDefinition): void {
        this.currentScale = scale;
        this.container.innerHTML = '';
        this.tubes = new Array(scale.notes.length);

        // Base platform (bottom)
        const base = document.createElement('div');
        base.className = 'harp-base';

        const tubesWrap = document.createElement('div');
        tubesWrap.className = 'harp-tubes';

        // Render in reverse: highest pitch (shortest) at top → lowest (longest) at bottom
        const reversed = [...scale.notes].reverse();
        reversed.forEach((note, visualIdx) => {
            const actualIdx = scale.notes.length - 1 - visualIdx;
            const tube = this.createTube(note, actualIdx, scale.notes.length);
            this.tubes[actualIdx] = tube;
            tubesWrap.appendChild(tube);
        });

        const harpBody = document.createElement('div');
        harpBody.className = 'harp-body';
        harpBody.appendChild(tubesWrap);
        harpBody.appendChild(base);
        this.container.appendChild(harpBody);
    }

    private createTube(note: ScaleNote, index: number, total: number): HTMLElement {
        const tube = document.createElement('div');
        tube.className = 'harp-tube';
        tube.dataset.index = String(index);
        tube.dataset.note = note.label;

        // Width: lower pitch (low index) = longest, higher pitch (high index) = shortest
        const maxW = 95; // % of container — longest tube ≈ 3/4 screen on mobile
        const minW = 38;
        const width = maxW - ((maxW - minW) * index / (total - 1));
        tube.style.setProperty('--tube-width', `${width}%`);

        // Height (thickness): uniform for easy tapping
        tube.style.setProperty('--tube-height', 'clamp(40px, 9vw, 58px)');
        tube.style.setProperty('--tube-color', note.color);
        tube.style.setProperty('--tube-index', String(index));

        // Inner crystal effect
        const crystal = document.createElement('div');
        crystal.className = 'tube-crystal';

        // Glow ring
        const glow = document.createElement('div');
        glow.className = 'tube-glow';

        // Note label
        const label = document.createElement('span');
        label.className = 'tube-label';
        label.textContent = note.label;

        tube.appendChild(crystal);
        tube.appendChild(glow);
        tube.appendChild(label);

        // Touch/click events
        tube.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.triggerNote(index);
            this.isDragging = true;
            this.lastTriggeredTube = index;
        });

        tube.addEventListener('pointerenter', (e) => {
            if (this.isDragging && e.pressure > 0) {
                if (index !== this.lastTriggeredTube) {
                    this.triggerNote(index);
                    this.lastTriggeredTube = index;
                }
            }
        });

        return tube;
    }

    private setupGlobalListeners(): void {
        document.addEventListener('pointerup', () => {
            this.isDragging = false;
            this.lastTriggeredTube = -1;
        });

        document.addEventListener('pointercancel', () => {
            this.isDragging = false;
            this.lastTriggeredTube = -1;
        });
    }

    private triggerNote(index: number): void {
        if (!this.currentScale) return;
        const note = this.currentScale.notes[index];
        audioEngine.play(note);
        this.animateTube(index);
        this.onNotePlay?.(note, index);
    }

    private animateTube(index: number): void {
        const tube = this.tubes[index];
        if (!tube) return;

        tube.classList.add('playing');
        setTimeout(() => tube.classList.remove('playing'), 2000);
    }

    /**
     * Play glissando — swipe all tubes
     */
    async playGlissando(direction: 'up' | 'down' = 'up'): Promise<void> {
        if (!this.currentScale) return;

        const notes = direction === 'up'
            ? [...this.currentScale.notes]
            : [...this.currentScale.notes].reverse();

        const indices = direction === 'up'
            ? this.currentScale.notes.map((_, i) => i)
            : this.currentScale.notes.map((_, i) => i).reverse();

        for (let i = 0; i < notes.length; i++) {
            audioEngine.play(notes[i]);
            this.animateTube(indices[i]);
            await new Promise(r => setTimeout(r, 70));
        }
    }
}
