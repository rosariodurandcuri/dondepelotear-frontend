# ChapaTuCancha — MVP

Plataforma web para encontrar y reservar canchas de fútbol 7 y fútbol 11 en **todo el Perú** (preparada para otros países).

El proyecto tiene dos partes:

- **Frontend** (esta carpeta): página única en JavaScript sin dependencias. Se sirve con `python3 serve.py`.
- **Backend + base de datos** ([`server/`](server/README.md)): API en **Bun + Elysia + Prisma + PostgreSQL** con las **167 canchas reales del Perú** de `server/prisma/data/canchas-peru.json`.

## Ejecutar

1. Base de datos y API (ver [server/README.md](server/README.md) para instalar PostgreSQL o usar Docker):

```bash
cd server && cp .env.example .env && bun install && bun run db:migrate && bun run db:seed && bun run dev
```

2. Frontend, en otra terminal:

```bash
python3 serve.py
```

Abre **http://localhost:5173** en tu navegador. La API corre en `http://localhost:3000` (cámbiala en `src/config/app.js → apiUrl` o definiendo `window.CHAPA_API_URL` antes de cargar la app).

> ¿Por qué un servidor y no abrir `index.html` directo? Porque el proyecto usa módulos de JavaScript (`import`/`export`) y los navegadores los bloquean cuando se abren desde `file://`.
> Cualquier servidor estático funciona igual (`npx serve`, extensión *Live Server* de VS Code, Netlify, Vercel, GitHub Pages…).

## Cuentas de prueba

| Rol          | Correo                 | Qué ver                                   |
|--------------|------------------------|-------------------------------------------|
| Jugador      | `jugador@demo.com`     | "Mis reservas" con reservas de ejemplo     |
| Propietario  | `propietario@demo.com` | Panel con 3 canchas reales de Lima (Deporzeta, Marceti Club, Sport Plaza), calendario, reservas |
| Propietario  | `rosa@demo.com`        | 3 canchas en Lima                          |
| Propietario  | `miguel@demo.com`      | Canchas de Arequipa                        |
| Propietario  | `karina@demo.com`      | Canchas de Trujillo, Piura y Chiclayo      |
| Propietario  | `jose@demo.com`        | Canchas de Cusco y Callao                  |
| Propietario  | `directorio@demo.com`  | Resto del directorio (canchas sin reclamar) |
| Administrador| `admin@demo.com`       | Panel de administración                    |

Contraseña de todas las cuentas: **`demo1234`**. Reservar **no requiere** cuenta.

Los datos viven en PostgreSQL. `bun run db:seed` (en `server/`) borra todo y vuelve a cargar las canchas reales, las cuentas de prueba y reservas de ejemplo relativas a hoy.

## Datos reales

`server/prisma/data/canchas-peru.json` contiene **167 locales** recopilados de directorios públicos (Lima 132, Callao 10, La Libertad 8, Arequipa 6, Cusco 6, Lambayeque 3, Piura 2) con dirección, distrito, teléfonos, tipos (F5–F11), superficie, servicios y, cuando lo publican, precio por hora (35 locales) y horario (16). Cada registro guarda su `source`.

- Las canchas **sin precio publicado** se muestran con "Consultar precio": no se reservan en línea, solo se contacta por WhatsApp/teléfono (la API rechaza la reserva). Cuando el propietario edita la cancha y pone precio, pasa a ser reservable.
- Sin horario publicado se usa uno referencial (08:00–23:00) y se avisa en la descripción.
- Coordenadas: las del distrito (`src/config/locations.js`); el propietario puede afinarlas en el mapa al editar.
- No hay fotos ni reseñas inventadas: las canchas aparecen como "Nuevo" hasta que los jugadores opinen.

## Librerías por CDN (sin npm)

