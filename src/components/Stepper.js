/**
 * INDICADOR DE PASOS del proceso de reserva.
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';

export function Stepper(steps, activeIndex) {
  return html`
    <div class="stepper">
      ${steps.map((label, i) => html`
        <div class="step ${i < activeIndex ? 'done' : ''} ${i === activeIndex ? 'active' : ''}">
          <span class="step-number">${i < activeIndex ? icon('check', 'icon icon-sm') : i + 1}</span>
          <span>${label}</span>
        </div>
        ${i < steps.length - 1 ? html`<div class="step-line ${i < activeIndex ? 'done' : ''}"></div>` : ''}`)}
    </div>`;
}
