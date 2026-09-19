/**
 * "¿TIENES UNA CANCHA?" — página informativa para propietarios con llamada a la acción.
 */
import { html, render } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getCurrentUser, isOwner, logout } from '../services/authService.js';
import { navigate } from '../router.js';
import { showToast } from '../components/Toast.js';

export default function OwnerLandingPage(root, { query = {} } = {}) {
  const user = getCurrentUser();
  const playerLoggedIn = Boolean(user) && !isOwner(user);
  const cta = isOwner(user)
    ? html`<a href="#/propietario/canchas/nueva" class="btn btn-lg">Publicar una cancha ${icon('arrowRight')}</a>`
    : playerLoggedIn
      ? html`<button type="button" class="btn btn-lg" data-switch-owner>Crear cuenta de propietario ${icon('arrowRight')}</button>`
      : html`<a href="#/registro?role=owner" class="btn btn-lg">Crear cuenta de propietario ${icon('arrowRight')}</a>`;

  render(root, html`
    <div class="container page">
      ${playerLoggedIn ? html`
        <div class="form-error" style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          ${icon('lock', 'icon icon-sm')}
          <span><strong>Publicar canchas es solo para cuentas de propietario.</strong> Tu cuenta (${user.email}) es de jugador${query.soloPropietarios ? ', por eso no puedes entrar al panel de propietario' : ''}. Si tienes una cancha, crea una cuenta de propietario con otro correo.</span>
        </div>` : ''}
      <div class="owner-cta mb-3">
        <div>
          <h2 style="font-size:32px">Llena tu cancha, sin llamadas</h2>
          <p style="font-size:17px">Publica tu cancha de fútbol 7 o fútbol 11 y recibe reservas en línea. Tú controlas precios, horarios y bloqueos desde el celular.</p>
        </div>
        ${cta}
      </div>

      <div class="steps-grid">
        <div class="card step-card"><span class="step-icon">${icon('image')}</span><h3>1. Publica</h3><p class="text-muted">Sube fotos, dirección, tipo de cancha, precio y servicios en un formulario paso a paso.</p></div>
        <div class="card step-card"><span class="step-icon">${icon('calendar')}</span><h3>2. Configura horarios</h3><p class="text-muted">Define a qué hora abres y cierras cada día. Bloquea horarios cuando lo necesites.</p></div>
        <div class="card step-card"><span class="step-icon">${icon('trending')}</span><h3>3. Recibe reservas</h3><p class="text-muted">Los jugadores reservan solos. Tú ves todo en tu panel: reservas de hoy, próximas e ingresos.</p></div>
      </div>

      <div class="card mt-4">
        <div class="card-body">
          <h2 class="card-title">Preguntas frecuentes</h2>
          <div class="detail-line"><strong>¿Cuánto cuesta publicar?</strong></div>
          <p class="text-muted text-small mb-2">Publicar es gratis en esta etapa. Más adelante se aplicará una pequeña comisión por reserva confirmada.</p>
          <div class="detail-line"><strong>¿Cómo recibo el pago?</strong></div>
          <p class="text-muted text-small mb-2">Los jugadores pagan al reservar (Yape, Plin, tarjeta) o directamente en tu cancha, según el método que elijan.</p>
          <div class="detail-line"><strong>¿Puedo tener varias canchas?</strong></div>
          <p class="text-muted text-small">Sí. Cada cancha tiene su propio calendario, precio y horarios.</p>
        </div>
      </div>
      ${!isOwner(user) ? html`<p class="text-center mt-3 text-muted">¿Ya tienes cuenta de propietario? <a href="#/login?role=owner&next=/propietario" class="fw-600" style="color:var(--green-700)">Inicia sesión</a></p>` : ''}
    </div>`);

  // Jugador con sesión: cerrar sesión y pasar al registro de propietario
  root.querySelector('[data-switch-owner]')?.addEventListener('click', async () => {
    await logout();
    showToast('Sesión cerrada. Crea tu cuenta de propietario.');
    navigate('/registro', { role: 'owner' });
  });
}
