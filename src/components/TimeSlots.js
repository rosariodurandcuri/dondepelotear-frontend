/**
 * SELECCIÓN DE HORARIOS — lista única de bloques disponibles.
 * Solo se muestran los horarios DISPONIBLES de la cancha para la fecha elegida
 * (los reservados, bloqueados o pasados no aparecen). Cada bloque es una opción:
 * tocar → seleccionado (verde con check); tocar de nuevo → se quita.
 * Sin límite: se pueden elegir tantos como haga falta, seguidos o no.
 */
import { html } from '../utils/dom.js';
import { icon } from './icons.js';
import { SLOT_STATUS } from '../config/constants.js';
import { groupConsecutiveSlots, totalHours } from '../utils/dates.js';
import { formatPrice } from '../utils/format.js';

export function TimeSlots(slots, selectedStartTimes = [], { pricePerHour = 0 } = {}) {
  if (!slots.length) {
    return html`<div class="empty-state" style="padding:24px"><h3>Cerrado este día</h3><p>La cancha no atiende en la fecha elegida. Prueba con otro día.</p></div>`;
  }
  const available = slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE);
  if (!available.length) {
    return html`<div class="empty-state" style="padding:28px">${icon('clock')}<h3>Sin horarios disponibles</h3><p>Todos los horarios de este día ya están ocupados. Elige otra fecha.</p></div>`;
  }

  const blocks = groupConsecutiveSlots(selectedStartTimes);
  const hours = totalHours(blocks);

  return html`
    <div class="agenda" data-slots>
      <div class="agenda-legend">
        <span><i class="agenda-dot agenda-dot-available"></i> Disponible: toca para elegir</span>
        <span><i class="agenda-dot agenda-dot-selected"></i> Seleccionado: toca para quitar</span>
      </div>

      <div class="agenda-grid">
        ${available.map((slot) => {
          const selected = selectedStartTimes.includes(slot.startTime);
          return html`
            <button type="button" class="agenda-slot ${selected ? 'is-selected' : ''}" data-slot="${slot.startTime}" aria-pressed="${selected}">
              <span class="agenda-slot-time">${slot.startTime} <em>–</em> ${slot.endTime}</span>
              <span class="agenda-slot-price">${selected ? 'Seleccionado' : formatPrice(pricePerHour)}</span>
            </button>`;
        })}
      </div>

      <div class="agenda-summary ${blocks.length ? '' : 'is-empty'}" data-selection-summary>
        ${blocks.length
          ? html`
            <div class="agenda-summary-blocks">
              <span class="agenda-summary-label">${icon('clock', 'icon icon-sm')} ${hours} ${hours === 1 ? 'hora' : 'horas'}:</span>
              ${blocks.map((b) => html`<span class="selected-block">${b.startTime} - ${b.endTime}</span>`)}
            </div>
            <div class="agenda-summary-total">
              <span class="text-muted text-small">${hours} × ${formatPrice(pricePerHour)}</span>
              <strong>Total ${formatPrice(hours * pricePerHour)}</strong>
              <button type="button" class="btn btn-ghost btn-sm" data-clear-slots>${icon('x', 'icon icon-sm')} Limpiar</button>
            </div>`
          : html`<span class="text-muted text-small">${icon('info', 'icon icon-sm')} Toca uno o más horarios (seguidos o no) para armar tu reserva.</span>`}
      </div>
    </div>`;
}

export function bindTimeSlots(root, onSelect, onClear = null) {
  root.querySelectorAll('[data-slot]').forEach((btn) =>
    btn.addEventListener('click', () => onSelect(btn.dataset.slot))
  );
  if (onClear) root.querySelector('[data-clear-slots]')?.addEventListener('click', onClear);
}