- **Lucide Icons** (`unpkg.com/lucide@1.46.0`): todos los iconos de la interfaz. `icon('search')` en `components/icons.js` genera `<i data-lucide="search">`; `render()` los convierte a SVG. Si el CDN no carga, se usan los SVG de respaldo del mismo archivo.
- **Leaflet 1.9.4 + OpenStreetMap**: mapa interactivo sin clave de API (`components/LocationMap.js`). El propietario busca una dirección (geocodificación Nominatim), mueve el mapa y arrastra el marcador; el jugador ve la ubicación real en el detalle. Sin internet se muestra un mapa ilustrativo.
- **Contacto por WhatsApp**: cada cancha tiene `whatsapp` (o hereda el del propietario). El detalle muestra "Contactar por WhatsApp" (`wa.me` con mensaje automático, `utils/format.js → whatsappLink`). El propietario lo edita en *Panel → Ajustes* (`pages/owner/OwnerSettingsPage.js`).
- **Dirección desde el mapa**: al mover el marcador, buscar un lugar o usar el GPS, `reverseGeocode()` (Nominatim) escribe la dirección en el input, que sigue siendo editable.
- **Acceso con Google / Facebook**: botones simulados (`components/SocialLogin.js`, `authService.loginWithProvider`). En producción se conectan a OAuth real.

## Inicio y cercanía

- El buscador del inicio solo pide **dónde** y **cuándo**; el resto de filtros (tipo, hora, precio, servicios, calificación) están en la página de resultados.
- Al entrar, la app pide la ubicación del navegador (`services/geoService.js`, guardada por sesión). Si el usuario acepta, el inicio muestra **"Canchas cerca de ti"** ordenadas por distancia y los resultados se ordenan por cercanía por defecto; si no, se muestran las destacadas y la búsqueda por ubicación funciona igual.
- Las tarjetas son clickeables por completo (enlace superpuesto) e incluyen el icono de WhatsApp del propietario y el corazón de favoritos, que funcionan de forma independiente.

## Reservas con varios horarios

En el detalle solo se listan los horarios **disponibles**. El jugador puede marcar varios, consecutivos o no (ej. 10:00-11:00 y 14:00-15:00, máximo `maxHoursPerBooking`). La reserva guarda `slots` (bloques `{ startTime, endTime }`), `hours` y `totalPrice`; `startTime`/`endTime` se mantienen por compatibilidad (primer inicio / último fin).

## Búsqueda nacional

- **Texto libre** ("Lima", "san miguel", "Trujillo", "Cusco"): `findLocation()` en `config/locations.js` lo interpreta y lo convierte en departamento/provincia/distrito (prefiere el nivel más amplio: "Lima" = todo el departamento).
- **Selección progresiva** Departamento → Provincia → Distrito (`components/LocationPicker.js`) en el buscador, los filtros y el formulario del propietario.
- Todos los filtros se combinan (AND): ubicación + tipo + precio + fecha + hora + disponibilidad + calificación + servicios.
- Si se elige una **fecha**, solo se muestran canchas con al menos un horario libre ese día (`strictDate`). Si no hay, la página ofrece buscar el día siguiente.
- **Más cercanas**: distancia desde tu posición (botón "Cerca de mí", usa la geolocalización del navegador) o, si no, desde el lugar buscado.

## Estructura del proyecto

```
index.html                  Página única; carga estilos y src/main.js
serve.py                    Servidor local (python3 serve.py)
assets/                     Favicon e imagen de reemplazo
src/
  main.js                   Arranque: datos de prueba, cabecera, pie y rutas
  router.js                 Navegación por hash (#/buscar, #/cancha/f1, …)
  config/
    app.js                  Nombre de la app, país, límites de reserva
    countries.js            Moneda, idioma y teléfono por país
    locations.js            Departamentos → provincias → distritos del Perú (con coordenadas) + búsqueda de lugares
    constants.js            Tipos de cancha, servicios, estados, rangos de precio
  services/                 Llamadas a la API (server/); las páginas no saben de HTTP
    api.js                  Cliente fetch: URL base, token de sesión, errores { error }
    authService.js          Sesión (JWT), registro, perfil
    fieldService.js         Búsqueda, detalle, crear/editar canchas
    availabilityService.js  Horarios del día, bloquear / liberar
    bookingService.js       Crear, consultar y cancelar reservas
    favoriteService.js      Favoritos (local + sincronizados con la API)
    paymentService.js       Métodos de pago que se muestran (el cobro lo hace la API)
    reviewService.js        Reseñas
  utils/
    dom.js                  Plantillas html`` seguras y helpers
    dates.js                Fechas "YYYY-MM-DD" y horas "HH:MM" en español
    format.js               Moneda, validaciones, distancia
    images.js               Reducción de fotos subidas
  components/               Piezas reutilizables (Header, FieldCard, TimeSlots, LocationPicker, …)
  pages/                    Una función por pantalla
    owner/                  Panel del propietario
    admin/                  Panel de administración (base)
  styles/
    variables.css           Paleta y tipografía (identidad visual)
    base.css / components.css / pages.css / owner.css
```

