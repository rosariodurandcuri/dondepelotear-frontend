/**
 * PÁGINA DE INICIO — hero con buscador, cómo funciona, canchas destacadas y CTA para propietarios.
 */
import { html, render } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { SearchBar, bindSearchBar } from '../components/SearchBar.js';
import { FieldCard, bindFavoriteButtons } from '../components/FieldCard.js';
import { requestUserLocation, getStoredLocation } from '../services/geoService.js';
import { getCurrentUser, isOwner } from '../services/authService.js';
import { getFeaturedFields, searchFields } from '../services/fieldService.js';
import { APP_CONFIG } from '../config/app.js';
import { href } from '../router.js';


export default async function HomePage(root) {
  const featured = await getFeaturedFields(4);

  render(root, html`
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">${APP_CONFIG.tagline}</h1>
        <p class="hero-subtitle">Busca canchas de fútbol 7 y fútbol 11 en todo el Perú, consulta disponibilidad y reserva tu horario.</p>
        ${SearchBar({}, { simple: true })}
      </div>
    </section>

    <section class="section">
      <div class="container" data-fields-section>
        ${FieldsSection({ nearby: null, featured })}
      </div>
    </section>

${(() => { const u = getCurrentUser(); return !u || isOwner(u); })() ? html`    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="owner-cta">
          <div>
            <h2>¿Tienes una cancha?</h2>
            <p>Publícala gratis, administra tus horarios desde el celular y recibe reservas sin llamadas ni mensajes.</p>
          </div>
          <a href="#/propietarios" class="btn btn-lg">Publicar mi cancha ${icon('arrowRight')}</a>
        </div>
      </div>
    </section>` : ''}`);

  bindFavoriteButtons(root);
  bindSearchBar(root);

  // Canchas cercanas: pedimos la ubicación (el navegador muestra su permiso). Si el usuario
  // no la comparte, se mantienen las canchas destacadas y la búsqueda por ubicación.
  const sectionEl = root.querySelector('[data-fields-section]');
  const showNearby = async (position) => {
    const { results } = await searchFields({ sort: 'distance', lat: position.lat, lng: position.lng });
    if (sectionEl.isConnected) render(sectionEl, FieldsSection({ nearby: results.slice(0, 8), featured }));
  };
  const stored = getStoredLocation();
  if (stored) {
    await showNearby(stored);
  } else {
    render(root.querySelector('[data-nearby-status]'), html`<span class="nearby-status">${icon('navigation', 'icon icon-sm')} Buscando canchas cerca de ti…</span>`);
    requestUserLocation().then((position) => {
      if (position) showNearby(position);
      else if (sectionEl.isConnected) render(root.querySelector('[data-nearby-status]'), '');
    });
  }
}

/** Sección de canchas del inicio: "Cerca de ti" (ordenadas por distancia) o "Destacadas" */
function FieldsSection({ nearby, featured }) {
  const list = nearby?.length ? nearby : featured;
  return html`
    <div class="section-head">
      <div>
        <h2 class="section-title">${nearby?.length ? 'Canchas cerca de ti' : 'Canchas destacadas'}</h2>
        <p class="section-subtitle">${nearby?.length ? 'Ordenadas por distancia desde tu ubicación.' : 'Las mejor calificadas por los jugadores.'} <span data-nearby-status></span></p>
      </div>
      <a href="${nearby?.length ? href('/buscar', { sort: 'distance' }) : '#/buscar'}" class="btn btn-outline btn-sm">Ver todas ${icon('arrowRight', 'icon icon-sm')}</a>
    </div>
    <div class="fields-grid cols-4">${list.map((f) => FieldCard(f, { showDistance: Boolean(nearby?.length) }))}</div>`;
}
