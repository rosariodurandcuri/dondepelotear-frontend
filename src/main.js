/**
 * PUNTO DE ENTRADA DE LA APLICACIÓN
 * ---------------------------------
 * 1. Restaura la sesión guardada (valida el token contra la API).
 * 2. Dibuja cabecera y pie de página.
 * 3. Registra las rutas y arranca el router.
 */
import { addRoute, setNotFound, setGuard, startRouter } from './router.js';
import { getCurrentUser, isOwner, isAdmin, restoreSession } from './services/authService.js';
import { renderHeader } from './components/Header.js';
import { renderFooter } from './components/Footer.js';

// Páginas públicas / jugador
import HomePage from './pages/HomePage.js';
import SearchPage from './pages/SearchPage.js';
import FieldDetailPage from './pages/FieldDetailPage.js';
import BookingPage from './pages/BookingPage.js';
import ConfirmationPage from './pages/ConfirmationPage.js';
import BookingDetailPage from './pages/BookingDetailPage.js';
import MyBookingsPage from './pages/MyBookingsPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import OwnerLandingPage from './pages/OwnerLandingPage.js';
import NotFoundPage from './pages/NotFoundPage.js';

// Páginas del propietario
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage.js';
import OwnerFieldsPage from './pages/owner/OwnerFieldsPage.js';
import FieldFormPage from './pages/owner/FieldFormPage.js';
import OwnerCalendarPage from './pages/owner/OwnerCalendarPage.js';
import OwnerBookingsPage from './pages/owner/OwnerBookingsPage.js';
import OwnerSettingsPage from './pages/owner/OwnerSettingsPage.js';

// Administrador (base para el futuro)
import AdminPage from './pages/admin/AdminPage.js';

await restoreSession();
renderHeader(document.getElementById('app-header'));
renderFooter(document.getElementById('app-footer'));

// ---- Rutas ----
addRoute('/', HomePage);
addRoute('/buscar', SearchPage, { title: 'Buscar canchas' });
addRoute('/cancha/:id', FieldDetailPage);
addRoute('/reservar/:fieldId', BookingPage);
addRoute('/reserva-confirmada/:code', ConfirmationPage);
addRoute('/reservas/:code', BookingDetailPage);
addRoute('/mis-reservas', MyBookingsPage, { title: 'Mis reservas' });
addRoute('/login', LoginPage, { title: 'Iniciar sesión' });
addRoute('/registro', RegisterPage, { title: 'Crear cuenta' });
addRoute('/propietarios', OwnerLandingPage, { title: '¿Tienes una cancha?' });

addRoute('/propietario', OwnerDashboardPage, { requiresOwner: true, title: 'Panel de propietario' });
addRoute('/propietario/canchas', OwnerFieldsPage, { requiresOwner: true, title: 'Mis canchas' });
addRoute('/propietario/canchas/nueva', FieldFormPage, { requiresOwner: true, title: 'Publicar cancha' });
addRoute('/propietario/canchas/:id/editar', FieldFormPage, { requiresOwner: true });
addRoute('/propietario/calendario', OwnerCalendarPage, { requiresOwner: true, title: 'Calendario' });
addRoute('/propietario/reservas', OwnerBookingsPage, { requiresOwner: true, title: 'Reservas' });
addRoute('/propietario/ajustes', OwnerSettingsPage, { requiresOwner: true, title: 'Ajustes' });

addRoute('/admin', AdminPage, { requiresAdmin: true });

setNotFound(NotFoundPage);

// Control de acceso: las rutas del propietario requieren sesión con rol owner
setGuard((route, { path }) => {
  const user = getCurrentUser();
  if (route.options.requiresOwner && !isOwner(user)) {
    // Sin sesión → login de propietario. Con sesión de jugador → aviso: solo propietarios publican canchas
    return user ? { path: '/propietarios', query: { soloPropietarios: 1 } } : { path: '/login', query: { next: path, role: 'owner' } };
  }
  if (route.options.requiresAdmin && !isAdmin(user)) return { path: '/login', query: { next: path } };
  return null;
});

startRouter(document.getElementById('app-main'));