## Tareas frecuentes

**Cambiar el nombre** → `src/config/app.js` (`name`, `codePrefix`) y el `<title>` de `index.html`.

**Agregar una cancha** → desde la app: entra como propietario → *Publicar cancha*. Para agregarla al catálogo inicial, añade un registro a `server/prisma/data/canchas-peru.json` (el `district` debe existir en `locations.js`) y ejecuta `bun run db:seed`.
(Desde la app: entra como propietario → *Publicar cancha*.)

**Cambiar precios** → desde el panel → *Mis canchas* → *Editar* → paso 4 (o `pricePerHour` en el JSON + `db:seed`).

**Cambiar horarios** → `schedule` de la cancha (`{ mon: { open: '08:00', close: '23:00', closed: false }, … }`), o desde el panel → *Editar* → paso 6. Para bloquear horas sueltas usa el *Calendario*.

**Agregar un tipo de cancha** → `FIELD_TYPES` en `src/config/constants.js` y el enum `FieldType` en `server/prisma/schema.prisma` (+ `FIELD_TYPES` en `server/src/config/app.ts`), luego `bun run db:migrate`.

**Agregar un servicio nuevo** → `SERVICES` en `src/config/constants.js` (aparece solo en filtros, detalle y formulario).

**Agregar distritos o provincias** → `src/config/locations.js` (un distrito puede ser solo el nombre o `{ name, lat, lng }`).

**Agregar otro país** → moneda en `countries.js` y su árbol de ubicaciones en `locations.js` (`COUNTRY_LOCATIONS`).

## Modelo de datos

Tablas en PostgreSQL (`server/prisma/schema.prisma`):

- **users** `id, name, email, passwordHash, phone, whatsapp, role (player|owner|admin)`
- **fields** `id, ownerId, name, description, types[] (F5|F6|F7|F8|F9|F11), whatsapp, phones[], pricePerHour (null = no publicado), priceMax, address, reference, department, province, district, latitude, longitude, images[], services[], schedule, surface, courts, notes, source, status, approvalStatus`
- **availability** `id, fieldId, date, startTime, endTime, status (BOOKED|BLOCKED), bookingId` — solo guarda excepciones; lo demás dentro del horario es `AVAILABLE`
- **bookings** `id, userId, fieldId, date, startTime, endTime, totalPrice, status, bookingCode, customer, paymentMethod, paymentStatus`
- **reviews** `id, userId, fieldId, rating, comment` (una por usuario y cancha)
- **favorites** `userId, fieldId`

## De MVP a plataforma real

1. ~~**Backend + base de datos**~~ ✅ Hecho en `server/`; el frontend ya consume la API (`src/services/api.js`).
2. ~~**Doble reserva**~~ ✅ Restricción `UNIQUE` + transacción en `server/src/routes/bookings.ts`.
3. ~~**Autenticación real**~~ ✅ Contraseñas con hash + JWT y rutas protegidas por rol. Google/Facebook siguen simulados (`POST /auth/provider`).
4. **Pagos**: integra Mercado Pago, Culqi o Niubiz desde el backend (nunca claves privadas en el frontend). Yape/Plin vía QR + confirmación.
5. **Fotos** a un almacenamiento (S3, Cloudinary, Supabase Storage) y guardar la URL.
6. **Mapa real**: Google Maps o Mapbox en `MapPreview.js`; las coordenadas ya están en cada cancha.
7. **Notificaciones**: correo/WhatsApp al confirmar y recordatorios.
8. **Administración**: aprobación de canchas (`approvalStatus: PENDING` al crear), reportes, comisiones.
9. **Dominio, HTTPS y despliegue** (Netlify/Vercel para el frontend).
