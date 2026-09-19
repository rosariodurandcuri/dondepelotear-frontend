import { html, render } from '../utils/dom.js';
import { EmptyState } from '../components/EmptyState.js';

export default function NotFoundPage(root) {
  render(root, html`<div class="container page">${EmptyState({ iconName: 'ball', title: 'Página no encontrada', message: 'La dirección no existe o fue movida.', action: html`<a href="#/" class="btn btn-primary">Volver al inicio</a>` })}</div>`);
}
