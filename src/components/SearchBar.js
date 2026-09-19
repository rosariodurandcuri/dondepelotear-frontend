/**
 * BUSCADOR PRINCIPAL — ubicación (texto + departamento/provincia/distrito), fecha, tipo y hora.
 * Se usa en el inicio y en la página de resultados.
 *
 * El campo "¿Dónde quieres jugar?" acepta texto libre ("Lima", "San Miguel", "Trujillo")
 * y muestra sugerencias; al elegir una, los selectores se completan solos (y viceversa).
 */
import { html, render, $ } from '../utils/dom.js';
import { icon } from './icons.js';
import { LocationPicker, bindLocationPicker, setLocationPicker, readLocationPicker } from './LocationPicker.js';
import { DateField, bindDateFields } from './DatePicker.js';
import { FIELD_TYPES, HOURS } from '../config/constants.js';
import { searchLocations, locationLabel, findLocation } from '../config/locations.js';
import { todayISO, addDays, defaultSearchDate } from '../utils/dates.js';
import { APP_CONFIG } from '../config/app.js';
import { navigate } from '../router.js';

/**
 * options.simple = true → versión del inicio: solo "¿Dónde quieres jugar?" y "¿Cuándo?"
 * options.compact = true → versión de la página de resultados (todos los campos)
 */
export function SearchBar(values = {}, { compact = false, simple = false } = {}) {
  const today = todayISO();
  const text = values.q || locationLabel(values);
  const locationField = html`
    <div class="form-group search-location">
      <label class="form-label" for="search-q">¿Dónde quieres jugar?</label>
      <div class="input-icon">
        ${icon('mapPin')}
        <input class="form-control" id="search-q" name="q" placeholder="Ciudad, distrito o departamento" value="${text}" />
        <ul class="suggestions" data-suggestions hidden></ul>
      </div>
    </div>`;
  const dateField = html`
    <div class="form-group">
      <label class="form-label" for="search-date">¿Cuándo?</label>
      ${DateField({ id: 'search-date', name: 'date', value: values.date || defaultSearchDate(), min: today, max: addDays(today, APP_CONFIG.daysAheadForBooking) })}
    </div>`;

  if (simple) {
    return html`
      <form class="search-box search-box-simple ${compact ? 'search-box-compact' : ''}" data-search-form autocomplete="off">
        <div class="search-row search-row-simple">
          ${locationField}
          ${dateField}
          <div class="form-group search-submit">
            <button type="submit" class="btn btn-primary btn-lg">${icon('search')} Buscar canchas</button>
          </div>
        </div>
      </form>`;
  }

  return html`
    <form class="search-box ${compact ? 'search-box-compact' : ''}" data-search-form autocomplete="off">
      <div class="search-row search-row-location">
        ${locationField}
        ${LocationPicker(values, { prefix: 'search' })}
      </div>
      <div class="search-row search-row-when">
        ${dateField}
        <div class="form-group">
          <label class="form-label" for="search-type">Tipo de cancha</label>
          <select class="form-control" id="search-type" name="type">
            <option value="">Todas</option>
            ${FIELD_TYPES.map((t) => html`<option value="${t.id}" ${values.type === t.id ? 'selected' : ''}>${t.label}</option>`)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="search-time">Horario</label>
          <select class="form-control" id="search-time" name="time">
            <option value="">Cualquier hora</option>
            ${HOURS.slice(0, -1).map((h) => html`<option value="${h}" ${values.time === h ? 'selected' : ''}>${h}</option>`)}
          </select>
        </div>
        <div class="form-group search-submit">
          <button type="submit" class="btn btn-primary btn-lg">${icon('search')} Buscar canchas</button>
        </div>
      </div>
    </form>`;
}

/** Conecta el formulario: sugerencias, sincronización texto ↔ selects y envío */
export function bindSearchBar(root, extraQuery = {}) {
  const form = root.querySelector('[data-search-form]');
  if (!form) return;
  const input = $('#search-q', form);
  const list = $('[data-suggestions]', form);
  bindDateFields(form);

  const hideSuggestions = () => { list.hidden = true; };
  const showSuggestions = () => {
    const items = searchLocations(input.value);
    if (!items.length) { hideSuggestions(); return; }
    render(list, items.map((s) => html`<li><button type="button" data-suggest='${JSON.stringify({ department: s.department, province: s.province || '', district: s.district || '' })}'>${icon('mapPin', 'icon icon-sm')}<span><strong>${s.name}</strong><small>${s.detail}</small></span></button></li>`));
    list.hidden = false;
    list.querySelectorAll('[data-suggest]').forEach((btn) =>
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // evita que el input pierda el foco antes del clic
        const loc = JSON.parse(btn.dataset.suggest);
        input.value = locationLabel(loc);
        setLocationPicker(form, loc);
        hideSuggestions();
      })
    );
  };

  input.addEventListener('input', showSuggestions);
  input.addEventListener('focus', () => { if (input.value) showSuggestions(); });
  input.addEventListener('blur', () => setTimeout(hideSuggestions, 120));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSuggestions(); });

  // Cuando el usuario elige en los selects, el texto se actualiza
  bindLocationPicker(form, (loc) => { input.value = locationLabel(loc); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let location = readLocationPicker(form);
    let q = (data.q || '').trim();

    // Si escribió un lugar reconocido y no eligió en los selects, lo interpretamos
    if (!location.department && q) {
      const found = findLocation(q);
      if (found) { location = { department: found.department, province: found.province || '', district: found.district || '' }; q = ''; }
    }
    // Si el texto coincide con la selección, no hace falta enviarlo
    if (q && q === locationLabel(location)) q = '';

    navigate('/buscar', { ...extraQuery, ...location, q, date: data.date, type: data.type, time: data.time });
  });
}
