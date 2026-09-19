/**
 * CLIENTE HTTP DE LA API
 * ----------------------
 * Todas las llamadas al backend (carpeta server/) pasan por aquí.
 *  - Agrega el token de sesión en la cabecera Authorization.
 *  - Convierte las respuestas de error ({ error: "mensaje" }) en excepciones con
 *    ese mensaje, para que las páginas lo muestren tal cual.
 */
import { APP_CONFIG } from '../config/app.js';

const TOKEN_KEY = 'chapatucancha:token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Error de la API: trae el código HTTP (401, 404, 409...) además del mensaje */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Convierte { q: 'Lima', services: ['a','b'], strictDate: true, x: '' } en "?q=Lima&services=a,b&strictDate=true" */
function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    if (Array.isArray(value)) { if (value.length) search.set(key, value.join(',')); return; }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request(method, path, { body, params } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${APP_CONFIG.apiUrl}${path}${toQuery(params)}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que la API esté encendida (cd server && bun run dev).');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error || `Error ${response.status} al comunicarse con el servidor.`);
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path, body) => request('DELETE', path, { body }),
};
