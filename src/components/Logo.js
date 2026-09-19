/**
 * LOGO — pin de ubicación con balón clásico (dónde pelotear). El nombre se toma de la configuración.
 */
import { html, raw } from '../utils/dom.js';
import { APP_CONFIG } from '../config/app.js';

let iconCount = 0;

/** Balón clásico (pentágonos negros sobre blanco). Se reutiliza en el ícono y en el favicon. */
function ballSvg(clipId) {
  const patch = '<polygon points="14,-4 26,-4 27.5,3.5 20,8 12.5,3.5"/><line x1="20" y1="8" x2="20" y2="13"/>';
  return `<clipPath id="${clipId}"><circle cx="20" cy="20" r="18"/></clipPath>
      <circle cx="20" cy="20" r="18" fill="#fff"/>
      <g clip-path="url(#${clipId})" fill="#151515" stroke="#151515" stroke-width="1.7" stroke-linejoin="round">
        <g>${patch}</g>
        <g transform="rotate(72 20 20)">${patch}</g>
        <g transform="rotate(144 20 20)">${patch}</g>
        <g transform="rotate(216 20 20)">${patch}</g>
        <g transform="rotate(288 20 20)">${patch}</g>
        <polygon points="20,13 26.7,17.8 24.1,25.7 15.9,25.7 13.3,17.8"/>
      </g>
      <circle cx="20" cy="20" r="18" fill="none" stroke="#151515" stroke-width="2"/>`;
}

export function logoIcon(size = 30) {
  const clipId = `logo-ball-clip-${++iconCount}`; // el logo se dibuja en header y footer: cada uno necesita su propio id
  return raw(`<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <!-- Pin de ubicacion ("donde") con un balon clasico dentro -->
    <path d="M32 2C19.3 2 9 12.1 9 24.6 9 41.5 32 62 32 62s23-20.5 23-37.4C55 12.1 44.7 2 32 2z" fill="#16a34a"/>
    <path d="M32 6C21.5 6 13 14.3 13 24.6 13 36.9 27.5 52.4 32 57c4.5-4.6 19-20.1 19-32.4C51 14.3 42.5 6 32 6z" fill="#22c55e" opacity="0.55"/>
    <g transform="translate(15 8.5) scale(0.85)">${ballSvg(clipId)}</g>
    <circle cx="32" cy="54" r="2.4" fill="#f97316"/>
  </svg>`);
}

/**
 * Logo con texto HTML real (editable con CSS): "Cancha" en verde oscuro + "Ya" en verde brillante.
 * Las dos partes se definen en APP_CONFIG.nameParts; si no existen, se parte el nombre por la mitad.
 */
export function Logo({ href = '#/', size = 30 } = {}) {
  const name = APP_CONFIG.name;
  const parts = APP_CONFIG.nameParts || [name.slice(0, Math.ceil(name.length / 2)), name.slice(Math.ceil(name.length / 2))];
  const classes = ['logo-first', 'logo-second', 'logo-third'];
  return html`<a class="logo" href="${href}" aria-label="${name} - Inicio">${logoIcon(size)}<span class="logo-text">${parts.map((part, i) => html`<span class="${classes[i] || 'logo-second'}">${part}</span>`)}</span></a>`;
}
