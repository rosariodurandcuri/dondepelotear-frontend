/**
 * TARJETA DE CANCHA — usada en resultados y en el inicio.
 */
import { html } from '../utils/dom.js';
import { icon, starIcon, heartIcon } from './icons.js';
import { isFavorite, toggleFavorite } from '../services/favoriteService.js';
import { showToast } from './Toast.js';
import { refreshIcons } from '../utils/dom.js';
import { SERVICES, fieldTypesLabel, fieldTypesCompact } from '../config/constants.js';
import { formatFieldPrice, hasPrice, formatRating, whatsappLink, whatsappMessage } from '../utils/format.js';
import { PLACEHOLDER_IMAGE } from '../utils/images.js';
import { todayISO } from '../utils/dates.js';
import { href } from '../router.js';

export function FieldCard(field, { date = todayISO(), showDistance = false } = {}) {
  const image = field.images?.[0] || PLACEHOLDER_IMAGE;
  const detailHref = href(`/cancha/${field.id}`, { date });
  const services = SERVICES.filter((s) => field.services.includes(s.id)).slice(0, 4);
  const waLink = whatsappLink(field.contactWhatsApp, whatsappMessage(field.name));
  return html`
    <article class="card field-card fade-in">
      <a class="field-card-link" href="${detailHref}" aria-label="Ver ${field.name}"></a>
      <div class="field-card-media">
        <div class="field-card-image">
          <img src="${image}" alt="${field.name}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
          <div class="field-card-badges">
            <span class="badge badge-dark" title="${fieldTypesLabel(field)}">${icon('ball', 'icon icon-sm')} ${fieldTypesCompact(field)}</span>
          </div>
        </div>
      </div>
      <div class="field-card-body">
        <div class="field-card-head">
          <h3 class="field-card-title" title="${field.name}">${field.name}</h3>
          <span class="rating" title="${field.reviewCount} ${field.reviewCount === 1 ? 'reseña' : 'reseñas'}">${starIcon()} ${formatRating(field.rating)}<small>(${field.reviewCount})</small></span>
        </div>
        <div class="field-card-meta">
          ${icon('mapPin', 'icon icon-sm')}
          <span>${field.district}${showDistance && Number.isFinite(field.distanceKm) ? html` · <strong>${field.distanceKm} km</strong>` : ''}</span>
        </div>
        <div class="field-card-services">
          ${services.map((s) => html`<span title="${s.label}">${icon(s.icon, 'icon icon-sm')}</span>`)}
          ${field.services.length > services.length ? html`<span class="field-card-services-more" title="${SERVICES.filter((s) => field.services.includes(s.id)).map((s) => s.label).join(', ')}">+${field.services.length - services.length}</span>` : ''}
          ${waLink ? html`<a class="card-tool card-tool-wa card-tool-inline" href="${waLink}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp a ${field.name}" title="Contactar por WhatsApp">${icon('whatsapp', 'icon icon-sm')}</a>` : ''}
        </div>
        <div class="field-card-footer">
          <div class="field-card-price ${hasPrice(field) ? '' : 'is-quote'}">${formatFieldPrice(field)}${hasPrice(field) ? html`<small> / hora</small>` : ''}</div>
        </div>
      </div>
    </article>`;
}

/** Botón de favorito (corazón). Enlázalo con bindFavoriteButtons(root). */
export function FavoriteButton(fieldId, className = 'fav-btn') {
  const active = isFavorite(fieldId);
  return html`<button type="button" class="${className} ${active ? 'active' : ''}" data-fav="${fieldId}" aria-pressed="${active}" aria-label="${active ? 'Quitar de favoritos' : 'Guardar en favoritos'}" title="Favorito">${heartIcon(active, 'icon')}</button>`;
}

/** Un solo listener por página: alterna el favorito y actualiza el icono */
export function bindFavoriteButtons(root) {
  if (root.dataset.favBound) return;
  root.dataset.favBound = '1';
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    const active = toggleFavorite(btn.dataset.fav);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.innerHTML = String(heartIcon(active, 'icon'));
    refreshIcons(btn);
    showToast(active ? 'Guardada en favoritos' : 'Quitada de favoritos');
  });
}
