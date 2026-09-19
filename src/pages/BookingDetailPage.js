/**
 * DETALLE DE UNA RESERVA (por código) con opción de cancelar.
 */
import { html, render, $ } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { EmptyState } from '../components/EmptyState.js';
import { showToast } from '../components/Toast.js';
import { confirmDialog } from '../components/Modal.js';
import { getBookingByCode, cancelBooking } from '../services/bookingService.js';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS, fieldTypesLabel } from '../config/constants.js';
import { formatPrice, formatLocation, formatBookingSlots } from '../utils/format.js';
import { formatDateLong, isPastEnd } from '../utils/dates.js';
import { getPaymentMethod } from '../services/paymentService.js';
import { MapPreview, mountFieldMap } from '../components/MapPreview.js';

export function statusBadge(status) {
  const classes = { CONFIRMED: 'badge-green', PENDING: 'badge-amber', CANCELLED: 'badge-red', COMPLETED: 'badge-gray' };
  return html`<span class="badge ${classes[status] || 'badge-gray'}">${BOOKING_STATUS_LABELS[status] || status}</span>`;
}

export default async function BookingDetailPage(root, { params }) {
  const draw = async () => {
    const booking = await getBookingByCode(params.code);
    if (!booking) {
      render(root, html`<div class="container page">${EmptyState({ iconName: 'calendar', title: 'Reserva no encontrada', message: 'Revisa el código de reserva.', action: html`<a href="#/mis-reservas" class="btn btn-primary">Mis reservas</a>` })}</div>`);
      return;
    }
    const field = booking.field || { name: 'Cancha eliminada', address: '—', district: '', province: '', department: '', images: [], latitude: null, longitude: null };
    const canCancel = booking.status === BOOKING_STATUS.CONFIRMED && !isPastEnd(booking.date, booking.endTime);

    render(root, html`
      <div class="container page" style="max-width:760px">
        <a href="#/mis-reservas" class="btn btn-ghost btn-sm mb-2">${icon('arrowLeft', 'icon icon-sm')} Mis reservas</a>
        <div class="flex justify-between items-center flex-wrap gap-1 mb-2">
          <div>
            <h1 class="page-title" style="margin:0">Reserva ${booking.bookingCode}</h1>
            <p class="text-muted text-small">Creada el ${new Date(booking.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          ${statusBadge(booking.displayStatus)}
        </div>

        <div class="card mb-2">
          <div class="card-body">
            <h2 style="font-size:20px" class="mb-2">${field.name}</h2>
            <div class="detail-line">${icon('ball')} ${fieldTypesLabel(field)}</div>
            <div class="detail-line">${icon('calendar')} ${formatDateLong(booking.date)}</div>
            <div class="detail-line">${icon('clock')} ${formatBookingSlots(booking)}</div>
            <div class="detail-line">${icon('mapPin')} ${field.address}, ${formatLocation(field, { full: true })}</div>
            <div class="detail-line">${icon('money')} ${formatPrice(booking.totalPrice)} · ${getPaymentMethod(booking.paymentMethod).label} ${booking.paymentStatus === 'PAID' ? '(pagado)' : '(pago pendiente)'}</div>
            <div class="detail-line">${icon('user')} ${booking.customer.firstName} ${booking.customer.lastName} · ${booking.customer.phone} · ${booking.customer.email}</div>
          </div>
        </div>

        ${booking.field ? MapPreview(field) : ''}

        <div class="flex gap-1 flex-wrap mt-3">
          ${booking.field ? html`<a href="#/cancha/${field.id}" class="btn btn-outline">Ver cancha</a>` : ''}
          ${canCancel ? html`<button class="btn btn-danger" data-cancel>Cancelar reserva</button>` : ''}
        </div>
      </div>`);

    if (booking.field) mountFieldMap(root, field);

    $('[data-cancel]', root)?.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Cancelar reserva', message: `¿Seguro que quieres cancelar la reserva del ${formatDateLong(booking.date)} a las ${booking.startTime}? El horario quedará libre para otros jugadores.`, confirmText: 'Sí, cancelar', danger: true });
      if (!ok) return;
      try {
        await cancelBooking(booking.id, booking.bookingCode);
        showToast('Reserva cancelada', 'success');
        draw();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };
  await draw();
}
