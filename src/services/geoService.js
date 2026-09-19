/**
 * UBICACIÓN DEL USUARIO (geolocalización del navegador)
 * ------------------------------------------------------
 * Se pide una sola vez por sesión y se guarda en sessionStorage para que el
 * inicio y los resultados puedan ordenar por cercanía sin volver a preguntar.
 */
const KEY = 'canchaya:userLocation';

export function getStoredLocation() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    return value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : null;
  } catch {
    return null;
  }
}

function store(value) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}

/** true si el usuario ya rechazó compartir su ubicación en esta sesión */
export function locationWasDenied() {
  return sessionStorage.getItem(`${KEY}:denied`) === '1';
}

/**
 * Pide la ubicación al usuario (el navegador muestra su diálogo de permiso).
 * Devuelve { lat, lng } o null si no la permite / no está disponible.
 */
export function requestUserLocation({ timeout = 8000 } = {}) {
  const cached = getStoredLocation();
  if (cached) return Promise.resolve(cached);
  if (!navigator.geolocation || locationWasDenied()) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const value = { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) };
        store(value);
        resolve(value);
      },
      () => {
        sessionStorage.setItem(`${KEY}:denied`, '1');
        resolve(null);
      },
      { timeout, maximumAge: 5 * 60 * 1000 }
    );
  });
}
