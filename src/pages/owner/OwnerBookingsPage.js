/**
 * RESERVAS DEL PROPIETARIO — todas las reservas de sus canchas, con filtros.
 */
import { html, render } from '../../utils/dom.js';
import { icon } from '../../components/icons.js';
import { OwnerLayout } from '../../components/OwnerLayout.js';
import { EmptyState } from '../../components/EmptyState.js';
import { showToast } from '../../components/Toast.js';
import { confirmDialog } from '../../components/Modal.js';
import { getCurrentUser } from '../../services/authService.js';
import { getBookingsForOwner, cancelBooking } from '../../services/bookingService.js';
import { getFieldsByOwner } from '../../services/fieldService.js';
import { BOOKING_STATUS } from '../../config/constants.js';
import { formatPrice, formatBookingSlots } from '../../utils/format.js';
import { formatDateShort, todayISO, isPastEnd } from '../../utils/dates.js';
import { navigate } from '../../router.js';
import { statusBadge } from '../BookingDetailPage.js';

export default async function OwnerBookingsPage(root, { query }) {
  const user = getCurrentUser();
  const fields = await getFieldsByOwner(user.id);
  const all = await getBookingsForOwner(user.id);
  const today = todayISO();
  const range = query.range || 'upcoming';
  const fieldId = query.field || '';

  let list = all.filter((b) => !fieldId || b.fieldId === fieldId);
  if (range === 'today') list = list.filter((b) => b.date === today && b.status !== BOOKING_STATUS.CANCELLED);
  if (range === 'upcoming') list = list.filter((b) => b.status === BOOKING_STATUS.CONFIRMED && !isPastEnd(b.date, b.endTime));
  if (range === 'past') list = list.filter((b) => b.displayStatus === BOOKING_STATUS.COMPLETED).reverse();
  if (range === 'cancelled') list = list.filter((b) => b.status === BOOKING_STATUS.CANCELLED);

  const total = list.filter((b) => b.status !== BOOKING_STATUS.CANCELLED).reduce((s, b) => s + b.totalPrice, 0);

  render(root, OwnerLayout(html`
    <div class="owner-header">
      <h1>Reservas</h1>
      <select class="form-control" style="max-width:260px" data-field-filter>
        <option value="">Todas las canchas</option>
        ${fields.map((f) => html`<option value="${f.id}" ${fieldId === f.id ? 'selected' : ''}>${f.name}</option>`)}
      </select>
    </div>

    <div class="tabs">
      ${[['today', 'Hoy'], ['upcoming', 'Próximas'], ['past', 'Pasadas'], ['cancelled', 'Canceladas'], ['all', 'Todas']].map(([id, label]) =>
        html`<a class="tab ${range === id ? 'active' : ''}" href="#/propietario/reservas?range=${id}${fieldId ? `&field=${fieldId}` : ''}">${label}</a>`)}
    </div>

    <p class="text-small text-muted mb-2">${list.length} ${list.length === 1 ? 'reserva' : 'reservas'} · Total: <strong>${formatPrice(total)}</strong></p>

    ${list.length
      ? html`<div class="card"><div class="table-wrap"><table class="table">
          <thead><tr><th>Fecha</th><th>Horario</th><th>Cancha</th><th>Cliente</th><th>Contacto</th><th>Monto</th><th>Estado</th><th>Código</th><th></th></tr></thead>
          <tbody>
            ${list.map((b) => html`
              <tr>
                <td>${formatDateShort(b.date)}</td>
                <td><strong>${formatBookingSlots(b, ", ")}</strong></td>
                <td>${b.field.name}</td>
                <td>${b.customer.firstName} ${b.customer.lastName}</td>
                <td><a href="https://wa.me/51${b.customer.phone.replace(/\D/g, '')}" target="_blank" rel="noopener" class="text-small" style="color:var(--green-700)">${icon('whatsapp', 'icon icon-sm')} ${b.customer.phone}</a></td>
                <td>${formatPrice(b.totalPrice)}</td>
                <td>${statusBadge(b.displayStatus)}</td>
                <td class="text-xs text-muted">${b.bookingCode}</td>
                <td>${b.status === BOOKING_STATUS.CONFIRMED && !isPastEnd(b.date, b.endTime) ? html`<button class="btn btn-ghost btn-sm" data-cancel="${b.id}">Cancelar</button>` : ''}</td>
              </tr>`)}
          </tbody>
        </table></div></div>`
      : EmptyState({ iconName: 'calendar', title: 'Sin reservas', message: 'No hay reservas en esta categoría.' })}
  `));

  root.querySelector('[data-field-filter]').addEventListener('change', (e) => navigate('/propietario/reservas', { range, field: e.target.value }));

  root.querySelectorAll('[data-cancel]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Cancelar reserva', message: 'El horario quedará disponible nuevamente. ¿Continuar?', confirmText: 'Sí, cancelar', danger: true });
      if (!ok) return;
      try {
        await cancelBooking(btn.dataset.cancel);
        showToast('Reserva cancelada', 'success');
        OwnerBookingsPage(root, { query });
      } catch (err) {
        showToast(err.message, 'error');
      }
    })
  );
}
