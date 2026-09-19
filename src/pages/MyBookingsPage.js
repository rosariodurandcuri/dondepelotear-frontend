/**
 * MIS RESERVAS (jugador) — próximas, pasadas y canceladas.
 */
import { html, render } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { EmptyState } from '../components/EmptyState.js';
import { getBookingsForPlayer } from '../services/bookingService.js';
import { getCurrentUser } from '../services/authService.js';
import { BOOKING_STATUS } from '../config/constants.js';
import { formatPrice, formatLocation, formatBookingSlots } from '../utils/format.js';
import { formatDateShort, isPastEnd } from '../utils/dates.js';
import { PLACEHOLDER_IMAGE } from '../utils/images.js';
import { statusBadge } from './BookingDetailPage.js';

export default async function MyBookingsPage(root, { query }) {
  const user = getCurrentUser();
  const all = await getBookingsForPlayer(user);
  const tab = query.tab || 'upcoming';

  const groups = {
    upcoming: all.filter((b) => b.status === BOOKING_STATUS.CONFIRMED && !isPastEnd(b.date, b.endTime)).reverse(),
    past: all.filter((b) => b.displayStatus === BOOKING_STATUS.COMPLETED),
    cancelled: all.filter((b) => b.status === BOOKING_STATUS.CANCELLED),
    all,
  };
  const list = groups[tab] || groups.upcoming;

  render(root, html`
    <div class="container page" style="max-width:860px">
      <h1 class="page-title">Mis reservas</h1>
      <p class="page-subtitle">${user ? `Hola ${user.name.split(' ')[0]}, aquí están tus reservas.` : 'Reservas realizadas desde este navegador. Inicia sesión para verlas desde cualquier dispositivo.'}</p>

      <div class="tabs">
        <a class="tab ${tab === 'upcoming' ? 'active' : ''}" href="#/mis-reservas?tab=upcoming">Próximas (${groups.upcoming.length})</a>
        <a class="tab ${tab === 'past' ? 'active' : ''}" href="#/mis-reservas?tab=past">Pasadas (${groups.past.length})</a>
        <a class="tab ${tab === 'cancelled' ? 'active' : ''}" href="#/mis-reservas?tab=cancelled">Canceladas (${groups.cancelled.length})</a>
        <a class="tab ${tab === 'all' ? 'active' : ''}" href="#/mis-reservas?tab=all">Todas</a>
      </div>

      ${list.length
        ? html`<div class="booking-list">${list.map(BookingItem)}</div>`
        : EmptyState({
            iconName: 'calendar',
            title: all.length ? 'Nada por aquí' : 'Aún no tienes reservas',
            message: all.length ? 'No hay reservas en esta categoría.' : 'Busca una cancha y reserva tu primer partido.',
            action: html`<a href="#/buscar" class="btn btn-primary">Buscar canchas</a>${!user ? html` <a href="#/login" class="btn btn-outline">Iniciar sesión</a>` : ''}`,
          })}
    </div>`);
}

function BookingItem(b) {
  return html`
    <a class="card booking-item" href="#/reservas/${b.bookingCode}">
      <img src="${b.field?.images?.[0] || PLACEHOLDER_IMAGE}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
      <div class="booking-item-info">
        <h3>${b.field?.name || 'Cancha'}</h3>
        <div class="booking-item-meta">
          <span>${icon('calendar', 'icon icon-sm')} ${formatDateShort(b.date)}</span>
          <span>${icon('clock', 'icon icon-sm')} ${formatBookingSlots(b)}</span>
          <span>${icon('mapPin', 'icon icon-sm')} ${b.field ? formatLocation(b.field) : ''}</span>
        </div>
      </div>
      <div class="booking-item-right">
        ${statusBadge(b.displayStatus)}
        <strong>${formatPrice(b.totalPrice)}</strong>
        <span class="booking-item-code">${b.bookingCode}</span>
      </div>
    </a>`;
}
