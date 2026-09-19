/**
 * SERVICIO DE CANCHAS
 * -------------------
 * Búsqueda con filtros, detalle, y creación/edición por parte del propietario.
 * Toda la lógica (filtros, calificación, disponibilidad, distancia) vive en la
 * API; aquí solo se arman las llamadas y se limpian los datos del formulario.
 */
import { api, ApiError } from './api.js';
import { FIELD_STATUS } from '../config/constants.js';

export async function getFieldById(id, { date } = {}) {
  try {
    return await api.get(`/fields/${id}`, { date });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getFeaturedFields(limit = 4) {
  return api.get('/fields/featured', { limit });
}

/**
 * Búsqueda principal (a nivel nacional).
 * filters = { department, province, district, q, date, type, time, priceRange, availability,
 *             minRating, services: [], sort, strictDate, lat, lng }
 * Devuelve { results, location, freeText } (la API interpreta el texto libre como lugar).
 */
export async function searchFields(filters = {}) {
  return api.get('/fields', filters);
}

// ---------------------------------------------------------------- Propietario

export async function getFieldsByOwner() {
  return api.get('/owner/fields');
}

/** Solo se envían los campos editables, con números como números (evita mandar rating, disponibilidad, etc.) */
function toPayload(data) {
  const EDITABLE = ['name', 'description', 'types', 'whatsapp', 'address', 'reference', 'department', 'province', 'district', 'images', 'services', 'schedule', 'status'];
  const payload = Object.fromEntries(EDITABLE.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
  if (data.type && !payload.types) payload.types = [data.type];
  if (data.pricePerHour !== undefined) payload.pricePerHour = Number(data.pricePerHour);
  if (data.latitude !== undefined) payload.latitude = Number(data.latitude) || null;
  if (data.longitude !== undefined) payload.longitude = Number(data.longitude) || null;
  if (payload.schedule) {
    payload.schedule = Object.fromEntries(Object.entries(payload.schedule).map(([day, s]) => [day, { open: s.open, close: s.close, closed: Boolean(s.closed) }]));
  }
  return payload;
}

export async function createField(ownerId, data) {
  return api.post('/owner/fields', { ...toPayload(data), status: data.status || FIELD_STATUS.PUBLISHED });
}

export async function updateField(fieldId, ownerId, data) {
  return api.patch(`/owner/fields/${fieldId}`, toPayload(data));
}

/** Eliminar una cancha (la API lo impide si tiene reservas futuras confirmadas) */
export async function deleteField(fieldId) {
  await api.delete(`/owner/fields/${fieldId}`);
  return true;
}

/** Publicar / ocultar una cancha */
export async function setFieldStatus(fieldId, ownerId, status) {
  return api.patch(`/owner/fields/${fieldId}/status`, { status });
}

// ---------------------------------------------------------------- Administrador

export async function adminGetAllFields() {
  return api.get('/admin/fields');
}

export async function adminSetApproval(fieldId, approvalStatus) {
  return api.patch(`/admin/fields/${fieldId}/approval`, { approvalStatus });
}

export async function adminSetStatus(fieldId, status) {
  return api.patch(`/admin/fields/${fieldId}/status`, { status });
}
