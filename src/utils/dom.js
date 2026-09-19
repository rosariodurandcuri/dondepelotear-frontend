/**
 * UTILIDADES DE DOM
 * -----------------
 * Pequeño sistema de plantillas seguro. Todo lo que se interpola dentro de
 * html`...` se escapa automáticamente (evita ataques XSS con datos de usuario).
 * Si necesitas insertar HTML ya generado por otro componente, no hace falta
 * nada: los resultados de html`` se reconocen y se insertan sin escapar.
 */

class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

/** Marca una cadena como HTML seguro (úsalo solo con HTML que tú controlas). */
export function raw(str) {
  return new SafeHtml(String(str));
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHtml(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escapeHtml(value);
}

/** Plantilla etiquetada: html`<p>${nombre}</p>` */
export function html(strings, ...values) {
  let out = '';
  strings.forEach((part, i) => {
    out += part;
    if (i < values.length) out += toHtml(values[i]);
  });
  return new SafeHtml(out);
}

/**
 * Convierte los <i data-lucide="..."> en SVG usando Lucide (si cargó desde el CDN).
 * Se llama automáticamente después de cada render(); llámalo a mano si insertas
 * HTML con innerHTML directamente.
 */
export function refreshIcons(scope = document) {
  if (window.lucide?.createIcons) window.lucide.createIcons({ root: scope });
}

/** Dibuja contenido dentro de un contenedor (reemplaza lo anterior). */
export function render(container, content) {
  container.innerHTML = toHtml(content);
  refreshIcons(container);
}

/** Crea un elemento DOM a partir de una plantilla. */
export function createElement(content) {
  const template = document.createElement('template');
  template.innerHTML = toHtml(content).trim();
  const element = template.content.firstElementChild;
  refreshIcons(element);
  return element;
}

/** Atajo para querySelector */
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Lee todos los campos de un <form> como objeto { name: value } */
export function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = typeof value === 'string' ? value.trim() : value; });
  return data;
}

/** Sube la página al inicio (útil al cambiar de ruta) */
export function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}
