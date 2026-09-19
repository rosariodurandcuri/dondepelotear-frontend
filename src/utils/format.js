/**
 * UTILIDADES DE FORMATO (moneda, teléfono, texto)
 */
import { getCountry } from '../config/app.js';

/** 100 → "S/ 100"   |  95.5 → "S/ 95.50"   |  null → "Consultar" (precio no publicado) */
export function formatPrice(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Consultar';
  const { currencySymbol } = getCountry();
  const number = Number(amount) || 0;
  const text = Number.isInteger(number) ? String(number) : number.toFixed(2);
  return `${currencySymbol} ${text}`;
}

/** true si la cancha publica precio y se puede reservar en línea */
export function hasPrice(field) {
  return field?.pricePerHour !== null && field?.pricePerHour !== undefined && Number(field.pricePerHour) > 0;
}

/** Precio por hora de una cancha: "S/ 120", "S/ 120 – 400" (rango) o "Consultar precio" */
export function formatFieldPrice(field) {
  if (!hasPrice(field)) return 'Consultar precio';
  if (field.priceMax && Number(field.priceMax) > Number(field.pricePerHour)) return `${formatPrice(field.pricePerHour)} – ${Number(field.priceMax)}`;
  return formatPrice(field.pricePerHour);
}

/** "934 617 095" → enlace tel: con solo dígitos (agrega +51 a celulares de 9 dígitos) */
export function phoneLink(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  return `tel:${digits.length === 9 ? `${getCountry().phoneCode}${digits}` : digits}`;
}

/** 4.75 → "4.8" */
export function formatRating(rating) {
  return rating ? Number(rating).toFixed(1) : 'Nuevo';
}

/** "San Miguel, Lima" · "Cayma, Arequipa" · "Trujillo, La Libertad" */
export function formatLocation({ district, province, department } = {}, { full = false } = {}) {
  if (full) return [district, province !== district ? province : null, department !== province ? department : null].filter(Boolean).join(', ');
  const second = province && province !== district ? province : department;
  return [district, second].filter(Boolean).join(', ');
}

/**
 * Horarios de una reserva en texto: "20:00 - 21:00" o "10:00 - 11:00 · 14:00 - 15:00"
 * (las reservas pueden tener varios bloques no consecutivos en booking.slots).
 */
export function formatBookingSlots(booking, separator = ' · ') {
  const slots = booking.slots?.length ? booking.slots : [{ startTime: booking.startTime, endTime: booking.endTime }];
  return slots.map((s) => `${s.startTime} - ${s.endTime}`).join(separator);
}

/** Trunca un texto largo para tarjetas */
export function truncate(text = '', max = 80) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Genera un id único sencillo (en producción lo genera la base de datos) */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Valida correos de forma básica */
export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida teléfonos peruanos (9 dígitos) o internacionales sencillos */
export function isValidPhone(phone = '') {
  return /^\+?\d[\d\s-]{7,14}$/.test(phone.trim());
}

/** Deja solo dígitos y agrega el código de Perú si es un celular de 9 dígitos: "987 654 321" → "51987654321" */
export function normalizeWhatsApp(number = '') {
  const digits = String(number).replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 9 ? `${getCountry().phoneCode.replace('+', '')}${digits}` : digits;
}

/** Enlace para abrir WhatsApp con un mensaje ya escrito */
export function whatsappLink(number, message = '') {
  const digits = normalizeWhatsApp(number);
  if (!digits) return '';
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** Mensaje automático para consultar por una cancha */
export function whatsappMessage(fieldName) {
  return `Hola, estoy interesado en alquilar la cancha ${fieldName}. Quisiera consultar sobre disponibilidad y precios.`;
}

/** Distancia aproximada en km entre dos coordenadas (fórmula de Haversine) */
export function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
