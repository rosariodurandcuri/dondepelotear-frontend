/**
 * SERVICIO DE DISPONIBILIDAD
 * --------------------------
 * Los horarios se calculan en la API a partir del horario semanal de la cancha
 * y de las excepciones guardadas (reservado / bloqueado). Ver server/src/lib/slots.ts.
 */
import { api } from './api.js';
import { SLOT_STATUS } from '../config/constants.js';
import { timeToMinutes } from '../utils/dates.js';

/**
 * Horarios de una cancha para una fecha.
 * Cada horario: { startTime, endTime, status, bookingId, reason }
 */
export async function getSlotsForDate(fieldId, date) {
  const { slots } = await api.get(`/fields/${fieldId}/slots`, { date });
  return slots;
}

/** Horarios de varios días seguidos: [{ date, slots }] */
export async function getCalendar(fieldId, from, days = 14) {
  return api.get(`/fields/${fieldId}/calendar`, { from, days });
}

/** Comprueba que TODOS los horarios entre start y end estén disponibles (comprobación previa; la definitiva la hace la API al reservar) */
export async function areSlotsAvailable(fieldId, date, startTime, endTime) {
  const slots = await getSlotsForDate(fieldId, date);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const needed = slots.filter((s) => timeToMinutes(s.startTime) >= start && timeToMinutes(s.startTime) < end);
  return needed.length === (end - start) / 60 && needed.every((s) => s.status === SLOT_STATUS.AVAILABLE);
}

/** El propietario bloquea un horario (ej. mantenimiento) */
export async function blockSlot(fieldId, date, startTime, reason = 'Bloqueado por el propietario') {
  return api.post(`/owner/fields/${fieldId}/blocks`, { date, startTime, reason });
}

/** El propietario libera un horario bloqueado */
export async function unblockSlot(fieldId, date, startTime) {
  return api.delete(`/owner/fields/${fieldId}/blocks`, { date, startTime });
}
