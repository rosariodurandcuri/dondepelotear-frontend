/**
 * INICIAR SESIÓN (simulado: solo se necesita el correo de una cuenta existente).
 */
import { html, render, $, formToObject } from '../utils/dom.js';
import { login } from '../services/authService.js';
import { showToast } from '../components/Toast.js';
import { navigate } from '../router.js';
import { ROLES } from '../config/constants.js';
import { SocialLogin, bindSocialLogin } from '../components/SocialLogin.js';


export default function LoginPage(root, { query }) {
  render(root, html`
    <div class="container">
      <div class="auth-page">
        <div class="card">
          <div class="card-body">
            <h1>Iniciar sesión</h1>
            <p class="text-muted mb-3">${query.role === 'owner' ? 'Ingresa con tu cuenta de propietario para administrar tus canchas.' : 'Ingresa para ver y administrar tus reservas.'}</p>
            <form data-login-form novalidate>
              <div data-form-error></div>
              <div class="form-group">
                <label class="form-label" for="email">Correo electrónico</label>
                <input class="form-control" id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" required autofocus />
              </div>
              <div class="form-group">
                <label class="form-label" for="password">Contraseña</label>
                <input class="form-control" id="password" name="password" type="password" placeholder="••••••••" />
              </div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">Ingresar</button>
            </form>
            ${SocialLogin()}
            <p class="text-small text-muted text-center mt-3">¿No tienes cuenta? <a href="#/registro" class="fw-600" style="color:var(--green-700)">Regístrate gratis</a></p>

        </div>
      </div>
    </div>`);

  const form = $('[data-login-form]', root);
  const errorBox = $('[data-form-error]', root);

  const goAfterLogin = (user) => {
    const next = query.next || (user.role === ROLES.OWNER ? '/propietario' : user.role === ROLES.ADMIN ? '/admin' : '/');
    navigate(next);
  };
  const doLogin = async ({ email, password }) => {
    try {
      const user = await login({ email, password });
      showToast(`¡Hola, ${user.name.split(' ')[0]}!`, 'success');
      goAfterLogin(user);
    } catch (err) {
      render(errorBox, html`<div class="form-error">${err.message}</div>`);
    }
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); doLogin(formToObject(form)); });
  bindSocialLogin(root, { role: query.role === 'owner' ? ROLES.OWNER : ROLES.PLAYER, onSuccess: goAfterLogin });
}
