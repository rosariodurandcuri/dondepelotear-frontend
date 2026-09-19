/**
 * ROUTER (navegación entre páginas)
 * ---------------------------------
 * Usa la parte "#/..." de la URL, por eso funciona en cualquier servidor
 * estático sin configuración. Ejemplos:
 *   #/                      → Inicio
 *   #/buscar?district=Lince → Resultados
 *   #/cancha/f1             → Detalle de la cancha f1
 *
 * Cada página es una función: Page(container, { params, query }).
 */
import { scrollTop } from './utils/dom.js';
import { APP_CONFIG } from './config/app.js';

/** Cambia el título de la pestaña: setPageTitle('Cancha El Campeón') → "Cancha El Campeón · DondePelotear" */
export function setPageTitle(text = '') {
  document.title = text ? `${text} · ${APP_CONFIG.name}` : `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`;
}

const routes = [];
let notFoundPage = null;
let beforeEach = null;

/** Registra una ruta. pattern puede tener parámetros: "/cancha/:id" */
export function addRoute(pattern, page, options = {}) {
  const keys = [];
  const regex = new RegExp(
    '^' + pattern.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^\\/]+)'; }) + '$'
  );
  routes.push({ pattern, regex, keys, page, options });
}

export function setNotFound(page) {
  notFoundPage = page;
}

/** Función que se ejecuta antes de cada navegación (control de acceso). Devuelve una ruta para redirigir o null. */
export function setGuard(fn) {
  beforeEach = fn;
}

/** Navega a una ruta: navigate('/cancha/f1') o navigate('/buscar', { district: 'Lince' }) */
export function navigate(path, query = null) {
  const qs = query ? buildQuery(query) : '';
  window.location.hash = `#${path}${qs}`;
}

export function buildQuery(params) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!clean.length) return '';
  return '?' + clean.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`).join('&');
}

/** Ruta actual: { path, query } */
export function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = hash.split('?');
  const query = {};
  new URLSearchParams(queryString).forEach((value, key) => { query[key] = value; });
  return { path: path || '/', query };
}

/** Enlace HTML hacia una ruta: href="#/buscar" */
export function href(path, query = null) {
  return `#${path}${query ? buildQuery(query) : ''}`;
}

async function resolve(container) {
  const { path, query } = currentRoute();
  const match = routes.find((r) => r.regex.test(path));

  if (!match) {
    if (notFoundPage) notFoundPage(container, { params: {}, query });
    return;
  }

  const values = path.match(match.regex).slice(1).map(decodeURIComponent);
  const params = Object.fromEntries(match.keys.map((k, i) => [k, values[i]]));

  if (beforeEach) {
    const redirect = beforeEach(match, { params, query, path });
    if (redirect) { navigate(redirect.path, redirect.query); return; }
  }

  scrollTop();
  setPageTitle(match.options.title || '');
  document.body.classList.remove('no-scroll'); // por si quedó abierta una hoja de filtros
  document.dispatchEvent(new CustomEvent('route:change', { detail: { path, params, query } }));
  await match.page(container, { params, query });
}

/** Inicia el router y dibuja la primera página */
export function startRouter(container) {
  window.addEventListener('hashchange', () => resolve(container));
  resolve(container);
}
