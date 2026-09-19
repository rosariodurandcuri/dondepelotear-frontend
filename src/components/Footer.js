/**
 * PIE DE PÁGINA
 */
import { html, render } from '../utils/dom.js';
import { Logo } from './Logo.js';
import { APP_CONFIG } from '../config/app.js';
import { getCurrentUser, isOwner, onAuthChange } from '../services/authService.js';

export function renderFooter(container) {
  const draw = () => {
  const user = getCurrentUser();
  const ownerLinks = !user || isOwner(user);
  render(container, html`
    <div class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            ${Logo()}
            <p class="mt-2 text-small" style="max-width:360px">
              La forma más fácil de encontrar y reservar canchas de fútbol 7 y fútbol 11 en Perú.
            </p>
          </div>
          <div>
            <h4>Jugadores</h4>
            <a href="#/buscar">Buscar canchas</a>
            <a href="#/mis-reservas">Mis reservas</a>
            <a href="#/registro">Crear cuenta</a>
          </div>
          ${ownerLinks ? html`
          <div>
            <h4>Propietarios</h4>
            <a href="#/propietarios">Publica tu cancha</a>
            ${isOwner(user) ? html`<a href="#/propietario">Panel de propietario</a><a href="#/propietario/calendario">Calendario</a>` : ''}
          </div>` : ''}
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${APP_CONFIG.name} · Lima, Perú</span>
          <span>Reservas de canchas de fútbol en todo el Perú</span>
        </div>
      </div>
    </div>`);
  };
  draw();
  onAuthChange(draw);
}
