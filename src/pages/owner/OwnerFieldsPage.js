/**
 * MIS CANCHAS — lista de canchas del propietario con acciones.
 */
import { html, render } from '../../utils/dom.js';
import { icon, starIcon } from '../../components/icons.js';
import { OwnerLayout } from '../../components/OwnerLayout.js';
import { EmptyState } from '../../components/EmptyState.js';
import { showToast } from '../../components/Toast.js';
import { getCurrentUser } from '../../services/authService.js';
import { getFieldsByOwner, setFieldStatus, deleteField } from '../../services/fieldService.js';
import { confirmDialog } from '../../components/Modal.js';
import { FIELD_STATUS, fieldTypesLabel } from '../../config/constants.js';
import { formatPrice, formatFieldPrice, hasPrice, formatRating, formatLocation } from '../../utils/format.js';
import { PLACEHOLDER_IMAGE } from '../../utils/images.js';

export default async function OwnerFieldsPage(root) {
  const user = getCurrentUser();

  const draw = async () => {
    const fields = await getFieldsByOwner(user.id);
    render(root, OwnerLayout(html`
      <div class="owner-header">
        <h1>Mis canchas <span class="text-muted" style="font-weight:500">(${fields.length})</span></h1>
        <a href="#/propietario/canchas/nueva" class="btn btn-primary">${icon('plus')} Publicar cancha</a>
      </div>

      ${fields.length
        ? html`<div class="flex flex-col gap-2">${fields.map((f) => html`
          <article class="card owner-field-card">
            <img src="${f.images?.[0] || PLACEHOLDER_IMAGE}" alt="${f.name}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
            <div class="owner-field-body">
              <div class="flex justify-between items-center gap-1 flex-wrap">
                <h3 style="font-size:18px">${f.name}</h3>
                ${f.status === FIELD_STATUS.PUBLISHED ? html`<span class="badge badge-green">Publicada</span>` : html`<span class="badge badge-gray">Oculta</span>`}
              </div>
              <div class="field-card-meta">${icon('ball')} ${fieldTypesLabel(f)} &nbsp;·&nbsp; ${icon('mapPin')} ${formatLocation(f)} &nbsp;·&nbsp; <span class="rating">${starIcon()} ${formatRating(f.rating)}</span></div>
              <div class="field-card-price">${formatFieldPrice(f)}${hasPrice(f) ? html` <small>/ hora</small>` : ''}</div>
              <div class="owner-field-actions">
                <a href="#/propietario/calendario?field=${f.id}" class="btn btn-soft btn-sm">${icon('calendar', 'icon icon-sm')} Calendario</a>
                <a href="#/propietario/canchas/${f.id}/editar" class="btn btn-outline btn-sm">${icon('edit', 'icon icon-sm')} Editar</a>
                <a href="#/cancha/${f.id}" class="btn btn-outline btn-sm">${icon('eye', 'icon icon-sm')} Ver como jugador</a>
                <button class="btn btn-ghost btn-sm" data-toggle="${f.id}" data-status="${f.status}">
                  ${f.status === FIELD_STATUS.PUBLISHED ? html`${icon('eyeOff', 'icon icon-sm')} Ocultar` : html`${icon('eye', 'icon icon-sm')} Publicar`}
                </button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red-600)" data-delete="${f.id}" data-name="${f.name}">${icon('trash', 'icon icon-sm')} Eliminar</button>
              </div>
            </div>
          </article>`)}</div>`
        : EmptyState({ iconName: 'ball', title: 'Aún no tienes canchas', message: 'Publica tu primera cancha en 7 pasos sencillos.', action: html`<a href="#/propietario/canchas/nueva" class="btn btn-primary">Publicar cancha</a>` })}
    `));

    root.querySelectorAll('[data-toggle]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status === FIELD_STATUS.PUBLISHED ? FIELD_STATUS.HIDDEN : FIELD_STATUS.PUBLISHED;
        try {
          await setFieldStatus(btn.dataset.toggle, user.id, newStatus);
          showToast(newStatus === FIELD_STATUS.PUBLISHED ? 'Cancha publicada' : 'Cancha oculta', 'success');
          draw();
        } catch (err) {
          showToast(err.message, 'error');
        }
      })
    );

    root.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog({ title: 'Eliminar cancha', message: `¿Eliminar "${btn.dataset.name}"? Dejará de aparecer en las búsquedas y se borrarán sus horarios bloqueados. Esta acción no se puede deshacer.`, confirmText: 'Sí, eliminar', danger: true });
        if (!ok) return;
        try {
          await deleteField(btn.dataset.delete, user.id);
          showToast('Cancha eliminada', 'success');
          draw();
        } catch (err) {
          showToast(err.message, 'error');
        }
      })
    );
  };
  await draw();
}
