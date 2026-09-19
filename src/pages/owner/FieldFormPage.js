/**
 * PUBLICAR / EDITAR CANCHA — formulario paso a paso (7 pasos).
 *  1 Información · 2 Ubicación · 3 Fotografías · 4 Precio · 5 Servicios · 6 Horarios · 7 Publicar
 * El borrador se guarda en memoria mientras el propietario avanza entre pasos.
 */
import { html, render, $ } from '../../utils/dom.js';
import { icon } from '../../components/icons.js';
import { OwnerLayout } from '../../components/OwnerLayout.js';
import { showToast } from '../../components/Toast.js';
import { getCurrentUser } from '../../services/authService.js';
import { createField, updateField, getFieldById } from '../../services/fieldService.js';
import { FIELD_TYPES, SERVICES, WEEKDAYS, HOURS, fieldTypeLabel, fieldTypes } from '../../config/constants.js';
import { getCoordinates } from '../../config/locations.js';
import { getCountry } from '../../config/app.js';
import { LocationPicker, bindLocationPicker } from '../../components/LocationPicker.js';
import { LocationMap, mountLocationMap, geocodeAddress, reverseGeocode, leafletReady } from '../../components/LocationMap.js';
import { formatPrice } from '../../utils/format.js';
import { fileToResizedDataURL, PLACEHOLDER_IMAGE } from '../../utils/images.js';
import { navigate } from '../../router.js';

const STEPS = ['Información', 'Ubicación', 'Fotografías', 'Precio', 'Horarios', 'Publicar'];

function emptySchedule() {
  return Object.fromEntries(WEEKDAYS.map((d) => [d.key, { open: '08:00', close: '23:00', closed: false }]));
}

