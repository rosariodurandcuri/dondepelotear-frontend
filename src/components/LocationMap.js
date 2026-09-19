/**
 * MAPA INTERACTIVO (Leaflet + OpenStreetMap)
 * ------------------------------------------
 * Sin clave de API. Se usa para:
 *  - El propietario: buscar una dirección, mover el mapa y colocar el marcador
 *    exactamente donde está la cancha (arrastrando el marcador o tocando el mapa).
 *  - El jugador: ver dónde está la cancha.
 *
 * Si Leaflet no cargó (sin internet), mountLocationMap() devuelve null y el
 * contenedor muestra el contenido de respaldo que tenga dentro.
 *
 * Para cambiar a Google Maps o Mapbox: reemplaza solo este archivo manteniendo
 * las mismas funciones (mountLocationMap, geocodeAddress).
 */
import { html } from '../utils/dom.js';

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export function leafletReady() {
  return typeof window !== 'undefined' && Boolean(window.L);
}

/** Contenedor del mapa. El contenido interior se muestra si el mapa no puede cargar. */
export function LocationMap({ id = 'map', height = 320, fallback = '' } = {}) {
  return html`<div class="location-map" data-map="${id}" style="height:${height}px">${fallback}</div>`;
}

/** Icono del marcador (SVG con el color de la marca) */
function markerIcon() {
  return window.L.divIcon({
    className: 'map-marker',
    html: '<svg viewBox="0 0 32 42" width="32" height="42"><path d="M16 1C8 1 2 7.3 2 15c0 10 14 26 14 26s14-16 14-26C30 7.3 24 1 16 1z" fill="#16a34a" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>',
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -36],
  });
}

/**
 * Monta el mapa dentro del contenedor.
 * options = { lat, lng, zoom, draggable, onChange(lat, lng), popup }
 * Devuelve { map, marker, setPosition(lat, lng, zoom?) } o null si Leaflet no está disponible.
 */
export function mountLocationMap(container, { lat, lng, zoom = 15, draggable = false, onChange = null, popup = '' } = {}) {
  if (!leafletReady() || !container) return null;
  const L = window.L;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasCoords ? { lat, lng } : DEFAULT_CENTER;

  container.innerHTML = '';
  const map = L.map(container, { scrollWheelZoom: draggable, zoomControl: true }).setView([center.lat, center.lng], hasCoords ? zoom : 11);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

  const marker = L.marker([center.lat, center.lng], { icon: markerIcon(), draggable }).addTo(map);
  if (popup) marker.bindPopup(popup);

  const notify = () => {
    const pos = marker.getLatLng();
    if (onChange) onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
  };

  if (draggable) {
    marker.on('dragend', notify);
    // Tocar el mapa también coloca el marcador ahí
    map.on('click', (e) => { marker.setLatLng(e.latlng); notify(); });
  }

  // Leaflet necesita recalcular el tamaño cuando el contenedor termina de dibujarse
  setTimeout(() => map.invalidateSize(), 50);

  return {
    map,
    marker,
    setPosition(newLat, newLng, newZoom) {
      if (!Number.isFinite(newLat) || !Number.isFinite(newLng)) return;
      marker.setLatLng([newLat, newLng]);
      // Sin animación: así varios cambios seguidos (departamento → provincia → distrito) no se pierden
      map.setView([newLat, newLng], newZoom || map.getZoom(), { animate: false });
    },
  };
}

/**
 * Busca una dirección o lugar (geocodificación con Nominatim de OpenStreetMap).
 * Devuelve [{ label, lat, lng }]. Limitado a Perú.
 */
export async function geocodeAddress(query, { limit = 5 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pe&addressdetails=0&limit=${limit}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('No se pudo buscar la dirección. Intenta de nuevo.');
  const data = await res.json();
  return data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

/**
 * Geocodificación inversa: coordenadas → dirección ("Av. La Marina 2355").
 * Devuelve { address, full } o null si no hay resultado.
 */
export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.error) return null;
  const a = data.address || {};
  const street = a.road || a.pedestrian || a.footway || a.residential || a.path || '';
  const number = a.house_number || '';
  const area = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.village || a.town || '';
  let address = [street, number].filter(Boolean).join(' ').trim();
  if (!address) address = area || (data.display_name || '').split(',').slice(0, 2).join(',').trim();
  else if (area && !street.toLowerCase().includes(area.toLowerCase())) address = `${address}, ${area}`;
  return { address, full: data.display_name || address };
}
