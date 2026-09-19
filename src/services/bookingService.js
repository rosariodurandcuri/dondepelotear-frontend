/**
 * SERVICIO DE RESERVAS
 * --------------------
 * Crea, consulta y cancela reservas a través de la API (/bookings, /owner, /admin).
 * La API marca los horarios como reservados dentro de una transacción, así que
 * la doble reserva es imposible aunque dos personas reserven a la vez.
 */
import { api, ApiError } from './api.js';
import { BOOKING_STATUS } from '../config/constants.js';
import { isPastEnd } from '../utils/dates.js';

const GUEST_KEY = 'dondepelotear:guestBookings'; // códigos de reservas hechas sin cuenta en este navegador

/** Estado a mostrar: una reserva confirmada cuya hora ya pasó se muestra como Completada */
export function getDisplayStatus(booking) {
  if (booking.status === BOOKING_STATUS.CONFIRMED && isPastEnd(booking.date, booking.endTime)) return BOOKING_STATUS.COMPLETED;
  return booking.status;
}

function getGuestCodes() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; }
}

function rememberGuestBooking(code) {
  localStorage.setItem(GUEST_KEY, JSON.stringify([...new Set([...getGuestCodes(), code])]));
}

/**
 * Crea una reserva. Acepta:
 *  - slots: ['10:00', '14:00']  (horas de inicio, pueden NO ser consecutivas), o
 *  - startTime / endTime         (un solo bloque)
 * Si no hay sesión, el código se guarda en este navegador para verla en "Mis reservas".
 */
export async function createBooking({ fieldId, date, startTime, endTime, slots = null, customer, userId = null, paymentMethod = 'yape' }) {
  const booking = await api.post('/bookings', {
    fieldId,
    date,
    ...(slots?.length ? { slots } : { startTime, endTime }),
    customer: {
      firstName: (customer?.firstName || '').trim(),
      lastName: (customer?.lastName || '').trim(),
      phone: (customer?.phone || '').trim(),
      email: (customer?.email || '').trim().toLowerCase(),
    },
    paymentMethod,
  });
  if (!userId) rememberGuestBooking(booking.bookingCode);
  return booking;
}

export async function getBookingByCode(code) {
  try {
    return await api.get(`/bookings/code/${encodeURIComponent(code)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Detalle por id (jugador dueño, propietario de la cancha o admin) */
export async function getBookingById(id) {
  return api.get(`/bookings/${id}`);
}

/** Reservas del jugador: las de su cuenta/correo (API) + las hechas como invitado en este navegador */
export async function getBookingsForPlayer(user) {
  const guestCodes = getGuestCodes();
  const [mine, guest] = await Promise.all([
    user ? api.get('/bookings/me') : Promise.resolve([]),
    guestCodes.length ? api.post('/bookings/lookup', { codes: guestCodes }) : Promise.resolve([]),
  ]);
  const seen = new Set();
  return [...mine, ...guest]
    .filter((b) => !seen.has(b.id) && seen.add(b.id))
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
}

/** Reservas de todas las canchas del propietario con sesión */
export async function getBookingsForOwner(ownerId, { fieldId, date } = {}) {
  return api.get('/owner/bookings', { fieldId, date });
}

/** Estadísticas para el dashboard del propietario */
export async function getOwnerStats() {
  return api.get('/owner/stats');
}

/**
 * Cancela una reserva. Puede hacerlo el jugador dueño (por cuenta o correo), el
 * propietario de la cancha, el admin, o un invitado enviando el código de la reserva.
 */
export async function cancelBooking(bookingId, bookingCode = null) {
  return api.post(`/bookings/${bookingId}/cancel`, bookingCode ? { bookingCode } : {});
}

/** Para el administrador */
export async function adminGetAllBookings() {
  return api.get('/admin/bookings');
}
