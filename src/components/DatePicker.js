/**
 * SELECTOR DE FECHA — calendario propio (reemplaza al <input type="date"> nativo).
 * -------------------------------------------------------------------------------
 * Uso:
 *   ${DateField({ id: 'search-date', name: 'date', value, min, max })}
 *   bindDateFields(root)   → abre el calendario al tocar el campo
 * El valor real viaja en un <input type="hidden" name="..."> con formato YYYY-MM-DD,
 * así los formularios existentes no cambian.
 */
import { html, render, $ } from '../utils/dom.js';
import { icon } from './icons.js';
import { todayISO, addDays, parseISODate, toISODate, formatDateShort, relativeDayLabel } from '../utils/dates.js';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function displayLabel(iso) {
  if (!iso) return 'Elige una fecha';
  const rel = relativeDayLabel(iso);
  const short = formatDateShort(iso); // "mié 16 set"
  return rel === 'Hoy' || rel === 'Mañana' ? `${rel}, ${short.replace(/^\S+\s/, '')}` : short.charAt(0).toUpperCase() + short.slice(1);
}

export function DateField({ id = 'date', name = 'date', value = '', min = todayISO(), max = addDays(todayISO(), 60), placeholder = 'Elige una fecha' } = {}) {
  return html`
    <div class="date-picker" data-date-picker data-min="${min}" data-max="${max}">
      <input type="hidden" name="${name}" value="${value}" data-date-value />
      <button type="button" class="form-control date-picker-field" id="${id}" data-date-toggle aria-haspopup="dialog" aria-expanded="false">
        ${icon('calendar', 'icon date-picker-icon')}
        <span class="date-picker-label ${value ? '' : 'is-placeholder'}" data-date-label>${value ? displayLabel(value) : placeholder}</span>
        ${icon('chevronDown', 'icon icon-sm date-picker-chevron')}
      </button>
      <div class="date-picker-popover" data-date-popover hidden role="dialog" aria-label="Calendario"></div>
    </div>`;
}

function monthGrid(viewYear, viewMonth, { value, min, max }) {
  const first = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const today = todayISO();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(html`<span class="dp-day is-empty"></span>`);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = toISODate(new Date(viewYear, viewMonth, d));
    const disabled = iso < min || iso > max;
    const cls = ['dp-day', iso === value ? 'is-selected' : '', iso === today ? 'is-today' : '', disabled ? 'is-disabled' : ''].join(' ');
    cells.push(html`<button type="button" class="${cls}" data-day="${iso}" ${disabled ? 'disabled' : ''} aria-label="${iso}">${d}</button>`);
  }
  const prevDisabled = toISODate(new Date(viewYear, viewMonth, 0)) < min;
  const nextDisabled = toISODate(new Date(viewYear, viewMonth + 1, 1)) > max;
  return html`
    <div class="dp-head">
      <button type="button" class="dp-nav" data-dp-prev ${prevDisabled ? 'disabled' : ''} aria-label="Mes anterior">${icon('chevronLeft')}</button>
      <strong>${MONTHS[viewMonth]} ${viewYear}</strong>
      <button type="button" class="dp-nav" data-dp-next ${nextDisabled ? 'disabled' : ''} aria-label="Mes siguiente">${icon('chevronRight')}</button>
    </div>
    <div class="dp-weekdays">${WEEKDAYS.map((w) => html`<span>${w}</span>`)}</div>
    <div class="dp-grid">${cells}</div>
    <div class="dp-footer">
      <button type="button" class="btn btn-ghost btn-sm" data-dp-quick="${today}">Hoy</button>
      <button type="button" class="btn btn-ghost btn-sm" data-dp-quick="${addDays(today, 1)}">Mañana</button>
      <button type="button" class="btn btn-ghost btn-sm" data-dp-close style="margin-left:auto">Cerrar</button>
    </div>`;
}

export function bindDateFields(root, onChange = null) {
  root.querySelectorAll('[data-date-picker]').forEach((picker) => {
    const input = $('[data-date-value]', picker);
    const toggle = $('[data-date-toggle]', picker);
    const label = $('[data-date-label]', picker);
    const popover = $('[data-date-popover]', picker);
    const min = picker.dataset.min;
    const max = picker.dataset.max;
    let view = parseISODate(input.value || todayISO());

    const setValue = (iso) => {
      input.value = iso;
      label.textContent = displayLabel(iso);
      label.classList.remove('is-placeholder');
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (onChange) onChange(iso, picker);
    };
    const close = () => { popover.hidden = true; toggle.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
    const onDocClick = (e) => { if (!picker.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };

    const draw = () => {
      render(popover, monthGrid(view.getFullYear(), view.getMonth(), { value: input.value, min, max }));
      $('[data-dp-prev]', popover)?.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); draw(); });
      $('[data-dp-next]', popover)?.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); draw(); });
      popover.querySelectorAll('[data-day]:not([disabled])').forEach((b) => b.addEventListener('click', () => { setValue(b.dataset.day); close(); }));
      popover.querySelectorAll('[data-dp-quick]').forEach((b) => b.addEventListener('click', () => { const iso = b.dataset.dpQuick; if (iso >= min && iso <= max) { setValue(iso); close(); } }));
      $('[data-dp-close]', popover)?.addEventListener('click', close);
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!popover.hidden) { close(); return; }
      view = parseISODate(input.value || todayISO());
      draw();
      popover.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      setTimeout(() => { document.addEventListener('click', onDocClick); document.addEventListener('keydown', onKey); }, 0);
    });
  });
}
