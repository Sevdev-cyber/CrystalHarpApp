/**
 * ScaleInfo — Education panel with scale description and buy CTA
 */

import type { ScaleDefinition } from '../types';

export class ScaleInfo {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add('scale-info');
  }

  render(scale: ScaleDefinition): void {
    this.container.innerHTML = '';

    // Notes display
    const notesRow = document.createElement('div');
    notesRow.className = 'info-notes';
    notesRow.innerHTML = `
      <span class="info-notes-label">Notes</span>
      <span class="info-notes-list">${scale.notes.map(n => n.label).join(' · ')}</span>
    `;

    // Description
    const desc = document.createElement('p');
    desc.className = 'info-desc';
    desc.textContent = scale.description;

    // CTA button
    const cta = document.createElement('a');
    cta.className = 'info-cta';
    cta.href = scale.productUrl;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.innerHTML = `
      <span class="cta-icon">✨</span>
      <span class="cta-text">See this scale</span>
      <span class="cta-arrow">→</span>
    `;

    // Suggestion text
    const tip = document.createElement('p');
    tip.className = 'info-tip';
    tip.textContent = 'Tap the tubes to feel each scale\'s unique resonance. Not sure which harp is right for you? Try them all.';

    this.container.appendChild(notesRow);
    this.container.appendChild(desc);
    this.container.appendChild(cta);
    this.container.appendChild(tip);
  }
}
