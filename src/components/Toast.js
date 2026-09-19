/**
 * NOTIFICACIONES EMERGENTES (toast)
 * Uso: showToast('Reserva confirmada', 'success')
 */
import { createElement, html } from '../utils/dom.js';
import { icon } from './icons.js';

export function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toast-container');
  const icons = { success: 'checkCircle', error: 'x', info: 'info' };
  const toast = createElement(html`<div class="toast toast-${type}">${icon(icons[type] || 'info')}<span>${message}</span></div>`);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms';
    setTimeout(() => toast.remove(), 220);
  }, duration);
}
