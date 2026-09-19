/**
 * CONSTANTES DEL DOMINIO
 * ----------------------
 * Tipos de cancha, servicios, estados y rangos usados en toda la aplicación.
 * Si agregas un servicio nuevo aquí, aparecerá automáticamente en filtros,
 * formulario del propietario y página de detalle.
 */

export const ROLES = { PLAYER: 'player', OWNER: 'owner', ADMIN: 'admin' };

export const FIELD_TYPES = [
  { id: 'F5', label: 'Fútbol 5', short: 'F5', players: '5 vs 5' },
  { id: 'F6', label: 'Fútbol 6', short: 'F6', players: '6 vs 6' },
  { id: 'F7', label: 'Fútbol 7', short: 'F7', players: '7 vs 7' },
  { id: 'F8', label: 'Fútbol 8', short: 'F8', players: '8 vs 8' },
  { id: 'F9', label: 'Fútbol 9', short: 'F9', players: '9 vs 9' },
  { id: 'F11', label: 'Fútbol 11', short: 'F11', players: '11 vs 11' },
];

export function fieldTypeLabel(id) {
  return FIELD_TYPES.find((t) => t.id === id)?.label || id;
}

/** Tipos de una cancha (una sede puede tener varios): siempre devuelve un arreglo */
export function fieldTypes(field) {
  return field?.types?.length ? field.types : field?.type ? [field.type] : [];
}

/** Versión corta para espacios reducidos: "Fútbol 7" · "Fútbol 5 · 7 · 11" */
export function fieldTypesCompact(field) {
  const types = fieldTypes(field);
  if (types.length <= 1) return fieldTypesLabel(field);
  return `Fútbol ${types.map((t) => t.replace('F', '')).join(' · ')}`;
}

/** "Fútbol 7 · Fútbol 11" */
export function fieldTypesLabel(field, separator = ' · ') {
  return fieldTypes(field).map(fieldTypeLabel).join(separator);
}

/** Servicios/comodidades que puede ofrecer una cancha */
export const SERVICES = [
  { id: 'lighting', label: 'Iluminación', icon: 'light' },
  { id: 'parking', label: 'Estacionamiento', icon: 'car' },
  { id: 'lockers', label: 'Vestuarios', icon: 'shirt' },
  { id: 'showers', label: 'Duchas', icon: 'shower' },
  { id: 'restrooms', label: 'Baños', icon: 'toilet' },
  { id: 'stands', label: 'Gradas', icon: 'stands' },
  { id: 'cafeteria', label: 'Cafetería', icon: 'coffee' },
];

/** Estados de un horario (entidad AVAILABILITY) */
export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE', // Se puede reservar
  BOOKED: 'BOOKED',       // Reservado por un jugador
  BLOCKED: 'BLOCKED',     // Bloqueado por el propietario
  PAST: 'PAST',           // Ya pasó (solo para mostrar, no se guarda)
  CLOSED: 'CLOSED',       // Fuera del horario de atención (solo para mostrar)
};

/** Estados de una reserva (entidad BOOKINGS) */
export const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

export const BOOKING_STATUS_LABELS = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

/** Estados de publicación de una cancha */
export const FIELD_STATUS = {
  DRAFT: 'DRAFT',         // Guardada pero no visible
  PUBLISHED: 'PUBLISHED', // Visible en búsquedas
  HIDDEN: 'HIDDEN',       // Oculta por el propietario o el administrador
};

/** Estado de aprobación (para el futuro panel de administración) */
export const APPROVAL_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' };

/** Rangos de precio para el filtro de búsqueda (en moneda local) */
export const PRICE_RANGES = [
  { id: 'lt80', label: 'Menos de S/ 80', min: 0, max: 79.99 },
  { id: '80-120', label: 'S/ 80 - S/ 120', min: 80, max: 120 },
  { id: '120-180', label: 'S/ 120 - S/ 180', min: 120.01, max: 180 },
  { id: 'gt180', label: 'Más de S/ 180', min: 180.01, max: Infinity },
];

export const AVAILABILITY_FILTERS = [
  { id: 'now', label: 'Disponible ahora' },
  { id: 'today', label: 'Disponible hoy' },
  { id: 'week', label: 'Disponible esta semana' },
];

/** Calificación mínima para el filtro */
export const RATING_FILTERS = [
  { id: '4.5', label: '4.5 o más', min: 4.5 },
  { id: '4', label: '4.0 o más', min: 4 },
  { id: '3', label: '3.0 o más', min: 3 },
];

export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recomendadas' },
  { id: 'price_asc', label: 'Precio menor' },
  { id: 'price_desc', label: 'Precio mayor' },
  { id: 'rating', label: 'Mejor calificación' },
  { id: 'distance', label: 'Más cercanas' },
];

/** Días de la semana (clave interna + etiqueta en español) */
export const WEEKDAYS = [
  { key: 'mon', label: 'Lunes', short: 'Lun' },
  { key: 'tue', label: 'Martes', short: 'Mar' },
  { key: 'wed', label: 'Miércoles', short: 'Mié' },
  { key: 'thu', label: 'Jueves', short: 'Jue' },
  { key: 'fri', label: 'Viernes', short: 'Vie' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
];

/** Horas del día en formato "HH:00" (06:00 a 24:00) para selectores */
export const HOURS = Array.from({ length: 19 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
