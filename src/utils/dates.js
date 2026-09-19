/**
 * UTILIDADES DE FECHAS Y HORAS
 * ----------------------------
 * Convención en toda la app:
 *  - Fechas: texto ISO local "YYYY-MM-DD" (ej. "2026-09-20")
 *  - Horas:  texto "HH:MM" en formato 24h (ej. "20:00")
 * Así los datos son fáciles de guardar en cualquier base de datos.
 */
import { WEEKDAYS } from '../config/constants.js';

const LOCALE = 'es-PE';

/** Convierte un objeto Date a "YYYY-MM-DD" usando la hora local */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convierte "YYYY-MM-DD" a Date (medianoche local) */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Lista de los próximos N días a partir de una fecha (incluida) */
export function getNextDays(count, fromISO = todayISO()) {
  return Array.from({ length: count }, (_, i) => addDays(fromISO, i));
}

/** Clave del día de la semana: 'mon', 'tue', ... (para el horario de la cancha) */
export function weekdayKey(iso) {
  const jsDay = parseISODate(iso).getDay(); // 0 = domingo
  return WEEKDAYS[(jsDay + 6) % 7].key;
}

/** Fecha del lunes de la semana a la que pertenece la fecha */
export function startOfWeek(iso) {
  const jsDay = parseISODate(iso).getDay();
  return addDays(iso, -((jsDay + 6) % 7));
}

// ---------- Formateo en español ----------

/** "sábado 20 de septiembre de 2026" */
export function formatDateLong(iso) {
  return parseISODate(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** "20 de septiembre de 2026" */
export function formatDateMedium(iso) {
  return parseISODate(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "sáb 20 sep" */
export function formatDateShort(iso) {
  return parseISODate(iso).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

/** "Sábado" */
export function formatWeekday(iso) {
  const name = parseISODate(iso).toLocaleDateString(LOCALE, { weekday: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function dayNumber(iso) {
  return parseISODate(iso).getDate();
}

/** "Hoy", "Mañana" o el nombre del día */
export function relativeDayLabel(iso) {
  const today = todayISO();
  if (iso === today) return 'Hoy';
  if (iso === addDays(today, 1)) return 'Mañana';
  return formatWeekday(iso);
}

// ---------- Horas ----------

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutes(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/** Minutos transcurridos del día actual */
export function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** true si el horario (fecha + hora de inicio) ya comenzó */
export function isPastSlot(iso, startTime) {
  const today = todayISO();
  if (iso < today) return true;
  if (iso > today) return false;
  return timeToMinutes(startTime) <= nowMinutes();
}

/** true si la fecha + hora de fin ya pasó */
export function isPastEnd(iso, endTime) {
  const today = todayISO();
  if (iso < today) return true;
  if (iso > today) return false;
  return timeToMinutes(endTime) <= nowMinutes();
}

/** Hora actual redondeada hacia arriba a la siguiente hora en punto ("HH:00") */
export function nextFullHour() {
  const minutes = nowMinutes();
  return minutesToTime(Math.ceil(minutes / 60) * 60);
}

/** Fecha por defecto para buscar: hoy, o mañana si ya es muy tarde para reservar hoy */
export function defaultSearchDate(cutoffHour = 21) {
  return nowMinutes() >= cutoffHour * 60 ? addDays(todayISO(), 1) : todayISO();
}

/** "20:00 - 21:00" */
export function formatRange(start, end) {
  return `${start} - ${end}`;
}

/** Duración en horas entre dos horas ("20:00","22:00") → 2 */
export function hoursBetween(start, end) {
  return (timeToMinutes(end) - timeToMinutes(start)) / 60;
}

/**
 * Agrupa horas de inicio (ej. ['10:00','11:00','14:00']) en bloques consecutivos:
 * → [{ startTime: '10:00', endTime: '12:00' }, { startTime: '14:00', endTime: '15:00' }]
 */
export function groupConsecutiveSlots(startTimes, slotMinutes = 60) {
  const sorted = [...new Set(startTimes)].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  const blocks = [];
  sorted.forEach((start) => {
    const last = blocks[blocks.length - 1];
    if (last && timeToMinutes(last.endTime) === timeToMinutes(start)) last.endTime = addMinutes(start, slotMinutes);
    else blocks.push({ startTime: start, endTime: addMinutes(start, slotMinutes) });
  });
  return blocks;
}

/** Total de horas de una lista de bloques */
export function totalHours(blocks) {
  return blocks.reduce((sum, b) => sum + hoursBetween(b.startTime, b.endTime), 0);
}
