/**
 * SERVICIO DE RESEÑAS
 * Solo un usuario con sesión iniciada puede calificar; una reseña por usuario y cancha
 * (si vuelve a calificar, la API actualiza la anterior).
 */
import { api } from './api.js';

const lastLoaded = new Map(); // fieldId → reseñas de la última carga (para getUserReview síncrono)

export async function addReview({ userId, fieldId, rating, comment = '' }) {
  if (!userId) throw new Error('Inicia sesión para calificar esta cancha.');
  const value = Number(rating);
  if (!(value >= 1 && value <= 5)) throw new Error('Elige una calificación de 1 a 5 estrellas.');
  const review = await api.post(`/fields/${fieldId}/reviews`, { rating: value, comment: String(comment).trim().slice(0, 500) });
  lastLoaded.set(fieldId, [review, ...(lastLoaded.get(fieldId) || []).filter((r) => r.id !== review.id)]);
  return review;
}

/** Reseña del usuario en esa cancha (de la última lista cargada con getReviewsForField) */
export function getUserReview(userId, fieldId, reviews = lastLoaded.get(fieldId) || []) {
  return userId ? reviews.find((r) => r.userId === userId) || null : null;
}

export async function getReviewsForField(fieldId) {
  const reviews = await api.get(`/fields/${fieldId}/reviews`);
  lastLoaded.set(fieldId, reviews);
  return reviews;
}
