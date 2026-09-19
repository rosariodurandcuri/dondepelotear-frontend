/**
 * PÁGINA DE RESERVA — resumen + datos del jugador + método de pago (simulado).
 * Llega con: #/reservar/:fieldId?date=2026-09-20&start=20:00&end=21:00
 */
import { html, render, $, formToObject } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { Stepper } from '../components/Stepper.js';
import { EmptyState } from '../components/EmptyState.js';
import { showToast } from '../components/Toast.js';
import { getFieldById } from '../services/fieldService.js';
import { areSlotsAvailable } from '../services/availabilityService.js';
import { createBooking } from '../services/bookingService.js';
import { getCurrentUser } from '../services/authService.js';
import { fieldTypesLabel } from '../config/constants.js';
import { formatPrice, hasPrice, formatLocation } from '../utils/format.js';
import { formatDateLong, groupConsecutiveSlots, totalHours } from '../utils/dates.js';
import { APP_CONFIG } from '../config/app.js';
import { PLACEHOLDER_IMAGE } from '../utils/images.js';
import { navigate, href } from '../router.js';

export default async function BookingPage(root, { params, query }) {
  const field = await getFieldById(params.fieldId);
  const { date } = query;
  // Horarios elegidos: ?slots=10:00,14:00 (nuevo) o ?start=&end= (formato anterior)
  const startTimes = query.slots ? query.slots.split(',').filter(Boolean) : [];
  const blocks = startTimes.length
    ? groupConsecutiveSlots(startTimes, APP_CONFIG.slotDurationMinutes)
    : query.start && query.end ? [{ startTime: query.start, endTime: query.end }] : [];

  if (field && !hasPrice(field)) {
    render(root, html`<div class="container page">${EmptyState({ iconName: 'info', title: 'Esta cancha no publica su precio', message: 'Por ahora no se puede reservar en línea. Contacta al local por WhatsApp o teléfono desde su página.', action: html`<a href="#/cancha/${field.id}" class="btn btn-primary">Ver contacto de la cancha</a>` })}</div>`);
    return;
  }
  if (!field || !date || !blocks.length) {
    render(root, html`<div class="container page">${EmptyState({ iconName: 'calendar', title: 'Falta información de la reserva', message: 'Vuelve a la cancha y selecciona fecha y horario.', action: html`<a href="#/buscar" class="btn btn-primary">Buscar canchas</a>` })}</div>`);
    return;
  }

  // Verificación previa: si alguien reservó mientras el usuario miraba, avisamos
  let stillAvailable = true;
  for (const b of blocks) if (!(await areSlotsAvailable(field.id, date, b.startTime, b.endTime))) stillAvailable = false;
  if (!stillAvailable) {
    render(root, html`<div class="container page">${EmptyState({ iconName: 'clock', title: 'Ese horario ya no está disponible', message: 'Otra persona lo reservó hace un momento. Elige otro horario.', action: html`<a href="${href(`/cancha/${field.id}`, { date })}" class="btn btn-primary">Ver horarios disponibles</a>` })}</div>`);
    return;
  }

  const user = getCurrentUser();
  const hours = totalHours(blocks);
  const total = hours * field.pricePerHour;
  const slotsLabel = blocks.map((b) => `${b.startTime} - ${b.endTime}`).join(' · ');
  const fullName = user?.name || '';

  render(root, html`
    <div class="container booking-page">
      <a href="${href(`/cancha/${field.id}`, { date })}" class="btn btn-ghost btn-sm mb-2">${icon('arrowLeft', 'icon icon-sm')} Cambiar horario</a>
      ${Stepper(['Fecha', 'Horario', 'Tus datos', 'Confirmación'], 2)}

      <div class="booking-layout">
        <div class="card">
          <div class="card-body">
            <h1 class="card-title" style="font-size:22px">Completa tus datos</h1>
            <p class="text-muted text-small mb-3">Solo necesitamos tu nombre y un número de contacto. El pago se coordina directamente en la cancha.</p>

            <form data-booking-form novalidate>
              <div data-form-error></div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="fullName">Nombre</label>
                  <div class="input-icon">
                    ${icon('user')}
                    <input class="form-control" id="fullName" name="fullName" placeholder="Ej. Juan Pérez" value="${fullName}" required autocomplete="name" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="phone">Teléfono / WhatsApp</label>
                  <div class="input-icon">
                    ${icon('phone')}
                    <input class="form-control" id="phone" name="phone" type="tel" inputmode="numeric" placeholder="987 654 321" value="${user?.phone || ''}" required autocomplete="tel" />
                  </div>
                </div>
              </div>

              <div class="booking-pay-note">
                ${icon('money', 'icon')}
                <div>
                  <strong>Pago en la cancha</strong>
                  <span>Pagas al llegar, directamente al encargado. Sin cobros por adelantado.</span>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg btn-block mt-3" data-submit>Confirmar reserva</button>
              <p class="text-xs text-muted text-center mt-1">Al confirmar aceptas las condiciones de uso y la política de cancelación de la cancha.</p>
            </form>
          </div>
        </div>

        <aside class="card booking-summary-card">
          <div class="booking-summary-hero">
            <img src="${field.images?.[0] || PLACEHOLDER_IMAGE}" alt="${field.name}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
            <div class="booking-summary-hero-text">
              <span class="badge badge-dark">${fieldTypesLabel(field)}</span>
              <strong>${field.name}</strong>
              <span>${icon('mapPin', 'icon icon-xs')} ${formatLocation(field)}</span>
            </div>
          </div>
          <div class="card-body">
            <h2 class="booking-summary-title">Tu reserva</h2>
            <div class="booking-summary-rows">
              <div class="booking-summary-row">
                <span class="booking-summary-icon">${icon('calendar', 'icon icon-sm')}</span>
                <div><span>Fecha</span><strong>${formatDateLong(date)}</strong></div>
              </div>
              <div class="booking-summary-row">
                <span class="booking-summary-icon">${icon('clock', 'icon icon-sm')}</span>
                <div><span>${blocks.length > 1 ? 'Horarios' : 'Horario'}</span><strong>${blocks.map((b) => html`<em class="selected-block">${b.startTime} – ${b.endTime}</em>`)}</strong></div>
              </div>
              <div class="booking-summary-row">
                <span class="booking-summary-icon">${icon('ball', 'icon icon-sm')}</span>
                <div><span>Duración</span><strong>${hours} ${hours === 1 ? 'hora' : 'horas'} · ${formatPrice(field.pricePerHour)} por hora</strong></div>
              </div>
            </div>
            <div class="booking-summary-total">
              <div><span>Total a pagar</span><small>en la cancha, al llegar</small></div>
              <strong>${formatPrice(total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>`);

  // ---- Envío del formulario ----
  const form = $('[data-booking-form]', root);
  const errorBox = $('[data-form-error]', root);
  const submitBtn = $('[data-submit]', root);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formToObject(form);
    errorBox.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Procesando reserva…';

    try {
      const booking = await createBooking({
        fieldId: field.id,
        date,
        slots: blocks.flatMap((b) => { const out = []; for (let t = b.startTime; t < b.endTime; t = `${String(Number(t.slice(0, 2)) + 1).padStart(2, '0')}:00`) out.push(t); return out; }),
        customer: { firstName: data.fullName.split(' ')[0], lastName: data.fullName.split(' ').slice(1).join(' '), phone: data.phone, email: user?.email || '' },
        userId: user?.id || null,
        paymentMethod: 'onsite', // el pago se realiza en la cancha
      });
      showToast('¡Reserva confirmada!', 'success');
      navigate(`/reserva-confirmada/${booking.bookingCode}`);
    } catch (err) {
      render(errorBox, html`<div class="form-error">${err.message}</div>`);
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar reserva';
    }
  });
}
