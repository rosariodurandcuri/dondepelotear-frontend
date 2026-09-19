/**
 * BOTONES "Continuar con Google / Facebook" (simulados en el MVP).
 * Uso: ${SocialLogin()}  y luego  bindSocialLogin(root, { role, onSuccess })
 */
import { html, raw } from '../utils/dom.js';
import { loginWithProvider, SOCIAL_PROVIDERS } from '../services/authService.js';
import { showToast } from './Toast.js';

const LOGOS = {
  google: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"/></svg>',
  facebook: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
};

export function SocialLogin({ text = 'Continuar con' } = {}) {
  return html`
    <div class="social-login">
      <div class="social-divider"><span>o</span></div>
      <div class="social-buttons">
        ${SOCIAL_PROVIDERS.map((p) => html`<button type="button" class="btn btn-outline" data-social="${p.id}">${raw(LOGOS[p.id])} ${text} ${p.label}</button>`)}
      </div>
    </div>`;
}

export function bindSocialLogin(root, { role, onSuccess }) {
  root.querySelectorAll('[data-social]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const user = await loginWithProvider(btn.dataset.social, { role });
        showToast(`¡Hola, ${user.name}!`, 'success');
        onSuccess(user);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
      }
    })
  );
}
