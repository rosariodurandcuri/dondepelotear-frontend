/**
 * ESTADO VACÍO — mensaje amable cuando no hay resultados o datos.
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';

export function EmptyState({ iconName = 'search', title, message, action = null }) {
  return html`
    <div class="empty-state">
      ${icon(iconName)}
      <h3>${title}</h3>
      <p>${message}</p>
      ${action ? html`<div class="mt-3">${action}</div>` : ''}
    </div>`;
}

export function Loading(text = 'Cargando…') {
  return html`<div class="loading-block"><span class="spinner spinner-dark"></span> ${text}</div>`;
}
