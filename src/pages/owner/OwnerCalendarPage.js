/**
 * CALENDARIO DEL PROPIETARIO
 * --------------------------
 * Vista DÍA (lista grande, ideal para celular) y vista SEMANA (cuadrícula).
 * Estados: 🟢 Disponible · 🔵 Reservado · 🔴 Bloqueado · gris = ya pasó / cerrado.
 * Tocar un horario disponible lo bloquea; tocar uno bloqueado lo libera;
 * tocar uno reservado muestra los datos de la reserva.
 */
import { html, render, $ } from '../../utils/dom.js';
import { icon } from '../../components/icons.js';
import { OwnerLayout } from '../../components/OwnerLayout.js';
import { DateSelector, bindDateSelector } from '../../components/DateSelector.js';
import { EmptyState } from '../../components/EmptyState.js';
import { showToast } from '../../components/Toast.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { getCurrentUser } from '../../services/authService.js';
import { getFieldsByOwner } from '../../services/fieldService.js';
import { getSlotsForDate, blockSlot, unblockSlot } from '../../services/availabilityService.js';
import { getBookingById, getBookingsForOwner, cancelBooking } from '../../services/bookingService.js';
import { SLOT_STATUS } from '../../config/constants.js';
import { formatPrice, formatBookingSlots } from '../../utils/format.js';
import { todayISO, addDays, formatDateLong, formatDateShort, dayNumber, relativeDayLabel, timeToMinutes, minutesToTime } from '../../utils/dates.js';
import { navigate } from '../../router.js';

