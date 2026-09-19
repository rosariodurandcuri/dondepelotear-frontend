/**
 * LISTA DE SERVICIOS con icono (iluminación, estacionamiento, etc.)
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';
import { SERVICES } from '../config/constants.js';

/** Cuadrícula completa: muestra todos los servicios, apagados los que no tiene */
export function ServicesGrid(fieldServices = []) {
  return html`
    <div class="services-grid">
      ${SERVICES.map((s) => html`<div class="service-item ${fieldServices.includes(s.id) ? '' : 'off'}">${icon(s.icon)} ${s.label}</div>`)}
    </div>`;
}

/** Chips compactos: solo los servicios que tiene la cancha */
export function ServiceChips(fieldServices = [], max = 4) {
  const list = SERVICES.filter((s) => fieldServices.includes(s.id));
  return html`
    <div class="services-list">
      ${list.slice(0, max).map((s) => html`<span class="service-chip">${icon(s.icon)} ${s.label}</span>`)}
      ${list.length > max ? html`<span class="service-chip">+${list.length - max}</span>` : ''}
    </div>`;
}
