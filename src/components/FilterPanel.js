/**
 * PANEL DE FILTROS — tipo, precio, disponibilidad, calificación y servicios.
 * (La ubicación se elige en el buscador superior, no aquí.)
 * En móvil se abre como hoja completa; en escritorio es una columna fija.
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';
import { FIELD_TYPES, PRICE_RANGES, AVAILABILITY_FILTERS, SERVICES, RATING_FILTERS } from '../config/constants.js';

export function FilterPanel(filters) {
  const selectedServices = filters.services || [];
  const radio = (name, value, label, checked) => html`
    <label class="choice"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} /><span>${label}</span></label>`;
  return html`
    <aside class="filters" data-filters>
      <div class="filters-header">
        <h2>Filtros</h2>
        <button class="btn btn-ghost btn-icon filters-close" data-filters-close aria-label="Cerrar filtros">${icon('x')}</button>
      </div>
      <form data-filters-form>
        <div class="filter-group">
          <h3>Tipo de cancha</h3>
          ${radio('type', '', 'Todas', !filters.type)}
          ${FIELD_TYPES.map((t) => radio('type', t.id, t.label, filters.type === t.id))}
        </div>
        <div class="filter-group">
          <h3>Precio por hora</h3>
          ${radio('priceRange', '', 'Cualquier precio', !filters.priceRange)}
          ${PRICE_RANGES.map((r) => radio('priceRange', r.id, r.label, filters.priceRange === r.id))}
        </div>
        <div class="filter-group">
          <h3>Disponibilidad</h3>
          ${radio('availability', '', 'Cualquiera', !filters.availability)}
          ${AVAILABILITY_FILTERS.map((a) => radio('availability', a.id, a.label, filters.availability === a.id))}
        </div>
        <div class="filter-group">
          <h3>Calificación</h3>
          ${radio('minRating', '', 'Todas', !filters.minRating)}
          ${RATING_FILTERS.map((r) => radio('minRating', r.id, r.label, filters.minRating === r.id))}
        </div>
        <div class="filter-group">
          <h3>Servicios</h3>
          ${SERVICES.map((s) => html`<label class="choice"><input type="checkbox" name="services" value="${s.id}" ${selectedServices.includes(s.id) ? 'checked' : ''} /><span>${s.label}</span></label>`)}
        </div>
        <div class="filter-group filter-group-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-filters-clear>Limpiar filtros</button>
        </div>
        <div class="filters-apply">
          <button type="submit" class="btn btn-primary btn-block btn-lg">Ver resultados</button>
        </div>
      </form>
    </aside>`;
}

/** Lee el estado del formulario de filtros como objeto */
export function readFilters(form) {
  const data = new FormData(form);
  return {
    type: data.get('type') || '',
    priceRange: data.get('priceRange') || '',
    availability: data.get('availability') || '',
    minRating: data.get('minRating') || '',
    services: data.getAll('services'),
  };
}
