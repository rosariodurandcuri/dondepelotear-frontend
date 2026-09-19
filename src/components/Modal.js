/**
 * VENTANA MODAL
 * Uso: const modal = openModal({ title, content, actions }); modal.close();
 * "content" y "actions" son plantillas html``. Los botones dentro se pueden
 * enlazar con modal.element.querySelector(...).
 */
import { createElement, html } from '../utils/dom.js';
import { icon } from './icons.js';

export function openModal({ title, content, actions = null }) {
  const container = document.getElementById('modal-container');
  const backdrop = createElement(html`
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-title">
          <span>${title}</span>
          <button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">${icon('x')}</button>
        </div>
        <div class="modal-content">${content}</div>
        ${actions ? html`<div class="modal-actions">${actions}</div>` : ''}
      </div>
    </div>`);

  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop || e.target.closest('[data-close]')) close(); });
  container.appendChild(backdrop);
  return { element: backdrop, close };
}

/** Diálogo de confirmación sencillo. Devuelve una promesa con true/false */
export function confirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const modal = openModal({
      title,
      content: html`<p class="text-muted">${message}</p>`,
      actions: html`
        <button class="btn btn-outline" data-cancel>${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${confirmText}</button>`,
    });
    modal.element.querySelector('[data-cancel]').addEventListener('click', () => { modal.close(); resolve(false); });
    modal.element.querySelector('[data-ok]').addEventListener('click', () => { modal.close(); resolve(true); });
  });
}
