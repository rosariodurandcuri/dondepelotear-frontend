/**
 * MAPA DE LA CANCHA (página de detalle y de reserva)
 * --------------------------------------------------
 * Dibuja un mapa real (Leaflet/OpenStreetMap) con el marcador de la cancha.
 * Si Leaflet no está disponible (sin internet) muestra un mapa ilustrativo.
 * Incluye el enlace "Cómo llegar" que abre Google Maps con las coordenadas.
 *
 * Uso:  render(root, MapPreview(field));  mountFieldMap(root, field);
 */
import { html, raw } from '../utils/dom.js';
import { icon } from './icons.js';
import { formatLocation } from '../utils/format.js';
import { LocationMap, mountLocationMap } from './LocationMap.js';

export function MapPreview(field) {
  const { latitude, longitude, address, name } = field;
  const place = formatLocation(field, { full: true });
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${address}, ${place}`)}`;
  return html`
    <div class="map-preview">
      ${LocationMap({ id: 'field', height: 300, fallback: raw(mapSvg(name)) })}
      <div class="map-preview-footer">
        <div class="text-small">
          <strong>${address}</strong><br />
          <span class="text-muted">${place}${hasCoords ? html` · <span class="text-xs">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>` : ''}</span>
        </div>
        <a class="btn btn-outline btn-sm" href="${mapsUrl}" target="_blank" rel="noopener">${icon('navigation', 'icon icon-sm')} Cómo llegar</a>
      </div>
    </div>`;
}

/** Activa el mapa real dentro del MapPreview ya dibujado (si Leaflet cargó) */
export function mountFieldMap(root, field) {
  const container = root.querySelector('[data-map="field"]');
  if (!container) return null;
  return mountLocationMap(container, {
    lat: field.latitude,
    lng: field.longitude,
    zoom: 15,
    draggable: false,
    popup: `<strong>${String(field.name).replace(/[<>&"]/g, '')}</strong><br>${String(field.address).replace(/[<>&"]/g, '')}`,
  });
}

function mapSvg(label = '') {
  const safe = String(label).replace(/[<>&"]/g, '');
  return `<svg viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa de ${safe}">
    <rect width="800" height="340" fill="#e9f1ea"/>
    <g stroke="#ffffff" stroke-width="14" fill="none" opacity="0.95">
      <path d="M-20 90 H820"/><path d="M-20 230 H820"/><path d="M140 -20 V360"/><path d="M420 -20 V360"/><path d="M660 -20 V360"/>
    </g>
    <g stroke="#d5e3d8" stroke-width="6" fill="none"><path d="M-20 160 H820"/><path d="M280 -20 V360"/><path d="M540 -20 V360"/></g>
    <g fill="#cfe4d3"><rect x="160" y="105" width="100" height="40" rx="6"/><rect x="440" y="250" width="80" height="60" rx="6"/><rect x="680" y="110" width="90" height="100" rx="6"/><rect x="20" y="250" width="100" height="70" rx="6"/></g>
    <circle cx="400" cy="160" r="46" fill="#16a34a" opacity="0.15"/>
    <g transform="translate(400 160)">
      <path d="M0 -44c-15 0-27 12-27 27 0 20 27 44 27 44s27-24 27-44c0-15-12-27-27-27z" fill="#16a34a" stroke="#fff" stroke-width="4"/>
      <circle cx="0" cy="-17" r="10" fill="#fff"/>
    </g>
    <text x="400" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#1a1f1c">${safe}</text>
    <text x="785" y="328" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" fill="#6b776f">Mapa ilustrativo · conéctate a internet para ver el mapa real</text>
  </svg>`;
}
