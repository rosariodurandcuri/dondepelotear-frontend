/**
 * PANTALLA DE ÉXITO tras confirmar la reserva.
 */
import { html, render } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { EmptyState } from '../components/EmptyState.js';
import { getBookingByCode } from '../services/bookingService.js';
import { fieldTypesLabel } from '../config/constants.js';
import { formatPrice, formatLocation, formatBookingSlots, whatsappLink, whatsappBookingMessage } from '../utils/format.js';
import { getFieldById } from '../services/fieldService.js';
import { formatDateMedium } from '../utils/dates.js';
import { getPaymentMethod } from '../services/paymentService.js';

export default async function ConfirmationPage(root, { params }) {
  const booking = await getBookingByCode(params.code);
  if (!booking) {
    render(root, html`<div class="container page">${EmptyState({ iconName: 'calendar', title: 'Reserva no encontrada', message: 'Revisa el código de reserva.', action: html`<a href="#/" class="btn btn-primary">Volver al inicio</a>` })}</div>`);
    return;
  }
  const { field } = booking;
  // Número de WhatsApp del encargado (la cancha o su propietario)
  const enriched = await getFieldById(field.id).catch(() => null);
  const waLink = whatsappLink(enriched?.contactWhatsApp || field.whatsapp, whatsappBookingMessage(booking, field));

  render(root, html`
    <div class="container">
      <div class="confirmation fade-in">
        <div class="confirmation-icon">${icon('check')}</div>
        <h1>¡Reserva confirmada!</h1>
        <p class="text-muted mt-1">Te esperamos en la cancha. Guarda tu código de reserva.</p>

        <div class="card">
          <div class="card-body">
            <h2 style="font-size:20px" class="mb-2">${field.name}</h2>
            <div class="detail-line">${icon('ball')} ${fieldTypesLabel(field)}</div>
            <div class="detail-line">${icon('calendar')} ${formatDateMedium(booking.date)}</div>
            <div class="detail-line">${icon('clock')} ${formatBookingSlots(booking)}</div>
            <div class="detail-line">${icon('mapPin')} ${field.address}, ${formatLocation(field)}</div>
            <div class="detail-line">${icon('money')} ${formatPrice(booking.totalPrice)} · ${booking.paymentMethod === 'onsite' ? 'Pago en la cancha' : `${getPaymentMethod(booking.paymentMethod).label} ${booking.paymentStatus === 'PAID' ? '(pagado)' : '(pago pendiente)'}`}</div>
            <div class="detail-line">${icon('user')} ${[booking.customer.firstName, booking.customer.lastName].filter(Boolean).join(' ')} · ${booking.customer.phone}</div>

            <div class="booking-code">
              <span>Código de reserva</span>
              <strong>${booking.bookingCode}</strong>
            </div>
          </div>
        </div>

        ${waLink ? html`
          <a class="btn btn-whatsapp btn-lg btn-block mt-3" href="${waLink}" target="_blank" rel="noopener">${icon('whatsapp')} Avisar al encargado por WhatsApp</a>
          <p class="text-xs text-muted mt-1">Se abre WhatsApp con un mensaje listo con los datos de tu reserva para que la cancha te confirme.</p>` : ''}

        <div class="confirmation-actions">
          <a href="#/reservas/${booking.bookingCode}" class="btn btn-outline btn-lg">Ver reserva</a>
          <a href="#/" class="btn btn-primary btn-lg">Volver al inicio</a>
        </div>
      </div>
    </div>`);
}
