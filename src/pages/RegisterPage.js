/**
 * REGISTRO — jugador o propietario.
 */
import { html, render, $, formToObject } from '../utils/dom.js';
import { register } from '../services/authService.js';
import { showToast } from '../components/Toast.js';
import { navigate } from '../router.js';
import { ROLES } from '../config/constants.js';
import { SocialLogin, bindSocialLogin } from '../components/SocialLogin.js';

export default function RegisterPage(root, { query }) {
  // "Crear cuenta de propietario" (#/registro?role=owner) crea la cuenta directamente
  // con el rol Propietario, sin preguntar qué quiere hacer el usuario.
  const ownerMode = query.role === 'owner';
  const defaultRole = ownerMode ? ROLES.OWNER : ROLES.PLAYER;
  const afterRegister = (user) => navigate(user.role === ROLES.OWNER ? '/propietario' : query.next || '/');

  render(root, html`
    <div class="container">
      <div class="auth-page">
        <div class="card">
          <div class="card-body">
            <h1>${ownerMode ? 'Crear cuenta de propietario' : 'Crear cuenta'}</h1>
            <p class="text-muted mb-3">${ownerMode ? 'Publica tu cancha y administra tus reservas. Es gratis.' : 'Es gratis y toma menos de un minuto.'}</p>
            <form data-register-form novalidate>
              <div data-form-error></div>
              ${ownerMode
                ? html`<input type="hidden" name="role" value="owner" />`
                : html`
                  <div class="form-group">
                    <label class="form-label">¿Qué quieres hacer?</label>
                    <div class="option-cards">
                      <label class="option-card"><input type="radio" name="role" value="player" checked /><strong>Jugar</strong><span>Buscar y reservar canchas</span></label>
                      <label class="option-card"><input type="radio" name="role" value="owner" /><strong>Alquilar mi cancha</strong><span>Publicar y administrar</span></label>
                    </div>
                  </div>`}
              <div class="form-group">
                <label class="form-label" for="email">Correo electrónico</label>
                <input class="form-control" id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="password">Contraseña</label>
                <input class="form-control" id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" />
              </div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">${ownerMode ? 'Crear cuenta de propietario' : 'Crear cuenta'}</button>
            </form>
            ${SocialLogin({ text: 'Registrarme con' })}
            <p class="text-small text-muted text-center mt-3">¿Ya tienes cuenta? <a href="#/login" class="fw-600" style="color:var(--green-700)">Inicia sesión</a></p>
          </div>
        </div>
      </div>
    </div>`);

  const form = $('[data-register-form]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formToObject(form);
    try {
      const user = await register(data);
      showToast(`¡Bienvenido, ${user.name.split(' ')[0]}!`, 'success');
      afterRegister(user);
    } catch (err) {
      render($('[data-form-error]', root), html`<div class="form-error">${err.message}</div>`);
    }
  });

  bindSocialLogin(root, { role: defaultRole, onSuccess: afterRegister });
}
