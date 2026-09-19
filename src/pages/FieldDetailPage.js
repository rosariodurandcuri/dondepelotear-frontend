/**
 * DETALLE DE CANCHA — galería, información, servicios, mapa y el
 * SISTEMA DE DISPONIBILIDAD (selector de fecha + horarios + precio dinámico).
 */
import { html, render, $ } from '../utils/dom.js';
import { icon, starIcon } from '../components/icons.js';
import { Gallery, bindGallery } from '../components/Gallery.js';
import { ServicesGrid } from '../components/ServiceIcons.js';
import { MapPreview, mountFieldMap } from '../components/MapPreview.js';
import { DateSelector, bindDateSelector } from '../components/DateSelector.js';
import { TimeSlots, bindTimeSlots } from '../components/TimeSlots.js';
import { EmptyState } from '../components/EmptyState.js';
import { FavoriteButton, bindFavoriteButtons } from '../components/FieldCard.js';
import { showToast } from '../components/Toast.js';
import { getFieldById } from '../services/fieldService.js';
import { getSlotsForDate } from '../services/availabilityService.js';
import { getReviewsForField, addReview, getUserReview } from '../services/reviewService.js';
import { getCurrentUser } from '../services/authService.js';
import { fieldTypeLabel, fieldTypes, SLOT_STATUS } from '../config/constants.js';
import { APP_CONFIG } from '../config/app.js';
import { formatPrice, formatFieldPrice, hasPrice, phoneLink, formatRating, formatLocation, whatsappLink, whatsappMessage } from '../utils/format.js';
import { todayISO, addDays, formatDateLong, groupConsecutiveSlots, totalHours } from '../utils/dates.js';
import { navigate, href, setPageTitle } from '../router.js';

