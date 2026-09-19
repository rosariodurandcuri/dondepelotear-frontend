/**
 * RESULTADOS DE BÚSQUEDA (nacional) — buscador, filtros combinables, orden y tarjetas.
 * Los filtros viven en la URL (#/buscar?department=Lima&district=San%20Miguel&type=F7),
 * así se puede compartir el enlace y el botón "atrás" funciona.
 */
import { html, render, $ } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { SearchBar, bindSearchBar } from '../components/SearchBar.js';
import { FilterPanel, readFilters } from '../components/FilterPanel.js';
import { FieldCard, bindFavoriteButtons } from '../components/FieldCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { showToast } from '../components/Toast.js';
import { searchFields } from '../services/fieldService.js';
import { SORT_OPTIONS, PRICE_RANGES, AVAILABILITY_FILTERS, SERVICES, RATING_FILTERS, fieldTypeLabel } from '../config/constants.js';
import { navigate } from '../router.js';
import { todayISO, formatDateShort, addDays, formatDateLong } from '../utils/dates.js';
import { getStoredLocation } from '../services/geoService.js';

export default async function SearchPage(root, { query }) {
  const filters = {
    q: query.q || '',
    department: query.department || '',
    province: query.province || '',
    district: query.district || '',
    date: query.date || todayISO(),
    strictDate: Boolean(query.date), // si el usuario eligió fecha, solo se muestran canchas con horarios libres ese día
    type: query.type || '',
    time: query.time || '',
    priceRange: query.priceRange || '',
    availability: query.availability || '',
    minRating: query.minRating || '',
    services: query.services ? query.services.split(',') : [],
    sort: query.sort || 'recommended',
    lat: query.lat || '',
    lng: query.lng || '',
  };
  // Si el usuario compartió su ubicación y no eligió un orden, mostramos primero las más cercanas
  const userPos = getStoredLocation();
  if (userPos && !filters.lat) {
    if (!query.sort) filters.sort = 'distance';
    if (filters.sort === 'distance') { filters.lat = String(userPos.lat); filters.lng = String(userPos.lng); }
  }

  const { results, location, freeText } = await searchFields(filters);
  // Si la fecha elegida no tiene horarios libres, contamos cuántas canchas habría sin ese filtro para orientar al usuario
  const withoutDate = filters.strictDate && !results.length ? (await searchFields({ ...filters, strictDate: false, time: '' })).results.length : 0;
  // Los selects reflejan la ubicación efectiva (incluye el texto reconocido, ej. "Trujillo" → La Libertad / Trujillo)
  const effective = { ...filters, ...location, q: freeText };

  // Etiquetas de filtros activos (se quitan con un clic)
  const chips = [];
  if (location.department) chips.push({ key: 'department', label: location.department });
  if (location.province && location.province !== location.department) chips.push({ key: 'province', label: location.province });
  if (location.district) chips.push({ key: 'district', label: location.district });
  if (freeText) chips.push({ key: 'q', label: `"${freeText}"` });
  if (filters.type) chips.push({ key: 'type', label: fieldTypeLabel(filters.type) });
  if (filters.priceRange) chips.push({ key: 'priceRange', label: PRICE_RANGES.find((r) => r.id === filters.priceRange)?.label });
  if (filters.availability) chips.push({ key: 'availability', label: AVAILABILITY_FILTERS.find((a) => a.id === filters.availability)?.label });
  if (filters.minRating) chips.push({ key: 'minRating', label: html`${icon('star', 'icon icon-sm')} ${RATING_FILTERS.find((r) => r.id === filters.minRating)?.label}` });
  if (filters.time) chips.push({ key: 'time', label: `A las ${filters.time}` });
  if (query.lat) chips.push({ key: 'lat', label: 'Cerca de mí' });
  filters.services.forEach((s) => chips.push({ key: `service:${s}`, label: SERVICES.find((x) => x.id === s)?.label }));

  const place = location.district || location.province || location.department || freeText;
  const count = results.length;
  const title = `${count} ${count === 1 ? 'cancha encontrada' : 'canchas encontradas'}${place ? ` en ${place}` : ' en todo el Perú'}`;
  const nearby = filters.sort === 'distance';

  render(root, html`
    <div class="container search-page">
      <div class="search-topbar">${SearchBar(effective, { simple: true, compact: true })}</div>

      <div class="results-header">
        <div>
          <h1>${title}</h1>
          <p class="text-muted text-small">${filters.strictDate ? formatDateShort(filters.date) : 'Cualquier fecha'}${filters.time ? ` · ${filters.time}` : ''}${filters.type ? ` · ${fieldTypeLabel(filters.type)}` : ''}${nearby && filters.lat ? ' · ordenadas por cercanía a tu ubicación' : ''}</p>
        </div>
        <div class="results-tools">
          <button class="btn btn-outline btn-sm filters-toggle" data-filters-open>${icon('filter', 'icon icon-sm')} Filtros ${chips.length ? html`<span class="count-badge">${chips.length}</span>` : ''}</button>
          <button class="btn btn-outline btn-sm" data-near-me title="Ordenar por cercanía a tu ubicación">${icon('navigation', 'icon icon-sm')} <span class="hide-mobile">Cerca de mí</span></button>
          <label class="sort-select">
            <span class="hide-mobile">Ordenar:</span>
            <select class="form-control form-control-sm" data-sort aria-label="Ordenar por">
              ${SORT_OPTIONS.map((o) => html`<option value="${o.id}" ${filters.sort === o.id ? 'selected' : ''}>${o.label}</option>`)}
            </select>
          </label>
        </div>
      </div>

      ${chips.length ? html`
        <div class="active-filters">
          ${chips.map((c) => html`<button class="chip" data-remove-filter="${c.key}">${c.label} ${icon('x', 'icon icon-sm')}</button>`)}
          <button class="chip chip-clear" data-clear-all>Limpiar todo</button>
        </div>` : ''}

      <div class="search-layout">
        ${FilterPanel(effective)}
        <div>
          ${count
            ? html`<div class="fields-grid">${results.map((f) => FieldCard(f, { date: filters.date, showDistance: nearby }))}</div>`
            : withoutDate
              ? EmptyState({
                  iconName: 'calendar',
                  title: `Sin horarios libres el ${formatDateLong(filters.date)}${filters.time ? ` a las ${filters.time}` : ''}`,
                  message: `Hay ${withoutDate} ${withoutDate === 1 ? 'cancha' : 'canchas'}${place ? ` en ${place}` : ''} con estos filtros. Prueba con otra fecha u hora.`,
                  action: html`
                    <button class="btn btn-primary" data-next-day>Buscar para ${formatDateShort(addDays(filters.date, 1))}</button>
                    <button class="btn btn-outline" data-any-date>Ver sin fecha</button>`,
                })
              : EmptyState({
                  title: place ? `No hay canchas con esos filtros en ${place}` : 'No encontramos canchas con esos filtros',
                  message: 'Prueba con otra ubicación, otra fecha o quita algunos filtros.',
                  action: html`<a href="#/buscar" class="btn btn-outline">Ver todas las canchas del Perú</a>`,
                })}
        </div>
      </div>
    </div>`);

  // ---- Eventos ----
  const go = (changes) => {
    const { strictDate, ...rest } = { ...filters, ...location, q: freeText, ...changes };
    // La posición del usuario no se escribe en la URL: se toma sola de la sesión cuando el orden es "Más cercanas"
    if (!query.lat && !changes.lat) { rest.lat = ''; rest.lng = ''; }
    navigate('/buscar', { ...rest, date: strictDate ? rest.date : '', services: (rest.services || []).join(',') });
  };

  bindFavoriteButtons(root);
  bindSearchBar(root, { priceRange: filters.priceRange, availability: filters.availability, minRating: filters.minRating, services: filters.services.join(','), sort: filters.sort });

  $('[data-sort]', root).addEventListener('change', (e) => go({ sort: e.target.value }));

  // "Cerca de mí": pide la ubicación del navegador y ordena por distancia
  $('[data-near-me]', root).addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('Tu navegador no soporta geolocalización', 'error'); return; }
    showToast('Obteniendo tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => go({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), sort: 'distance' }),
      () => showToast('No pudimos obtener tu ubicación. Elige un lugar en el buscador.', 'error'),
      { timeout: 8000 }
    );
  });

  const panel = $('[data-filters]', root);
  const form = $('[data-filters-form]', root);
  const closePanel = () => { panel.classList.remove('open'); document.body.classList.remove('no-scroll'); };
  $('[data-filters-open]', root)?.addEventListener('click', () => { panel.classList.add('open'); document.body.classList.add('no-scroll'); });
  $('[data-filters-close]', root).addEventListener('click', closePanel);
  form.addEventListener('submit', (e) => { e.preventDefault(); closePanel(); go(readFilters(form)); });
  // En escritorio los filtros se aplican al instante
  form.addEventListener('change', () => { if (window.innerWidth >= 1000) go(readFilters(form)); });
  $('[data-filters-clear]', root).addEventListener('click', () => { closePanel(); go({ type: '', priceRange: '', availability: '', minRating: '', services: [], time: '' }); });
  $('[data-clear-all]', root)?.addEventListener('click', () => navigate('/buscar', { date: filters.strictDate ? filters.date : '' }));
  $('[data-next-day]', root)?.addEventListener('click', () => go({ date: addDays(filters.date, 1), time: '' }));
  $('[data-any-date]', root)?.addEventListener('click', () => go({ strictDate: false, time: '' }));

  root.querySelectorAll('[data-remove-filter]').forEach((chip) =>
    chip.addEventListener('click', () => {
      const key = chip.dataset.removeFilter;
      if (key.startsWith('service:')) go({ services: filters.services.filter((s) => s !== key.split(':')[1]) });
      else if (key === 'department') go({ department: '', province: '', district: '' });
      else if (key === 'province') go({ province: '', district: '' });
      else if (key === 'lat') go({ lat: '', lng: '', sort: 'recommended' });
      else go({ [key]: '' });
    })
  );
}
