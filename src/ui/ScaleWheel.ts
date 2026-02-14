/**
 * ScaleWheel — Scale selector (clean pill strip layout)
 */

import type { ScaleDefinition } from '../types';
import { SCALES } from '../types';

export class ScaleWheel {
    private container: HTMLElement;
    private currentIndex = 0;
    private onSelect?: (scale: ScaleDefinition) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.classList.add('scale-wheel');
    }

    setOnSelect(cb: (scale: ScaleDefinition) => void) {
        this.onSelect = cb;
    }

    render(): void {
        this.container.innerHTML = '';

        // Center display — current scale name + subtitle
        const center = document.createElement('div');
        center.className = 'wheel-center';

        const label = document.createElement('div');
        label.className = 'wheel-label';
        label.textContent = 'SCALE';

        const name = document.createElement('div');
        name.className = 'wheel-name';
        name.id = 'wheel-scale-name';

        const subtitle = document.createElement('div');
        subtitle.className = 'wheel-subtitle';
        subtitle.id = 'wheel-scale-subtitle';

        center.appendChild(label);
        center.appendChild(name);
        center.appendChild(subtitle);

        // Scale buttons in a scrollable pill row
        const ring = document.createElement('div');
        ring.className = 'wheel-ring';

        SCALES.forEach((scale, i) => {
            const btn = document.createElement('button');
            btn.className = 'wheel-btn';
            btn.dataset.index = String(i);
            btn.textContent = scale.name;
            btn.style.setProperty('--btn-color', scale.colors.primary);
            btn.addEventListener('click', () => this.selectScale(i));
            ring.appendChild(btn);
        });

        this.container.appendChild(center);
        this.container.appendChild(ring);

        // Select first scale
        this.selectScale(0);
    }

    selectScale(index: number): void {
        this.currentIndex = index;
        const scale = SCALES[index];

        // Update center text
        const nameEl = document.getElementById('wheel-scale-name');
        const subtitleEl = document.getElementById('wheel-scale-subtitle');
        if (nameEl) nameEl.textContent = scale.name;
        if (subtitleEl) subtitleEl.textContent = scale.subtitle;

        // Update button active states
        this.container.querySelectorAll('.wheel-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });

        // Update accent color on container
        this.container.style.setProperty('--scale-primary', scale.colors.primary);
        this.container.style.setProperty('--scale-secondary', scale.colors.secondary);
        this.container.style.setProperty('--scale-glow', scale.colors.glow);

        // Scroll active button into view
        const activeBtn = this.container.querySelector('.wheel-btn.active') as HTMLElement;
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        this.onSelect?.(scale);
    }

    get current(): ScaleDefinition {
        return SCALES[this.currentIndex];
    }
}
