/**
 * ESTRUCTURA DEL PANEL DEL PROPIETARIO — menú lateral + contenido.
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';
import { currentRoute } from '../router.js';

const LINKS = [
  { path: '/propietario', label: 'Resumen', icon: 'grid', exact: true },
  { path: '/propietario/canchas', label: 'Mis canchas', icon: 'ball' },
  { path: '/propietario/calendario', label: 'Calendario', icon: 'calendar' },
  { path: '/propietario/reservas', label: 'Reservas', icon: 'list' },
  { path: '/propietario/ajustes', label: 'Ajustes', icon: 'settings' },
];

export function OwnerLayout(content) {
  const { path } = currentRoute();
  return html`
    <div class="container">
      <div class="owner-layout">
        <nav class="owner-nav">
          ${LINKS.map((l) => {
            const active = l.exact ? path === l.path : path.startsWith(l.path);
            return html`<a href="#${l.path}" class="${active ? 'active' : ''}">${icon(l.icon)} ${l.label}</a>`;
          })}
          <a href="#/propietario/canchas/nueva" class="${path === '/propietario/canchas/nueva' ? 'active' : ''}">${icon('plus')} Publicar cancha</a>
        </nav>
        <div class="owner-content">${content}</div>
      </div>
    </div>`;
}

export function StatCard({ iconName, value, label }) {
  return html`
    <div class="card stat-card">
      <span class="stat-icon">${icon(iconName)}</span>
      <span class="stat-value">${value}</span>
      <span class="stat-label">${label}</span>
    </div>`;
}
