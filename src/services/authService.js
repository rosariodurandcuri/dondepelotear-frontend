/**
 * SERVICIO DE AUTENTICACIÓN
 * -------------------------
 * Habla con /auth de la API. La sesión es un token JWT que se guarda en el
 * navegador junto con una copia del usuario, así `getCurrentUser()` sigue
 * siendo síncrono (la cabecera, el router y las páginas lo usan directamente).
 * Al arrancar, `restoreSession()` valida el token contra la API.
 */
import { api, getToken, setToken } from './api.js';
import { ROLES } from '../config/constants.js';
import { syncFavoritesFromServer } from './favoriteService.js';

const USER_KEY = 'dondepelotear:user';
const listeners = new Set();
let currentUser = readStoredUser();

function readStoredUser() {
  try { return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null; } catch { return null; }
}

function setSession({ token, user }) {
  setToken(token);
  currentUser = user;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  listeners.forEach((fn) => fn(currentUser));
  if (user) syncFavoritesFromServer().catch(() => {});
  return user;
}

/** Usuario con la sesión iniciada (o null) */
export function getCurrentUser() {
  return currentUser;
}

export function isOwner(user = getCurrentUser()) {
  return user?.role === ROLES.OWNER || user?.role === ROLES.ADMIN;
}

export function isAdmin(user = getCurrentUser()) {
  return user?.role === ROLES.ADMIN;
}

/** Suscribirse a cambios de sesión (la cabecera lo usa para redibujarse) */
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Al abrir la app: comprueba que el token siga siendo válido y refresca los datos del usuario */
export async function restoreSession() {
  if (!getToken()) return null;
  try {
    return setSession({ token: getToken(), user: await api.get('/auth/me') });
  } catch (err) {
    if (err.status === 401) setSession({ token: null, user: null }); // token vencido o inválido
    return currentUser; // sin conexión: se mantiene la copia local
  }
}

export async function login({ email, password }) {
  if (!password) throw new Error('Ingresa tu contraseña.');
  return setSession(await api.post('/auth/login', { email: String(email).trim(), password }));
}

/** "juan.perez@correo.com" → "Juan Perez" (nombre inicial cuando el registro no pide nombre) */
function nameFromEmail(email = '') {
  const local = String(email).split('@')[0].replace(/[._\-+]+/g, ' ').replace(/\d+/g, '').trim();
  const pretty = local.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return pretty.length >= 3 ? pretty : 'Jugador';
}

export async function register({ name, email, password, phone, role = ROLES.PLAYER }) {
  if (!name || !name.trim()) name = nameFromEmail(email);
  return setSession(await api.post('/auth/register', {
    name: (name || '').trim(),
    email: (email || '').trim(),
    password: password || '',
    phone: (phone || '').trim(),
    role: role === ROLES.OWNER ? 'owner' : 'player', // nadie puede registrarse como admin
  }));
}

/** Actualiza nombre, teléfono y WhatsApp del usuario con sesión */
export async function updateProfile({ name, phone, whatsapp }) {
  if (!currentUser) throw new Error('Inicia sesión para editar tu perfil.');
  const user = await api.patch('/auth/me', {
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(whatsapp !== undefined ? { whatsapp } : {}),
  });
  return setSession({ token: getToken(), user });
}

export async function changePassword({ currentPassword, newPassword }) {
  return api.patch('/auth/me/password', { currentPassword, newPassword });
}

/**
 * Inicio de sesión / registro con Google o Facebook (SIMULADO en la API).
 * En producción el proveedor devuelve un id_token que la API verifica.
 */
export const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
];

export async function loginWithProvider(providerId, { role = ROLES.PLAYER } = {}) {
  if (!SOCIAL_PROVIDERS.some((p) => p.id === providerId)) throw new Error('Proveedor no disponible.');
  return setSession(await api.post('/auth/provider', { provider: providerId, role: role === ROLES.OWNER ? 'owner' : 'player' }));
}

export async function logout() {
  setSession({ token: null, user: null });
}

/** Para el panel de administración */
export async function adminGetAllUsers() {
  return api.get('/admin/users');
}