export default async function FieldDetailPage(root, { params, query }) {
  const field = await getFieldById(params.id);
  if (!field) {
    render(root, html`<div class="container page">${EmptyState({ iconName: 'ball', title: 'Cancha no encontrada', message: 'Puede que haya sido eliminada o el enlace sea incorrecto.', action: html`<a href="#/buscar" class="btn btn-primary">Buscar canchas</a>` })}</div>`);
    return;
  }
  setPageTitle(field.name);
  const reviews = await getReviewsForField(field.id);
  const waLink = whatsappLink(field.contactWhatsApp, whatsappMessage(field.name));
  const WhatsAppButton = (cls = 'btn btn-whatsapp') => (waLink
    ? html`<a class="${cls}" href="${waLink}" target="_blank" rel="noopener">${icon('whatsapp')} Contactar por WhatsApp</a>`
    : '');
  const bookable = hasPrice(field); // sin precio publicado no se reserva en línea: solo contacto
  const phones = (field.phones || []).filter(Boolean);
  const PhoneList = () => (phones.length
    ? html`<div class="phone-list">${phones.map((p) => html`<a class="btn btn-outline btn-sm" href="${phoneLink(p)}">${icon('phone', 'icon icon-sm')} ${p}</a>`)}</div>`
    : '');

  // ---- Estado de la selección ----
  const today = todayISO();
  const maxDate = addDays(today, APP_CONFIG.daysAheadForBooking - 1);
  const state = {
    date: query.date && query.date >= today && query.date <= maxDate ? query.date : today,
    slots: [],
    selected: [], // horas de inicio seleccionadas; pueden NO ser consecutivas (ej. ['10:00','14:00'])
  };

  /** Resumen de la selección: bloques agrupados, horas y precio total */
  const selectionInfo = () => {
    if (!state.selected.length) return null;
    const blocks = groupConsecutiveSlots(state.selected, APP_CONFIG.slotDurationMinutes);
    const hours = totalHours(blocks);
    return { blocks, hours, total: hours * (field.pricePerHour || 0), label: blocks.map((b) => `${b.startTime} - ${b.endTime}`).join(' · ') };
  };

  // ---- Estructura de la página (se dibuja una vez) ----
  render(root, html`
    <div class="container detail-page">
      <nav class="breadcrumb">
        <a href="#/">Inicio</a> ${icon('chevronRight', 'icon icon-sm')}
        <a href="${href('/buscar', { department: field.department })}">${field.department}</a> ${icon('chevronRight', 'icon icon-sm')}
        <a href="${href('/buscar', { department: field.department, province: field.province, district: field.district })}">${field.district}</a> ${icon('chevronRight', 'icon icon-sm')}
        <span>${field.name}</span>
      </nav>

      ${field.images?.length > 1 ? Gallery(field.images, field.name) : ''}

      <div class="detail-layout">
        <div>
          ${field.images?.length > 1 ? '' : Gallery(field.images, field.name)}
          <div class="detail-header">
            <div class="flex gap-1 flex-wrap">
              ${fieldTypes(field).map((t) => html`<span class="badge badge-dark">${icon('ball', 'icon icon-sm')} ${fieldTypeLabel(t)}</span>`)}
              ${field.surface ? html`<span class="badge badge-gray">Grass ${field.surface}</span>` : ''}
              ${field.courts ? html`<span class="badge badge-gray">${field.courts} ${field.courts === 1 ? 'cancha' : 'canchas'}</span>` : ''}
              ${bookable && field.availabilitySummary.availableToday ? html`<span class="badge badge-green">${icon('check', 'icon icon-xs')}Disponible hoy</span>` : ''}
            </div>
            <div class="flex justify-between items-center gap-2">
              <h1>${field.name}</h1>
              ${FavoriteButton(field.id, 'fav-btn fav-btn-lg')}
            </div>
            <div class="detail-meta">
              <span class="rating">${starIcon()} ${formatRating(field.rating)} <span class="text-muted fw-600">(${field.reviewCount} reseñas)</span></span>
              <span>${icon('mapPin', 'icon icon-sm')} ${field.address}, ${formatLocation(field)}</span>
            </div>
            ${waLink || phones.length ? html`<div class="detail-contact">${WhatsAppButton('btn btn-whatsapp btn-sm')}${PhoneList()}<span class="text-xs text-muted">Consulta directa con el local, sin compromiso.</span></div>` : ''}
          </div>

          ${bookable ? html`
          <section class="detail-section" id="disponibilidad">
            <h2>Disponibilidad</h2>
            <p class="text-muted text-small mb-2">Elige un día y toca los horarios que quieras reservar: una hora, varias seguidas o no seguidas.</p>
            <div data-date-selector></div>
            <div class="mt-2" data-slots-area>
              <div class="loading-block"><span class="spinner spinner-dark"></span> Cargando horarios…</div>
            </div>
          </section>` : html`
          <section class="detail-section" id="disponibilidad">
            <h2>Reservas</h2>
            <div class="address-box">
              ${icon('info')}
              <div>
                <strong>Este local aún no publica su precio ni recibe reservas en línea.</strong><br />
                <span class="text-muted">Comunícate directamente por WhatsApp o teléfono para consultar horarios y precios.</span>
                ${field.source ? html`<br /><a class="text-xs text-muted" href="${field.source}" target="_blank" rel="noopener">Fuente de los datos</a>` : ''}
              </div>
            </div>
          </section>`}

${field.description ? html`          <section class="detail-section">
            <h2>Descripción</h2>
            <p class="detail-description ${(field.description || '').length > 260 ? 'line-clamp-3' : ''}" data-description>${field.description}</p>
            ${(field.description || '').length > 260 ? html`<button class="btn btn-ghost btn-sm mt-1" data-toggle-description>Ver más ${icon('chevronDown', 'icon icon-sm')}</button>` : ''}
          </section>` : ''}

          <section class="detail-section">
            <h2>Servicios</h2>
            ${ServicesGrid(field.services)}
          </section>

          <section class="detail-section">
            <h2>Ubicación</h2>
            <div class="address-box mb-2">
              ${icon('mapPin')}
              <div>
                <strong>${field.address}</strong><br />
                <span class="text-muted">${formatLocation(field, { full: true })}</span>
                ${field.reference ? html`<br /><span class="text-muted text-small">Referencia: ${field.reference}</span>` : ''}
              </div>
            </div>
            ${MapPreview(field)}
          </section>

          <section class="detail-section" id="resenas">
            <h2>Reseñas</h2>
            <div data-review-form></div>
            <div data-reviews-list></div>
          </section>
        </div>

        <aside class="booking-box" data-booking-box></aside>
      </div>
    </div>
    <div class="mobile-booking-bar" data-mobile-bar></div>`);

  bindGallery(root);
  bindFavoriteButtons(root);

  // ---- Reseñas: solo usuarios registrados pueden calificar ----
  const drawReviews = async () => {
    const list = await getReviewsForField(field.id);
    const user = getCurrentUser();
    const mine = getUserReview(user?.id, field.id);
    let draftRating = mine?.rating || 0;

    render($('[data-reviews-list]', root), list.length
      ? list.map((r) => html`
        <div class="review">
          <div class="review-header">
            <strong>${r.userName}${user && r.userId === user.id ? html` <span class="badge badge-green">Tu reseña</span>` : ''}</strong>
            <span class="rating">${starIcon()} ${r.rating}</span>
          </div>
          ${r.comment ? html`<p>${r.comment}</p>` : ''}
        </div>`)
      : html`<p class="text-muted">Esta cancha aún no tiene reseñas.</p>`);

    const formBox = $('[data-review-form]', root);
    if (!user) {
      render(formBox, html`
        <div class="review-locked">
          ${icon('lock', 'icon icon-sm')}
          <span>Para calificar o dejar una reseña necesitas una cuenta.</span>
          <a class="btn btn-outline btn-sm" href="#/login?next=/cancha/${field.id}">Iniciar sesión</a>
          <a class="btn btn-primary btn-sm" href="#/registro?next=/cancha/${field.id}">Registrarme</a>
        </div>`);
      return;
    }

    render(formBox, html`
      <form class="review-form" data-review-submit novalidate>
        <div class="review-form-head">
          <strong>${mine ? 'Edita tu calificación' : '¿Ya jugaste aquí? Califica la cancha'}</strong>
          <div class="star-input" data-star-input role="radiogroup" aria-label="Calificación">
            ${[1, 2, 3, 4, 5].map((n) => html`<button type="button" class="star-btn ${n <= draftRating ? 'active' : ''}" data-star="${n}" aria-label="${n} ${n === 1 ? 'estrella' : 'estrellas'}">${starIcon()}</button>`)}
          </div>
        </div>
        <textarea class="form-control" name="comment" rows="2" placeholder="Cuéntale a otros jugadores cómo fue tu experiencia (opcional)">${mine?.comment || ''}</textarea>
        <div class="flex justify-between items-center gap-1 flex-wrap">
          <span class="form-hint" data-review-error></span>
          <button type="submit" class="btn btn-primary btn-sm">${mine ? 'Guardar cambios' : 'Publicar reseña'}</button>
        </div>
      </form>`);

    const paintStars = () => formBox.querySelectorAll('[data-star]').forEach((b) => b.classList.toggle('active', Number(b.dataset.star) <= draftRating));
    formBox.querySelectorAll('[data-star]').forEach((b) => b.addEventListener('click', () => { draftRating = Number(b.dataset.star); paintStars(); }));
    $('[data-review-submit]', formBox).addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = $('[data-review-error]', formBox);
      try {
        await addReview({ userId: user.id, fieldId: field.id, rating: draftRating, comment: e.target.comment.value });
        showToast('¡Gracias por tu reseña!', 'success');
        // Actualiza la calificación mostrada en la cabecera
        const updated = await getFieldById(field.id);
        const ratingEl = root.querySelector('.detail-meta .rating');
        if (ratingEl && updated) render(ratingEl, html`${starIcon()} ${formatRating(updated.rating)} <span class="text-muted fw-600">(${updated.reviewCount} reseñas)</span>`);
        drawReviews();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.color = 'var(--red-600)';
      }
    });
  };
  drawReviews();
  // Descripciones largas: "Ver más" / "Ver menos"
  $('[data-toggle-description]', root)?.addEventListener('click', (e) => {
    const p = $('[data-description]', root);
    const expanded = p.classList.toggle('line-clamp-3') === false;
    render(e.currentTarget, expanded ? html`Ver menos ${icon('chevronDown', 'icon icon-sm')}` : html`Ver más ${icon('chevronDown', 'icon icon-sm')}`);
    e.currentTarget.querySelector('.icon')?.style.setProperty('transform', expanded ? 'rotate(180deg)' : 'none');
  });
  mountFieldMap(root, field);

  // ---- Funciones de dibujo parcial ----
  const drawDateSelector = () => {
    const box = $('[data-date-selector]', root);
    if (!box) return; // sin precio publicado no hay selector de fechas
    render(box, DateSelector(state.date));
    bindDateSelector(box, async (date) => {
      state.date = date;
      state.selected = [];
      drawDateSelector();
      await loadSlots();
    });
  };

  const loadSlots = async () => {
    if (!bookable) { drawBookingBox(); return; }
    state.slots = await getSlotsForDate(field.id, state.date);
    drawSlots();
    drawBookingBox();
  };

  const drawSlots = () => {
    const area = $('[data-slots-area]', root);
    const available = state.slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE).length;
    render(area, html`
      <p class="text-small text-muted mb-1"><strong class="fw-700" style="color:var(--gray-900)">${formatDateLong(state.date)}</strong> · ${available} ${available === 1 ? 'horario disponible' : 'horarios disponibles'}</p>
      ${TimeSlots(state.slots, state.selected, { pricePerHour: field.pricePerHour })}`);
    bindTimeSlots(area, toggleSlot, () => { state.selected = []; drawSlots(); drawBookingBox(); });
  };

  /**
   * Lógica de selección: cada toque agrega o quita un horario disponible.
   * No es necesario que sean consecutivos (ej. 10:00-11:00 y 14:00-15:00). Sin límite de horas.
   */
  const toggleSlot = (startTime) => {
    state.selected = state.selected.includes(startTime)
      ? state.selected.filter((s) => s !== startTime)
      : [...state.selected, startTime];
    drawSlots();
    drawBookingBox();
  };

  const drawBookingBox = () => {
    const info = selectionInfo();
    const box = $('[data-booking-box]', root);
    const bar = $('[data-mobile-bar]', root);

    if (!bookable) {
      render(box, html`
        <div class="card">
          <div class="card-body">
            <div class="booking-price">Consultar precio</div>
            <div class="booking-selection empty">El local no publica su precio. Contáctalo para reservar.</div>
            ${WhatsAppButton('btn btn-whatsapp btn-block')}
            ${PhoneList()}
          </div>
        </div>`);
      render(bar, html`
        <div>
          <div class="booking-price">Consultar precio</div>
          <div class="text-xs text-muted">Contacta al local</div>
        </div>
        <div class="flex gap-1">
          ${waLink ? html`<a class="btn btn-whatsapp btn-icon" href="${waLink}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">${icon('whatsapp')}</a>` : ''}
          ${phones[0] ? html`<a class="btn btn-outline" href="${phoneLink(phones[0])}">${icon('phone', 'icon icon-sm')} Llamar</a>` : ''}
        </div>`);
      return;
    }

    render(box, html`
      <div class="card booking-card">
        <div class="card-body">
          <div class="booking-price-row">
            <span class="booking-price-label">Precio por hora</span>
            <div class="booking-price">${formatFieldPrice(field)}</div>
          </div>
          ${info
            ? html`
              <div class="booking-selection">
                <div class="summary-list">
                  <div class="summary-item"><span>Fecha</span><span>${formatDateLong(state.date)}</span></div>
                  <div class="summary-item"><span>${info.blocks.length > 1 ? 'Horarios' : 'Horario'}</span><span>${info.blocks.map((b) => html`<span class="selected-block">${b.startTime} - ${b.endTime}</span>`)}</span></div>
                  <div class="summary-item"><span>Duración</span><span>${info.hours} ${info.hours === 1 ? 'hora' : 'horas'}</span></div>
                </div>
                <div class="summary-total"><span>Total</span><span>${formatPrice(info.total)}</span></div>
              </div>
              <button class="btn btn-primary btn-lg btn-block" data-book>Reservar ahora ${icon('arrowRight')}</button>`
            : html`
              <ol class="booking-steps">
                <li><span class="booking-step-num">1</span><span>Elige el día en el calendario</span></li>
                <li><span class="booking-step-num">2</span><span>Toca los horarios que quieras</span></li>
                <li><span class="booking-step-num">3</span><span>Confirma y recibe tu código</span></li>
              </ol>
              <a href="#disponibilidad" class="btn btn-primary btn-lg btn-block" data-go-availability>${icon('clock')} Ver horarios disponibles</a>`}
          <div class="booking-trust">
            <span>${icon('checkCircle', 'icon icon-sm')} Confirmación inmediata</span>
            <span>${icon('checkCircle', 'icon icon-sm')} Sin costo por reservar</span>
          </div>
          ${WhatsAppButton('btn btn-whatsapp btn-block')}
        </div>
      </div>`);

    render(bar, info
      ? html`
        <div>
          <div class="booking-price">${formatPrice(info.total)}</div>
          <div class="text-xs text-muted">${info.label} · ${info.hours}h</div>
        </div>
        <div class="flex gap-1">
          ${waLink ? html`<a class="btn btn-whatsapp btn-icon" href="${waLink}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">${icon('whatsapp')}</a>` : ''}
          <button class="btn btn-primary" data-book>Reservar</button>
        </div>`
      : html`
        <div>
          <div class="booking-price">${formatFieldPrice(field)}<small> / hora</small></div>
          <div class="text-xs text-muted">Elige un horario</div>
        </div>
        <div class="flex gap-1">
          ${waLink ? html`<a class="btn btn-whatsapp btn-icon" href="${waLink}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">${icon('whatsapp')}</a>` : ''}
          <a href="#disponibilidad" class="btn btn-outline" data-go-availability>Ver horarios</a>
        </div>`);

    root.querySelectorAll('[data-book]').forEach((btn) =>
      btn.addEventListener('click', () => {
        navigate(`/reservar/${field.id}`, { date: state.date, slots: [...state.selected].sort().join(',') });
      })
    );
    root.querySelectorAll('[data-go-availability]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      $('#disponibilidad', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  drawDateSelector();
  await loadSlots();

  // Si vino desde el botón "Reservar" de una tarjeta, llevar directo a los horarios
  if (query.reservar) setTimeout(() => $('#disponibilidad', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}
