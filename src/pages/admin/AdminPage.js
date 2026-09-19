/**
 * PANEL DE ADMINISTRACIÓN (base para el futuro)
 * ---------------------------------------------
 * Muestra usuarios, canchas y reservas, y permite aprobar/ocultar canchas.
 * Está preparado para crecer: reportes, moderación, comisiones, etc.
 */
import { html, render } from '../../utils/dom.js';
import { showToast } from '../../components/Toast.js';
import { adminGetAllFields, adminSetApproval, adminSetStatus } from '../../services/fieldService.js';
import { adminGetAllBookings } from '../../services/bookingService.js';
import { adminGetAllUsers } from '../../services/authService.js';
import { FIELD_STATUS, APPROVAL_STATUS, fieldTypesLabel } from '../../config/constants.js';
import { formatPrice, formatLocation, formatBookingSlots } from '../../utils/format.js';
import { formatDateShort } from '../../utils/dates.js';
import { statusBadge } from '../BookingDetailPage.js';

export default async function AdminPage(root, { query }) {
  const tab = query.tab || 'fields';
  const users = await adminGetAllUsers();
  const fields = await adminGetAllFields();
  const bookings = await adminGetAllBookings();

  const tables = {
    users: html`<table class="table"><thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Registro</th></tr></thead>
      <tbody>${users.map((u) => html`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone || '—'}</td><td><span class="badge badge-gray">${u.role}</span></td><td>${formatDateShort(u.createdAt.slice(0, 10))}</td></tr>`)}</tbody></table>`,

    fields: html`<table class="table"><thead><tr><th>Cancha</th><th>Tipo</th><th>Distrito</th><th>Propietario</th><th>Precio</th><th>Aprobación</th><th>Visibilidad</th><th>Acciones</th></tr></thead>
      <tbody>${fields.map((f) => html`<tr>
        <td><a href="#/cancha/${f.id}" style="color:var(--green-700);font-weight:600">${f.name}</a></td>
        <td>${fieldTypesLabel(f)}</td><td>${formatLocation(f)}</td><td>${f.ownerName}</td><td>${formatPrice(f.pricePerHour)}</td>
        <td>${f.approvalStatus === APPROVAL_STATUS.APPROVED ? html`<span class="badge badge-green">Aprobada</span>` : f.approvalStatus === APPROVAL_STATUS.REJECTED ? html`<span class="badge badge-red">Rechazada</span>` : html`<span class="badge badge-amber">Pendiente</span>`}</td>
        <td>${f.status === FIELD_STATUS.PUBLISHED ? html`<span class="badge badge-green">Publicada</span>` : html`<span class="badge badge-gray">Oculta</span>`}</td>
        <td>
          ${f.approvalStatus !== APPROVAL_STATUS.APPROVED ? html`<button class="btn btn-soft btn-sm" data-approve="${f.id}">Aprobar</button>` : html`<button class="btn btn-ghost btn-sm" data-reject="${f.id}">Rechazar</button>`}
          ${f.status === FIELD_STATUS.PUBLISHED ? html`<button class="btn btn-ghost btn-sm" data-hide="${f.id}">Ocultar</button>` : html`<button class="btn btn-ghost btn-sm" data-show="${f.id}">Mostrar</button>`}
        </td></tr>`)}</tbody></table>`,

    bookings: html`<table class="table"><thead><tr><th>Código</th><th>Cancha</th><th>Cliente</th><th>Fecha</th><th>Horario</th><th>Monto</th><th>Estado</th></tr></thead>
      <tbody>${bookings.map((b) => html`<tr><td class="text-xs">${b.bookingCode}</td><td>${b.field?.name}</td><td>${b.customer.firstName} ${b.customer.lastName}</td><td>${formatDateShort(b.date)}</td><td>${formatBookingSlots(b, ", ")}</td><td>${formatPrice(b.totalPrice)}</td><td>${statusBadge(b.displayStatus)}</td></tr>`)}</tbody></table>`,
  };

  render(root, html`
    <div class="container page admin-tabs">
      <h1 class="page-title">Administración</h1>
      <p class="page-subtitle">Vista general de la plataforma. Preparada para agregar reportes y moderación.</p>
      <div class="stats-grid">
        <div class="card stat-card"><span class="stat-value">${users.length}</span><span class="stat-label">Usuarios</span></div>
        <div class="card stat-card"><span class="stat-value">${users.filter((u) => u.role === 'owner').length}</span><span class="stat-label">Propietarios</span></div>
        <div class="card stat-card"><span class="stat-value">${fields.length}</span><span class="stat-label">Canchas</span></div>
        <div class="card stat-card"><span class="stat-value">${bookings.length}</span><span class="stat-label">Reservas</span></div>
      </div>
      <div class="tabs">
        ${[['fields', 'Canchas'], ['users', 'Usuarios'], ['bookings', 'Reservas']].map(([id, label]) => html`<a class="tab ${tab === id ? 'active' : ''}" href="#/admin?tab=${id}">${label}</a>`)}
      </div>
      <div class="card"><div class="table-wrap">${tables[tab] || tables.fields}</div></div>
    </div>`);

  const act = async (selector, fn, msg) => {
    root.querySelectorAll(selector).forEach((btn) =>
      btn.addEventListener('click', async () => {
        await fn(btn.dataset.approve || btn.dataset.reject || btn.dataset.hide || btn.dataset.show);
        showToast(msg, 'success');
        AdminPage(root, { query });
      })
    );
  };
  act('[data-approve]', (id) => adminSetApproval(id, APPROVAL_STATUS.APPROVED), 'Cancha aprobada');
  act('[data-reject]', (id) => adminSetApproval(id, APPROVAL_STATUS.REJECTED), 'Cancha rechazada');
  act('[data-hide]', (id) => adminSetStatus(id, FIELD_STATUS.HIDDEN), 'Cancha oculta');
  act('[data-show]', (id) => adminSetStatus(id, FIELD_STATUS.PUBLISHED), 'Cancha visible');
}