export default async function OwnerCalendarPage(root, { query }) {
  const user = getCurrentUser();
  const fields = await getFieldsByOwner(user.id);

  if (!fields.length) {
    render(root, OwnerLayout(EmptyState({ iconName: 'calendar', title: 'Primero publica una cancha', message: 'El calendario se activa cuando tienes al menos una cancha.', action: html`<a href="#/propietario/canchas/nueva" class="btn btn-primary">Publicar cancha</a>` })));
    return;
  }

  const state = {
    fieldId: fields.some((f) => f.id === query.field) ? query.field : fields[0].id,
    date: query.date || todayISO(),
    view: query.view || (window.innerWidth >= 900 ? 'week' : 'day'),
  };
  const field = () => fields.find((f) => f.id === state.fieldId);

  // ---- Estructura ----
  render(root, OwnerLayout(html`
    <div class="owner-header">
      <h1>Calendario</h1>
      <div class="view-toggle">
        <button data-view="day" class="${state.view === 'day' ? 'active' : ''}">Día</button>
        <button data-view="week" class="${state.view === 'week' ? 'active' : ''}">Semana</button>
      </div>
    </div>
    <div class="calendar-toolbar">
      <select class="form-control" style="max-width:320px" data-field-select>
        ${fields.map((f) => html`<option value="${f.id}" ${f.id === state.fieldId ? 'selected' : ''}>${f.name}</option>`)}
      </select>
      <button class="btn btn-outline btn-sm" data-today>Hoy</button>
    </div>
    <div class="calendar-legend">
      <span><i class="legend-dot available">${icon('check', 'icon icon-xs')}</i> Disponible (toca para bloquear)</span>
      <span><i class="legend-dot booked"></i> Reservado (toca para ver)</span>
      <span><i class="legend-dot blocked"></i> Bloqueado (toca para liberar)</span>
    </div>
    <div data-calendar-body class="mt-2"></div>
  `));

  $('[data-field-select]', root).addEventListener('change', (e) => { state.fieldId = e.target.value; drawBody(); });
  $('[data-today]', root).addEventListener('click', () => { state.date = todayISO(); drawBody(); });
  root.querySelectorAll('[data-view]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      root.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b === btn));
      drawBody();
    })
  );

  // ---- Acciones sobre un horario ----
  async function onSlotClick(date, slot) {
    if (slot.status === SLOT_STATUS.AVAILABLE) {
      try {
        await blockSlot(state.fieldId, date, slot.startTime);
        showToast(`Bloqueado ${slot.startTime} - ${slot.endTime}`);
      } catch (err) { showToast(err.message, 'error'); }
      drawBody();
    } else if (slot.status === SLOT_STATUS.BLOCKED) {
      await unblockSlot(state.fieldId, date, slot.startTime);
      showToast(`Liberado ${slot.startTime} - ${slot.endTime}`, 'success');
      drawBody();
    } else if (slot.status === SLOT_STATUS.BOOKED) {
      showBooking(slot.bookingId);
    }
  }

  async function showBooking(bookingId) {
    const booking = await getBookingById(bookingId).catch(() => null);
    if (!booking) { showToast('No se encontró la reserva', 'error'); return; }
    const modal = openModal({
      title: 'Reserva',
      content: html`
        <div class="summary-list">
          <div class="summary-item"><span>Cliente</span><span>${booking.customer.firstName} ${booking.customer.lastName}</span></div>
          <div class="summary-item"><span>Teléfono</span><span>${booking.customer.phone}</span></div>
          <div class="summary-item"><span>Correo</span><span>${booking.customer.email}</span></div>
          <div class="summary-item"><span>Fecha</span><span>${formatDateLong(booking.date)}</span></div>
          <div class="summary-item"><span>Horario</span><span>${formatBookingSlots(booking)}</span></div>
          <div class="summary-item"><span>Monto</span><span>${formatPrice(booking.totalPrice)} (${booking.paymentStatus === 'PAID' ? 'pagado' : 'pago pendiente'})</span></div>
          <div class="summary-item"><span>Código</span><span>${booking.bookingCode}</span></div>
        </div>`,
      actions: html`
        <a class="btn btn-outline" href="https://wa.me/51${booking.customer.phone.replace(/\D/g, '')}" target="_blank" rel="noopener">${icon('whatsapp', 'icon icon-sm')} WhatsApp</a>
        <button class="btn btn-danger" data-cancel-booking>Cancelar reserva</button>`,
    });
    modal.element.querySelector('[data-cancel-booking]').addEventListener('click', async () => {
      modal.close();
      const ok = await confirmDialog({ title: 'Cancelar reserva', message: 'El horario quedará disponible nuevamente. ¿Continuar?', confirmText: 'Sí, cancelar', danger: true });
      if (!ok) return;
      try {
        await cancelBooking(booking.id);
        showToast('Reserva cancelada', 'success');
        drawBody();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  // ---- Vista día ----
  async function drawDay(body) {
    const [slots, bookings] = await Promise.all([getSlotsForDate(state.fieldId, state.date), getBookingsForOwner(user.id, { fieldId: state.fieldId, date: state.date })]);
    const labels = { AVAILABLE: 'Disponible', BOOKED: 'Reservado', BLOCKED: 'Bloqueado', PAST: 'Ya pasó' };

    render(body, html`
      <div data-date-selector></div>
      <p class="text-small text-muted mt-1 mb-2"><strong style="color:var(--gray-900)">${formatDateLong(state.date)}</strong> · ${field().name}</p>
      ${slots.length
        ? html`<div class="day-slots">${slots.map((s) => {
            const booking = s.bookingId ? bookings.find((b) => b.id === s.bookingId) : null;
            const detail = booking ? `${booking.customer.firstName} ${booking.customer.lastName} · ${booking.customer.phone}` : s.reason || '';
            const action = { AVAILABLE: html`${icon('lock', 'icon icon-sm')} Bloquear`, BLOCKED: html`${icon('unlock', 'icon icon-sm')} Liberar`, BOOKED: html`${icon('eye', 'icon icon-sm')} Ver`, PAST: '' }[s.status];
            return html`
              <div class="day-slot ${s.status}">
                <i class="day-slot-status"></i>
                <span class="day-slot-time">${s.startTime} - ${s.endTime}</span>
                <div class="day-slot-info"><strong>${labels[s.status]}</strong>${detail ? html`<span>${detail}</span>` : ''}</div>
                ${action ? html`<button class="btn btn-outline btn-sm" data-slot="${s.startTime}">${action}</button>` : ''}
              </div>`;
          })}</div>`
        : html`<p class="text-muted">La cancha está cerrada este día. Puedes cambiar el horario en <a href="#/propietario/canchas/${state.fieldId}/editar" style="color:var(--green-700);font-weight:600">Editar cancha</a>.</p>`}
    `);

    const dateBox = $('[data-date-selector]', body);
    render(dateBox, DateSelector(state.date, { days: 21 }));
    bindDateSelector(dateBox, (date) => { state.date = date; drawBody(); });
    body.querySelectorAll('[data-slot]').forEach((btn) =>
      btn.addEventListener('click', () => onSlotClick(state.date, slots.find((s) => s.startTime === btn.dataset.slot)))
    );
  }

  // ---- Vista semana ----
  async function drawWeek(body) {
    // Muestra 7 días a partir de la fecha elegida (por defecto hoy), así no se pierden columnas en días pasados
    const first = state.date;
    const days = Array.from({ length: 7 }, (_, i) => addDays(first, i));
    const slotsByDay = {};
    await Promise.all(days.map(async (d) => { slotsByDay[d] = await getSlotsForDate(state.fieldId, d); }));
    const bookings = await getBookingsForOwner(user.id, { fieldId: state.fieldId });

    // Rango de horas de la semana (de la apertura más temprana al cierre más tardío)
    const all = days.flatMap((d) => slotsByDay[d]);
    if (!all.length) {
      render(body, html`<p class="text-muted">La cancha no tiene horarios configurados esta semana.</p>`);
      return;
    }
    const minStart = Math.min(...all.map((s) => timeToMinutes(s.startTime)));
    const maxStart = Math.max(...all.map((s) => timeToMinutes(s.startTime)));
    const hours = [];
    for (let m = minStart; m <= maxStart; m += 60) hours.push(minutesToTime(m));

    render(body, html`
      <div class="flex items-center justify-between mb-2 gap-1">
        <button class="btn btn-outline btn-icon" data-week="-1" aria-label="Semana anterior">${icon('chevronLeft')}</button>
        <strong>${formatDateShort(days[0])} — ${formatDateShort(days[6])}</strong>
        <button class="btn btn-outline btn-icon" data-week="1" aria-label="Semana siguiente">${icon('chevronRight')}</button>
      </div>
      <div class="week-grid-wrap">
        <div class="week-grid">
          <div class="week-head"></div>
          ${days.map((d) => html`<div class="week-head ${d === todayISO() ? 'today' : ''}">${relativeDayLabel(d).slice(0, 3)}<strong>${dayNumber(d)}</strong></div>`)}
          ${hours.map((h) => html`
            <div class="week-hour">${h}</div>
            ${days.map((d) => {
              const slot = slotsByDay[d].find((s) => s.startTime === h);
              if (!slot) return html`<div class="week-cell"><button class="CLOSED" disabled>—</button></div>`;
              const booking = slot.bookingId ? bookings.find((b) => b.id === slot.bookingId) : null;
              const label = { AVAILABLE: 'Libre', BOOKED: booking ? booking.customer.firstName : 'Reservado', BLOCKED: 'Bloq.', PAST: '' }[slot.status];
              return html`<div class="week-cell"><button class="${slot.status}" data-day="${d}" data-slot="${h}" ${slot.status === SLOT_STATUS.PAST ? 'disabled' : ''} title="${slot.startTime} - ${slot.endTime} · ${label}">${label}</button></div>`;
            })}`)}
        </div>
      </div>`);

    body.querySelectorAll('[data-week]').forEach((btn) =>
      btn.addEventListener('click', () => { state.date = addDays(first, Number(btn.dataset.week) * 7); drawBody(); })
    );
    body.querySelectorAll('[data-slot]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const d = btn.dataset.day;
        onSlotClick(d, slotsByDay[d].find((s) => s.startTime === btn.dataset.slot));
      })
    );
  }

  async function drawBody() {
    const body = $('[data-calendar-body]', root);
    // Mantiene la URL sincronizada (sin recargar) para poder compartir/volver
    history.replaceState(null, '', `#/propietario/calendario?field=${state.fieldId}&date=${state.date}&view=${state.view}`);
    if (state.view === 'day') await drawDay(body);
    else await drawWeek(body);
  }

  await drawBody();
}
