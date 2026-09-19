/**
 * SELECTOR DE FECHA — tira horizontal con los próximos días.
 * Ejemplo: [Hoy 13] [Mañana 14] [Lunes 15] ...
 */
import { html } from '../utils/dom.js';
import { getNextDays, dayNumber, relativeDayLabel, parseISODate } from '../utils/dates.js';
import { APP_CONFIG } from '../config/app.js';

export function DateSelector(selectedDate, { days = APP_CONFIG.daysAheadForBooking, from } = {}) {
  return html`
    <div class="date-strip" data-date-strip>
      ${getNextDays(days, from).map((iso) => html`
        <button type="button" class="date-chip ${iso === selectedDate ? 'selected' : ''}" data-date="${iso}">
          <span>${relativeDayLabel(iso).slice(0, 3)}</span>
          <strong>${dayNumber(iso)}</strong>
          <em>${parseISODate(iso).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}</em>
        </button>`)}
    </div>`;
}

/** Llama a onSelect(dateISO) cuando el usuario toca un día */
export function bindDateSelector(root, onSelect) {
  root.querySelectorAll('[data-date]').forEach((btn) =>
    btn.addEventListener('click', () => onSelect(btn.dataset.date))
  );
  // Centra el día seleccionado dentro de la tira (solo desplaza la tira, no la página)
  const strip = root.querySelector('[data-date-strip]');
  const chip = strip?.querySelector('.date-chip.selected');
  if (strip && chip) strip.scrollLeft = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2;
}
