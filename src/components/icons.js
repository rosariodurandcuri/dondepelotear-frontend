/**
 * ICONOS — Lucide Icons (CDN) con respaldo SVG propio
 * ----------------------------------------------------
 * Uso: icon('search') → devuelve el icono listo para insertar en una plantilla.
 *  - Si Lucide cargó desde el CDN, se genera <i data-lucide="search"> y la
 *    librería lo convierte en SVG (ver refreshIcons() en utils/dom.js).
 *  - Si no hay internet, se usa el SVG de respaldo definido en PATHS.
 * Los trazos usan "currentColor", así toman el color del texto.
 */
import { raw } from '../utils/dom.js';

/** Nombre interno → nombre del icono en Lucide (https://lucide.dev/icons) */
const LUCIDE = {
  search: 'search', mapPin: 'map-pin', map: 'map', calendar: 'calendar', clock: 'clock', star: 'star', ball: 'goal',
  check: 'check', checkCircle: 'circle-check', x: 'x', menu: 'menu', user: 'user', arrowLeft: 'arrow-left', arrowRight: 'arrow-right',
  chevronDown: 'chevron-down', chevronLeft: 'chevron-left', chevronRight: 'chevron-right', plus: 'plus', edit: 'pencil', trash: 'trash-2',
  lock: 'lock', unlock: 'lock-open', image: 'image', money: 'banknote', grid: 'layout-dashboard', list: 'list', filter: 'sliders-horizontal',
  phone: 'phone', mail: 'mail', home: 'house', logout: 'log-out', users: 'users', trending: 'trending-up',
  info: 'info', navigation: 'navigation', eye: 'eye', eyeOff: 'eye-off', heart: 'heart', settings: 'settings',
  light: 'lightbulb', car: 'car', shirt: 'shirt', shower: 'shower-head', toilet: 'toilet', stands: 'armchair', coffee: 'coffee',
};

/** Iconos de marca que no existen en Lucide: se dibujan siempre con su logo real */
const BRAND = {
  whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>',
};

function lucideReady() {
  return typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function';
}

const PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mapPin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 3.5 2.5-1.3 4.2H9.8L8.5 9.5 12 7z"/><path d="M12 7V3.2M15.5 9.5l3.6-1.2M14.2 13.7l2.3 3.1M9.8 13.7l-2.3 3.1M8.5 9.5 4.9 8.3"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m13.5 6.5 3 3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10h.01M18 14h.01"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  filter: '<path d="M4 5h16l-6.5 8v5l-3 2v-7L4 5z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  home: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M13 4h6v16h-6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2"/>',
  trending: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  navigation: '<path d="m3 11 18-8-8 18-2-8-8-2z"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.5 10.6a2.5 2.5 0 0 0 3.4 3.4M7.4 7.5C4.3 9.3 2 12 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1M9.9 6.2C10.6 6.1 11.3 6 12 6c6.5 0 10 6 10 6s-.9 1.5-2.5 3"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  whatsapp: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  // Servicios
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3z"/>',
  car: '<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3H4z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>',
  shirt: '<path d="m8 4 4 2 4-2 5 3-2 4-2-1v10H7V10l-2 1-2-4 5-3z"/>',
  shower: '<path d="M4 20V9a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1M8 10h10M9 14h.01M12 14h.01M15 14h.01M10 17h.01M13 17h.01M16 17h.01"/>',
  toilet: '<path d="M7 3h8v8H7zM5 11h14a7 7 0 0 1-7 7 7 7 0 0 1-7-7zM10 18v3h4v-3"/>',
  stands: '<path d="M3 20h18M3 20v-4h5v-4h5V8h5"/>',
  coffee: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM16 10h2a2 2 0 0 1 0 4h-2M7 4v2M10 4v2M13 4v2"/>',
};

export function icon(name, className = 'icon', attrs = '') {
  if (BRAND[name]) {
    return raw(`<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ${attrs}>${BRAND[name]}</svg>`);
  }
  if (lucideReady() && LUCIDE[name]) {
    return raw(`<i data-lucide="${LUCIDE[name]}" class="${className}" aria-hidden="true" ${attrs}></i>`);
  }
  const path = PATHS[name] || PATHS.info;
  return raw(
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
  );
}

/** Estrella rellena para calificaciones */
export function starIcon(className = 'icon') {
  if (lucideReady()) return raw(`<i data-lucide="star" class="${className}" fill="currentColor" aria-hidden="true"></i>`);
  return raw(`<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${PATHS.star}</svg>`);
}

/** Corazón (favoritos): relleno cuando está activo */
export function heartIcon(active = false, className = 'icon') {
  return icon('heart', className, active ? 'fill="currentColor"' : '');
}
