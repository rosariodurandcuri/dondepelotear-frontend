/**
 * CABECERA — logo, menú principal y estado de sesión.
 * Se redibuja sola cuando el usuario inicia o cierra sesión.
 */
import { html, render } from '../utils/dom.js';
import { Logo } from './Logo.js';
import { icon } from './icons.js';
import { getCurrentUser, isOwner, isAdmin, onAuthChange, logout } from '../services/authService.js';
import { navigate, currentRoute } from '../router.js';
import { showToast } from './Toast.js';

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function renderHeader(container) {
  const draw = () => {
    const user = getCurrentUser();
    const { path } = currentRoute();
    const active = (p) => (path === p || (p !== '/' && path.startsWith(p)) ? 'active' : '');

    const authLinks = user
      ? html`
        <div class="user-menu">
          <button class="user-chip" data-user-menu aria-haspopup="true">
            <span class="avatar">${initials(user.name)}</span>
            <span class="hide-mobile">${user.name.split(' ')[0]}</span>
            ${icon('chevronDown', 'icon icon-sm')}
          </button>
          <div class="user-dropdown" data-dropdown>
            <a href="#/mis-reservas">${icon('calendar')} Mis reservas</a>
            ${isOwner(user) ? html`<a href="#/propietario">${icon('grid')} Panel de propietario</a>` : ''}
            ${isAdmin(user) ? html`<a href="#/admin">${icon('users')} Administración</a>` : ''}
            <div class="divider"></div>
            <button data-logout>${icon('logout')} Cerrar sesión</button>
          </div>
        </div>`
      : html`
        <a href="#/login" class="${active('/login')}">Iniciar sesión</a>
        <a href="#/registro" class="btn btn-brand btn-sm">Registrarse</a>`;

    render(container, html`
      <div class="header">
        <div class="container">
          <div class="header-inner">
            ${Logo()}
            <nav class="nav">
              <a href="#/buscar" class="${active('/buscar')}">Buscar canchas</a>
              ${!user || isOwner(user) ? html`<a href="#/propietarios" class="${active('/propietario')}">¿Tienes una cancha?</a>` : ''}
              ${authLinks}
            </nav>
            <div class="flex items-center gap-1 hide-desktop">
              ${user ? html`<a href="#/mis-reservas" class="avatar" aria-label="Mi cuenta">${initials(user.name)}</a>` : ''}
              <button class="btn btn-ghost btn-icon menu-toggle" data-menu-toggle aria-label="Abrir menú">${icon('menu')}</button>
            </div>
          </div>
          <div class="mobile-nav" data-mobile-nav>
            <a href="#/buscar">${icon('search')} Buscar canchas</a>
            ${!user || isOwner(user) ? html`<a href="#/propietarios">${icon('ball')} ¿Tienes una cancha?</a>` : ''}
            ${user
              ? html`
                <a href="#/mis-reservas">${icon('calendar')} Mis reservas</a>
                ${isOwner(user) ? html`<a href="#/propietario">${icon('grid')} Panel de propietario</a>` : ''}
                ${isAdmin(user) ? html`<a href="#/admin">${icon('users')} Administración</a>` : ''}
                <button class="btn btn-outline" data-logout>${icon('logout')} Cerrar sesión (${user.name.split(' ')[0]})</button>`
              : html`
                <a href="#/login">${icon('user')} Iniciar sesión</a>
                <a href="#/registro" class="btn btn-brand">Registrarse</a>`}
          </div>
        </div>
      </div>`);

    // Menú móvil
    const mobileNav = container.querySelector('[data-mobile-nav]');
    container.querySelector('[data-menu-toggle]').addEventListener('click', () => mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mobileNav.classList.remove('open')));

    // Menú de usuario (escritorio)
    const userMenuBtn = container.querySelector('[data-user-menu]');
    if (userMenuBtn) {
      const dropdown = container.querySelector('[data-dropdown]');
      userMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
      dropdown.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => dropdown.classList.remove('open')));
    }

    container.querySelectorAll('[data-logout]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        await logout();
        showToast('Sesión cerrada');
        navigate('/');
      })
    );
  };

  draw();
  onAuthChange(draw);
  document.addEventListener('route:change', () => {
    // Actualiza el enlace activo sin redibujar todo
    const { path } = currentRoute();
    container.querySelectorAll('.nav a').forEach((a) => {
      const target = a.getAttribute('href').replace('#', '');
      a.classList.toggle('active', target !== '/' && path.startsWith(target.split('?')[0]) && !a.classList.contains('btn'));
    });
    container.querySelector('[data-mobile-nav]')?.classList.remove('open');
    container.querySelector('[data-dropdown]')?.classList.remove('open');
  });
}
