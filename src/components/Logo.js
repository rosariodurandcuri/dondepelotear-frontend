/**
 * LOGO — insignia con arco, red y balón clásico. El nombre se toma de la configuración.
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
    <!-- Insignia: césped, arco con red y balón -->
    <rect x="4" y="4" width="56" height="56" rx="14" fill="#16a34a"/>
    <path d="M4 44h56v2a14 14 0 0 1-14 14H18A14 14 0 0 1 4 46z" fill="#15803d"/>
    <!-- Red -->
    <g stroke="#fff" stroke-width="1.1" opacity="0.5">
      <line x1="20" y1="18" x2="20" y2="46"/><line x1="26" y1="18" x2="26" y2="46"/><line x1="32" y1="18" x2="32" y2="46"/><line x1="38" y1="18" x2="38" y2="46"/><line x1="44" y1="18" x2="44" y2="46"/>
      <line x1="14" y1="25" x2="50" y2="25"/><line x1="14" y1="32" x2="50" y2="32"/><line x1="14" y1="39" x2="50" y2="39"/>
    </g>
    <!-- Postes y travesaño -->
    <path d="M14 47V18h36v29" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
    <!-- Línea de gol -->
    <line x1="9" y1="47" x2="55" y2="47" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
    <!-- Balón con sombra -->
    <ellipse cx="42.5" cy="54.5" rx="10" ry="2.3" fill="#0b3d20" opacity="0.35"/>
    <g transform="translate(30 31) scale(0.62)">${ballSvg(clipId)}</g>
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