export default async function FieldFormPage(root, { params }) {
  const user = getCurrentUser();
  const editing = Boolean(params.id);
  const existing = editing ? await getFieldById(params.id) : null;

  if (editing && (!existing || existing.ownerId !== user.id)) {
    showToast('No puedes editar esta cancha', 'error');
    navigate('/propietario/canchas');
    return;
  }

  // ---- Borrador ----
  const draft = existing
    ? { ...existing, whatsapp: existing.whatsapp || user.whatsapp || user.phone || '', types: [...fieldTypes(existing)], latitudeManual: Boolean(existing.latitude && existing.longitude), schedule: { ...emptySchedule(), ...existing.schedule }, images: [...existing.images], services: [...existing.services] }
    : { name: '', description: '', types: ['F7'], whatsapp: user.whatsapp || user.phone || '', address: '', reference: '', department: '', province: '', district: '', latitude: '', longitude: '', images: [], pricePerHour: '', services: [], schedule: emptySchedule() };

  let step = 0;

  // ---- Validación por paso ----
  function validateStep() {
    if (step === 0) {
      if (draft.name.trim().length < 3) return 'Escribe el nombre de la cancha (mínimo 3 caracteres).';
      if (!draft.types.length) return 'Elige al menos un tipo de cancha.';
      if (draft.whatsapp && !/^\+?\d[\d\s-]{7,14}$/.test(draft.whatsapp.trim())) return 'Ingresa un número de WhatsApp válido (9 dígitos).';
    }
    if (step === 1) {
      if (!draft.address.trim()) return 'Ingresa la dirección.';
      if (!draft.department) return 'Elige el departamento.';
      if (!draft.province) return 'Elige la provincia.';
      if (!draft.district) return 'Elige el distrito.';
    }
    if (step === 3 && !(Number(draft.pricePerHour) > 0)) return 'Ingresa un precio por hora mayor a 0.';
    if (step === 4 && WEEKDAYS.every((d) => draft.schedule[d.key].closed)) return 'La cancha debe abrir al menos un día.';
    if (step === 4) {
      const bad = WEEKDAYS.find((d) => !draft.schedule[d.key].closed && draft.schedule[d.key].open >= draft.schedule[d.key].close);
      if (bad) return `${bad.label}: la hora de cierre debe ser mayor a la de apertura.`;
    }
    return null;
  }

  // ---- Contenido de cada paso ----
  const stepViews = [
    () => html`
      <div class="form-group">
        <label class="form-label" for="name">Nombre de la cancha</label>
        <input class="form-control" id="name" name="name" placeholder="Ej. Cancha El Campeón" value="${draft.name}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="whatsapp">WhatsApp de contacto</label>
        <div class="input-icon">
          ${icon('whatsapp')}
          <input class="form-control" id="whatsapp" name="whatsapp" type="tel" inputmode="numeric" placeholder="987 654 321" value="${draft.whatsapp}" />
        </div>
        <span class="form-hint">Los jugadores verán un botón "Contactar por WhatsApp" en la página de la cancha. Puedes cambiarlo luego en Ajustes.</span>
      </div>
      <div class="form-group">
        <label class="form-label">Tipos de cancha</label>
        <span class="form-hint">Marca todos los que ofrece tu sede (una misma sede puede tener varios).</span>
        <div class="option-cards option-cards-types">
          ${FIELD_TYPES.map((t) => html`<label class="option-card"><input type="checkbox" name="types" value="${t.id}" ${draft.types.includes(t.id) ? 'checked' : ''} />${icon('ball')}<strong>${t.label}</strong><span>${t.players}</span></label>`)}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Servicios</label>
        <span class="form-hint">Marca los servicios que ofrece tu cancha.</span>
        <div class="services-grid services-grid-form mt-1">
          ${SERVICES.map((s) => html`<label class="service-item service-item-check"><input type="checkbox" name="services" value="${s.id}" ${draft.services.includes(s.id) ? 'checked' : ''} />${icon(s.icon)}<span>${s.label}</span></label>`)}
        </div>
      </div>`,

    () => html`
      <div class="form-group">
        <label class="form-label" for="address">Dirección</label>
        <input class="form-control" id="address" name="address" placeholder="Ej. Av. La Marina 2355" value="${draft.address}" />
        <span class="form-hint" data-address-hint>Se completa sola al ubicar la cancha en el mapa. Puedes corregirla a mano.</span>
      </div>
      <label class="form-label">Ubicación (elige de la lista)</label>
      ${LocationPicker(draft, { prefix: 'field' })}
      <div class="form-group">
        <label class="form-label" for="reference">Referencia</label>
        <input class="form-control" id="reference" name="reference" placeholder="Ej. A dos cuadras del parque" value="${draft.reference}" />
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación exacta en el mapa</label>
        <span class="form-hint">Busca la dirección o mueve el mapa y arrastra el marcador hasta el punto exacto de la cancha. También puedes tocar el mapa.</span>
        <div class="map-search mt-1">
          <div class="input-icon flex-1">
            ${icon('search')}
            <input class="form-control" data-map-search placeholder="Buscar dirección o lugar (ej. Av. La Marina 2355, San Miguel)" />
            <ul class="suggestions" data-map-results hidden></ul>
          </div>
          <button type="button" class="btn btn-outline" data-map-search-btn>${icon('map', 'icon icon-sm')} Buscar</button>
        </div>
        ${LocationMap({ id: 'field-form', height: 320, fallback: html`<div class="loading-block" style="height:100%">${icon('map')} El mapa necesita conexión a internet. Puedes escribir las coordenadas abajo.</div>` })}
        <div class="map-hint">
          ${icon('mapPin', 'icon icon-sm')}
          <span class="map-coords" data-map-coords>${draft.latitude && draft.longitude ? html`${Number(draft.latitude).toFixed(5)}, ${Number(draft.longitude).toFixed(5)}` : 'Sin coordenadas'}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-geolocate>${icon('navigation', 'icon icon-sm')} Usar mi ubicación actual</button>
        </div>
      </div>
      <p class="form-hint">La ubicación exacta se guarda al mover el marcador. Si no lo mueves, usaremos el centro del distrito elegido.</p>`,

    () => html`
      <label class="photo-upload">
        <input type="file" accept="image/*" multiple data-file-input />
        ${icon('image', 'icon icon-lg')}
        <strong>Subir fotografías</strong>
        <span class="text-small">JPG o PNG. Puedes elegir varias. Se reducen automáticamente.</span>
      </label>
      <div class="flex gap-1 mt-2">
        <input class="form-control" placeholder="…o pega la URL de una imagen" data-url-input />
        <button type="button" class="btn btn-outline" data-url-add>Agregar</button>
      </div>
      <div class="photo-grid" data-photo-grid>
        ${draft.images.map((src, i) => html`<div class="photo-item"><img src="${src}" alt="Foto ${i + 1}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" /><button type="button" data-remove-photo="${i}" aria-label="Quitar">${icon('x', 'icon icon-sm')}</button></div>`)}
      </div>
      ${!draft.images.length ? html`<p class="form-hint mt-2">Puedes continuar sin fotos y agregarlas después, pero las canchas con fotos reciben muchas más reservas.</p>` : ''}`,

    () => html`
      <div class="form-group">
        <label class="form-label" for="pricePerHour">Precio por hora (${getCountry().currencySymbol})</label>
        <input class="form-control" id="pricePerHour" name="pricePerHour" type="number" min="1" step="1" inputmode="numeric" placeholder="100" value="${draft.pricePerHour}" style="max-width:220px;font-size:22px;font-weight:700" />
        <span class="form-hint">Los jugadores verán este precio en los resultados de búsqueda.</span>
      </div>
      <div class="price-preview" data-price-preview>${pricePreview(draft.pricePerHour)}</div>`,

    () => html`
      <p class="text-muted mb-1">Define a qué hora abre y cierra tu cancha cada día. Los horarios se generan en bloques de 1 hora.</p>
      <button type="button" class="btn btn-ghost btn-sm mb-2" data-copy-monday>Copiar el horario del lunes a todos los días</button>
      ${WEEKDAYS.map((d) => {
        const day = draft.schedule[d.key];
        return html`
          <div class="schedule-row">
            <strong>${d.label}</strong>
            <div class="schedule-times ${day.closed ? 'closed' : ''}">
              <select data-day="${d.key}" data-prop="open" ${day.closed ? 'disabled' : ''}>${HOURS.slice(0, -1).map((h) => html`<option ${day.open === h ? 'selected' : ''}>${h}</option>`)}</select>
              <span>a</span>
              <select data-day="${d.key}" data-prop="close" ${day.closed ? 'disabled' : ''}>${HOURS.slice(1).map((h) => html`<option ${day.close === h ? 'selected' : ''}>${h}</option>`)}</select>
            </div>
            <label class="checkbox" style="padding:0"><input type="checkbox" data-day="${d.key}" data-prop="closed" ${day.closed ? 'checked' : ''} /> Cerrado</label>
          </div>`;
      })}`,

    () => {
      const openDays = WEEKDAYS.filter((d) => !draft.schedule[d.key].closed);
      const activeServices = SERVICES.filter((s) => draft.services.includes(s.id));
      return html`
      <p class="text-muted mb-2">Revisa cómo se verá tu cancha antes de publicarla. Puedes volver atrás para corregir cualquier dato.</p>

      <div class="publish-preview">
        <div class="publish-hero">
          <img src="${draft.images[0] || PLACEHOLDER_IMAGE}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
          <div class="publish-hero-badges">${draft.types.map((t) => html`<span class="badge badge-dark">${icon('ball', 'icon icon-sm')} ${fieldTypeLabel(t)}</span>`)}</div>
          ${draft.images.length > 1 ? html`<span class="publish-photos">${icon('image', 'icon icon-sm')} ${draft.images.length} fotos</span>` : draft.images.length === 0 ? html`<span class="publish-photos is-warning">${icon('image', 'icon icon-sm')} Sin fotos</span>` : ''}
        </div>
        <div class="publish-body">
          <div class="publish-title">
            <div>
              <h3>${draft.name}</h3>
              <p class="text-muted text-small">${icon('mapPin', 'icon icon-sm')} ${draft.address} · ${draft.district}, ${draft.province}</p>
            </div>
            <div class="publish-price">${formatPrice(draft.pricePerHour)}<small>por hora</small></div>
          </div>

          <div class="publish-grid">
            <div class="publish-item">
              <span class="publish-item-icon">${icon('whatsapp', 'icon icon-sm')}</span>
              <div><span class="publish-item-label">WhatsApp de contacto</span><strong>${draft.whatsapp || 'No indicado'}</strong></div>
            </div>
            <div class="publish-item">
              <span class="publish-item-icon">${icon('map', 'icon icon-sm')}</span>
              <div><span class="publish-item-label">Ubicación</span><strong>${draft.district}, ${draft.province}, ${draft.department}</strong></div>
            </div>
            <div class="publish-item">
              <span class="publish-item-icon">${icon('navigation', 'icon icon-sm')}</span>
              <div><span class="publish-item-label">Coordenadas</span><strong>${draft.latitude && draft.longitude ? `${Number(draft.latitude).toFixed(5)}, ${Number(draft.longitude).toFixed(5)}` : 'Del distrito'}</strong></div>
            </div>
            <div class="publish-item">
              <span class="publish-item-icon">${icon('info', 'icon icon-sm')}</span>
              <div><span class="publish-item-label">Referencia</span><strong>${draft.reference || '—'}</strong></div>
            </div>
          </div>

          <div class="publish-section">
            <span class="publish-item-label">Servicios</span>
            ${activeServices.length
              ? html`<div class="services-list">${activeServices.map((sv) => html`<span class="service-chip">${icon(sv.icon)} ${sv.label}</span>`)}</div>`
              : html`<p class="text-muted text-small">Sin servicios marcados.</p>`}
          </div>

          <div class="publish-section">
            <span class="publish-item-label">Horario de atención</span>
            <div class="publish-schedule">
              ${WEEKDAYS.map((d) => {
                const day = draft.schedule[d.key];
                return html`<div class="publish-day ${day.closed ? 'is-closed' : ''}"><span>${d.short}</span><strong>${day.closed ? 'Cerrado' : `${day.open} – ${day.close}`}</strong></div>`;
              })}
            </div>
            <p class="text-xs text-muted mt-1">Abre ${openDays.length} ${openDays.length === 1 ? 'día' : 'días'} a la semana · horarios en bloques de 1 hora.</p>
          </div>
        </div>
      </div>

      <div class="publish-note">
        ${icon('checkCircle', 'icon')}
        <span>${editing ? 'Al guardar, los cambios se verán de inmediato en la página de la cancha.' : 'Al publicar, tu cancha aparecerá en los resultados de búsqueda y los jugadores podrán reservar.'}</span>
      </div>`;
    },
  ];

  function pricePreview(price) {
    const p = Number(price) || 0;
    return [1, 2, 3].map((h) => html`<div><strong>${formatPrice(p * h)}</strong>${h} ${h === 1 ? 'hora' : 'horas'}</div>`);
  }

  // ---- Dibujo ----
  function draw() {
    render(root, OwnerLayout(html`
      <div class="wizard">
        <div class="owner-header">
          <h1>${editing ? 'Editar cancha' : 'Publicar una cancha'}</h1>
          <a href="#/propietario/canchas" class="btn btn-ghost btn-sm">Cancelar</a>
        </div>
        <div class="wizard-progress">${STEPS.map((_, i) => html`<span class="${i <= step ? 'done' : ''}"></span>`)}</div>
        <div class="card">
          <div class="card-body">
            <span class="wizard-step-label">Paso ${step + 1} de ${STEPS.length}</span>
            <h2>${STEPS[step]}</h2>
            <div data-form-error></div>
            <form data-wizard-form novalidate>${stepViews[step]()}</form>
            <div class="wizard-actions">
              <button type="button" class="btn btn-outline" data-prev ${step === 0 ? 'disabled' : ''}>${icon('arrowLeft', 'icon icon-sm')} Atrás</button>
              ${step < STEPS.length - 1
                ? html`<button type="button" class="btn btn-primary" data-next>Siguiente ${icon('arrowRight', 'icon icon-sm')}</button>`
                : html`<button type="button" class="btn btn-primary btn-lg" data-publish>${icon('check')} ${editing ? 'Guardar cambios' : 'Publicar cancha'}</button>`}
            </div>
          </div>
        </div>
      </div>`));
    bindEvents();
  }

  function showError(message) {
    render($('[data-form-error]', root), message ? html`<div class="form-error">${message}</div>` : '');
  }

  function bindEvents() {
    const form = $('[data-wizard-form]', root);

    // Guarda en el borrador cualquier campo con atributo name
    form.addEventListener('input', (e) => {
      const { name, value, type } = e.target;
      if (!name) return;
      if (name === 'services' || name === 'types') {
        draft[name] = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((c) => c.value);
      } else if (type === 'radio') {
        if (e.target.checked) draft[name] = value;
      } else {
        draft[name] = value;
      }
      if (name === 'pricePerHour') render($('[data-price-preview]', root), pricePreview(value));
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'services' || e.target.name === 'types') draft[e.target.name] = Array.from(form.querySelectorAll(`input[name="${e.target.name}"]:checked`)).map((c) => c.value);
      if (e.target.type === 'radio' && e.target.checked) draft[e.target.name] = e.target.value;

      // Horarios
      const { day, prop } = e.target.dataset;
      if (day && prop) {
        draft.schedule[day][prop] = prop === 'closed' ? e.target.checked : e.target.value;
        if (prop === 'closed') draw();
      }
    });

    $('[data-prev]', root).addEventListener('click', () => { step -= 1; draw(); });
    $('[data-next]', root)?.addEventListener('click', () => {
      const error = validateStep();
      if (error) { showError(error); return; }
      step += 1;
      draw();
    });

    $('[data-publish]', root)?.addEventListener('click', async () => {
      const btn = $('[data-publish]', root);
      btn.disabled = true;
      try {
        if (editing) {
          await updateField(existing.id, user.id, draft);
          showToast('Cambios guardados', 'success');
          navigate('/propietario/canchas');
        } else {
          const field = await createField(user.id, draft);
          showToast('¡Cancha publicada!', 'success');
          navigate(`/propietario/calendario`, { field: field.id });
        }
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
      }
    });

    // ---- Paso Ubicación: mapa interactivo + departamento → provincia → distrito ----
    let fieldMap = null;
    const coordsLabel = $('[data-map-coords]', root);
    const showCoords = (lat, lng) => { if (coordsLabel) coordsLabel.textContent = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`; };

    /** Escribe la dirección obtenida del mapa en el input "Dirección" (el propietario puede editarla después) */
    let reverseTimer = null;
    const fillAddressFromCoords = (lat, lng) => {
      clearTimeout(reverseTimer);
      const hint = $('[data-address-hint]', root);
      if (hint) hint.textContent = 'Buscando la dirección de este punto…';
      reverseTimer = setTimeout(async () => {
        try {
          const result = await reverseGeocode(Number(lat), Number(lng));
          const addressInput = $('#address', root);
          if (result?.address && addressInput) {
            addressInput.value = result.address;
            draft.address = result.address;
            if (hint) hint.textContent = `Dirección obtenida del mapa: ${result.full.split(',').slice(0, 3).join(',')}. Corrígela si hace falta.`;
          } else if (hint) {
            hint.textContent = 'No encontramos una dirección exacta para ese punto. Escríbela a mano.';
          }
        } catch {
          if (hint) hint.textContent = 'No se pudo obtener la dirección (sin conexión). Escríbela a mano.';
        }
      }, 500);
    };

    /**
     * Guarda las coordenadas en el borrador, en los inputs y (opcionalmente) mueve el marcador.
     * manual=true → el propietario fijó el punto (arrastre, clic, búsqueda, GPS o inputs): también se completa la dirección.
     */
    const applyCoords = (lat, lng, { moveMarker = true, zoom, manual = true } = {}) => {
      draft.latitude = lat;
      draft.longitude = lng;
      if (manual) draft.latitudeManual = true;
      showCoords(lat, lng);
      if (moveMarker && fieldMap) fieldMap.setPosition(Number(lat), Number(lng), zoom);
      if (manual) fillAddressFromCoords(lat, lng);
    };

    const mapContainer = $('[data-map="field-form"]', root);
    if (mapContainer) {
      const start = Number(draft.latitude) && Number(draft.longitude)
        ? { lat: Number(draft.latitude), lng: Number(draft.longitude) }
        : getCoordinates(draft) || {};
      fieldMap = mountLocationMap(mapContainer, {
        lat: start.lat,
        lng: start.lng,
        zoom: Number(draft.latitude) ? 16 : 13,
        draggable: true,
        onChange: (lat, lng) => applyCoords(lat, lng, { moveMarker: false }),
      });
    }

    bindLocationPicker(form, (loc) => {
      Object.assign(draft, loc);
      // Centramos el mapa en el lugar elegido si el propietario aún no fijó un punto exacto
      const coords = getCoordinates(loc);
      if (coords && !draft.latitudeManual) applyCoords(coords.lat, coords.lng, { zoom: loc.district ? 14 : loc.province ? 12 : 9, manual: false });
    });

    // Búsqueda de direcciones (geocodificación)
    const searchInput = $('[data-map-search]', root);
    const resultsList = $('[data-map-results]', root);
    const runSearch = async () => {
      const q = searchInput.value.trim();
      if (!q) return;
      const scope = [draft.district, draft.province, draft.department].filter(Boolean).join(', ');
      try {
        render(resultsList, html`<li><span class="text-muted text-small" style="padding:8px 10px;display:block">Buscando…</span></li>`);
        resultsList.hidden = false;
        const results = await geocodeAddress(scope && !q.toLowerCase().includes(draft.department?.toLowerCase() || '#') ? `${q}, ${scope}` : q);
        const list = results.length ? results : await geocodeAddress(q);
        if (!list.length) { render(resultsList, html`<li><span class="text-muted text-small" style="padding:8px 10px;display:block">No encontramos esa dirección. Mueve el marcador manualmente.</span></li>`); return; }
        render(resultsList, list.map((r) => html`<li><button type="button" data-geo-lat="${r.lat}" data-geo-lng="${r.lng}">${icon('mapPin', 'icon icon-sm')}<span><strong>${r.label.split(',')[0]}</strong><small>${r.label.split(',').slice(1, 4).join(',')}</small></span></button></li>`));
        resultsList.querySelectorAll('[data-geo-lat]').forEach((btn) =>
          btn.addEventListener('click', () => {
            applyCoords(Number(btn.dataset.geoLat), Number(btn.dataset.geoLng), { zoom: 17 });
            resultsList.hidden = true;
            showToast('Marcador colocado. Ajústalo si hace falta.', 'success');
          })
        );
      } catch (err) {
        resultsList.hidden = true;
        showToast(err.message, 'error');
      }
    };
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } if (e.key === 'Escape') resultsList.hidden = true; });
      $('[data-map-search-btn]', root)?.addEventListener('click', runSearch);
      document.addEventListener('click', (e) => { if (!e.target.closest('.map-search')) resultsList.hidden = true; });
      if (!leafletReady()) searchInput.disabled = true;
    }

    // Geolocalización del navegador
    $('[data-geolocate]', root)?.addEventListener('click', () => {
      if (!navigator.geolocation) { showToast('Tu navegador no soporta geolocalización', 'error'); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { applyCoords(Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6)), { zoom: 17 }); showToast('Ubicación obtenida', 'success'); },
        () => showToast('No se pudo obtener la ubicación', 'error')
      );
    });

    // Paso Fotografías
    $('[data-file-input]', root)?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        try {
          draft.images.push(await fileToResizedDataURL(file));
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
      draw();
    });
    $('[data-url-add]', root)?.addEventListener('click', () => {
      const input = $('[data-url-input]', root);
      const url = input.value.trim();
      if (!/^https?:\/\//.test(url)) { showToast('Ingresa una URL válida que empiece con http', 'error'); return; }
      draft.images.push(url);
      draw();
    });
    root.querySelectorAll('[data-remove-photo]').forEach((btn) =>
      btn.addEventListener('click', () => { draft.images.splice(Number(btn.dataset.removePhoto), 1); draw(); })
    );

    // Paso Horarios
    $('[data-copy-monday]', root)?.addEventListener('click', () => {
      const monday = draft.schedule.mon;
      WEEKDAYS.forEach((d) => { draft.schedule[d.key] = { ...monday }; });
      draw();
      showToast('Horario del lunes copiado a toda la semana');
    });
  }

  draw();
}
