/**
 * AJUSTES DEL PROPIETARIO — nombre, teléfono y número de WhatsApp de contacto.
 * El WhatsApp se usa en el botón "Contactar por WhatsApp" de sus canchas
 * (salvo que una cancha tenga su propio número).
 */
import { html, render, $, formToObject } from '../../utils/dom.js';
import { icon } from '../../components/icons.js';
import { OwnerLayout } from '../../components/OwnerLayout.js';
import { showToast } from '../../components/Toast.js';
import { getCurrentUser, updateProfile } from '../../services/authService.js';
import { getFieldsByOwner, updateField } from '../../services/fieldService.js';

export default async function OwnerSettingsPage(root) {
  const user = getCurrentUser();
  const fields = await getFieldsByOwner(user.id);

  render(root, OwnerLayout(html`
    <div class="owner-header">
      <h1>Ajustes</h1>
    </div>

    <div class="card mb-2">
      <div class="card-body">
        <h2 class="card-title">${icon('user')} Mi perfil</h2>
        <form data-profile-form novalidate>
          <div data-form-error></div>
          <div class="form-group">
            <label class="form-label" for="name">Nombre completo</label>
            <input class="form-control" id="name" name="name" value="${user.name}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="phone">Teléfono</label>
              <input class="form-control" id="phone" name="phone" type="tel" inputmode="numeric" value="${user.phone || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="whatsapp">WhatsApp de contacto</label>
              <div class="input-icon">
                ${icon('whatsapp')}
                <input class="form-control" id="whatsapp" name="whatsapp" type="tel" inputmode="numeric" placeholder="987 654 321" value="${user.whatsapp || user.phone || ''}" />
              </div>
              <span class="form-hint">Número al que escribirán los jugadores desde tus canchas.</span>
            </div>
          </div>
          <label class="checkbox"><input type="checkbox" name="applyAll" checked /> Usar este WhatsApp en todas mis canchas (${fields.length})</label>
          <button type="submit" class="btn btn-primary mt-2">${icon('check')} Guardar cambios</button>
        </form>
      </div>
    </div>

    ${fields.length ? html`
      <div class="card">
        <div class="card-body">
          <h2 class="card-title">${icon('whatsapp')} WhatsApp por cancha</h2>
          <p class="text-muted text-small mb-2">Cada cancha puede tener su propio número. Si lo dejas vacío, se usa el de tu perfil.</p>
          ${fields.map((f) => html`
            <form class="flex gap-1 items-center flex-wrap mb-1" data-field-whatsapp="${f.id}">
              <strong class="flex-1" style="min-width:160px">${f.name}</strong>
              <input class="form-control form-control-sm" name="whatsapp" type="tel" inputmode="numeric" placeholder="${user.whatsapp || user.phone || '987 654 321'}" value="${f.whatsapp || ''}" style="max-width:200px" />
              <button type="submit" class="btn btn-outline btn-sm">Guardar</button>
            </form>`)}
        </div>
      </div>` : ''}
  `));

  const form = $('[data-profile-form]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formToObject(form);
    try {
      await updateProfile({ name: data.name, phone: data.phone, whatsapp: data.whatsapp });
      if (data.applyAll) {
        for (const f of fields) await updateField(f.id, user.id, { whatsapp: data.whatsapp });
      }
      showToast('Ajustes guardados', 'success');
      OwnerSettingsPage(root);
    } catch (err) {
      render($('[data-form-error]', root), html`<div class="form-error">${err.message}</div>`);
    }
  });

  root.querySelectorAll('[data-field-whatsapp]').forEach((f) =>
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await updateField(f.dataset.fieldWhatsapp, user.id, { whatsapp: formToObject(f).whatsapp });
        showToast('Número actualizado', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    })
  );
}
