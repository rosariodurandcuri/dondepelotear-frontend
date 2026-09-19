/**
 * DASHBOARD DEL PROPIETARIO — resumen de canchas, reservas de hoy e ingresos.
 */
import { html, render } from '../../utils/dom.js';
import { icon } from '../../components/icons.js';
import { OwnerLayout, StatCard } from '../../components/OwnerLayout.js';
import { getCurrentUser } from '../../services/authService.js';
import { getOwnerStats } from '../../services/bookingService.js';
import { getFieldsByOwner } from '../../services/fieldService.js';
import { formatPrice, formatBookingSlots } from '../../utils/format.js';
import { formatDateShort, formatDateLong, todayISO } from '../../utils/dates.js';
import { EmptyState } from '../../components/EmptyState.js';

export default async function OwnerDashboardPage(root) {
  const user = getCurrentUser();
  const stats = await getOwnerStats(user.id);
  const fields = await getFieldsByOwner(user.id);

  const agendaItem = (b) => html`
    <div class="agenda-item">
      <span class="agenda-time">${formatBookingSlots(b, ", ")}</span>
      <div class="agenda-info">
        <strong>${b.customer.firstName} ${b.customer.lastName}</strong>
        <span>${b.field.name}${b.date !== todayISO() ? ` · ${formatDateShort(b.date)}` : ''} · ${b.customer.phone}</span>
      </div>
      <strong>${formatPrice(b.totalPrice)}</strong>
    </div>`;

  render(root, OwnerLayout(html`
    <div class="owner-header">
      <div>
        <h1>Hola, ${user.name.split(' ')[0]}</h1>
        <p class="text-muted text-small">${formatDateLong(todayISO())}</p>
      </div>
      <a href="#/propietario/canchas/nueva" class="btn btn-primary">${icon('plus')} Publicar cancha</a>
    </div>

    ${fields.length ? html`
      <div class="stats-grid">
        ${StatCard({ iconName: 'ball', value: stats.fieldCount, label: 'Mis canchas' })}
        ${StatCard({ iconName: 'calendar', value: stats.todayCount, label: 'Reservas hoy' })}
        ${StatCard({ iconName: 'clock', value: stats.upcomingCount, label: 'Próximas reservas' })}
        ${StatCard({ iconName: 'money', value: formatPrice(stats.todayIncome), label: 'Ingresos del día' })}
      </div>

      <div class="card mb-2">
        <div class="card-body">
          <div class="flex justify-between items-center mb-2">
            <h2 class="card-title" style="margin:0">Reservas de hoy</h2>
            <a href="#/propietario/calendario" class="btn btn-outline btn-sm">Ver calendario</a>
          </div>
          ${stats.todayBookings.length
            ? html`<div class="agenda">${stats.todayBookings.map(agendaItem)}</div>`
            : html`<p class="text-muted">No hay reservas para hoy.</p>`}
        </div>
      </div>

      <div class="card mb-2">
        <div class="card-body">
          <div class="flex justify-between items-center mb-2">
            <h2 class="card-title" style="margin:0">Próximas reservas</h2>
            <a href="#/propietario/reservas" class="btn btn-outline btn-sm">Ver todas</a>
          </div>
          ${stats.upcoming.length
            ? html`<div class="agenda">${stats.upcoming.map(agendaItem)}</div>`
            : html`<p class="text-muted">No hay reservas próximas.</p>`}
        </div>
      </div>

      <div class="card">
        <div class="card-body flex justify-between items-center flex-wrap gap-1">
          <div>
            <div class="text-small text-muted">Ingresos estimados del mes</div>
            <div style="font-size:26px;font-weight:800">${formatPrice(stats.monthIncome)}</div>
          </div>
          <span class="badge badge-green">${icon('trending', 'icon icon-sm')} Reservas confirmadas</span>
        </div>
      </div>`
    : EmptyState({
        iconName: 'ball',
        title: 'Aún no tienes canchas publicadas',
        message: 'Publica tu primera cancha para empezar a recibir reservas.',
        action: html`<a href="#/propietario/canchas/nueva" class="btn btn-primary">Publicar mi primera cancha</a>`,
      })}
  `));
}
