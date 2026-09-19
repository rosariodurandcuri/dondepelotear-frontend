/**
 * FAVORITOS (canchas guardadas por el jugador)
 * Se guardan en este navegador para responder al instante; si hay sesión,
 * también se sincronizan con la API (/favorites) para verlos en otros dispositivos.
 */
import { api, getToken } from './api.js';

const KEY = 'dondepelotear:favorites';

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function isFavorite(fieldId) {
  return getFavorites().includes(fieldId);
}

/** Alterna el favorito y devuelve true si quedó marcado */
export function toggleFavorite(fieldId) {
  const list = getFavorites();
  const active = !list.includes(fieldId);
  localStorage.setItem(KEY, JSON.stringify(active ? [...list, fieldId] : list.filter((id) => id !== fieldId)));
  if (getToken()) (active ? api.put(`/favorites/${fieldId}`) : api.delete(`/favorites/${fieldId}`)).catch(() => {});
  return active;
}

/** Al iniciar sesión: une los favoritos del servidor con los de este navegador */
export async function syncFavoritesFromServer() {
  if (!getToken()) return;
  const { fieldIds } = await api.get('/favorites');
  const local = getFavorites();
  const merged = [...new Set([...fieldIds, ...local])];
  localStorage.setItem(KEY, JSON.stringify(merged));
  await Promise.all(local.filter((id) => !fieldIds.includes(id)).map((id) => api.put(`/favorites/${id}`).catch(() => {})));
}
