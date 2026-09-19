/**
 * CONFIGURACIÓN GENERAL DE LA APLICACIÓN
 * ---------------------------------------
 * Cambia aquí el nombre, el país por defecto y otros valores globales.
 * Este es el único archivo que necesitas tocar para renombrar la plataforma.
 */
import { COUNTRIES } from './countries.js';

function resolveApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  if (window.CHAPA_API_URL) return window.CHAPA_API_URL;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
  return `${window.location.protocol}//api.${host.replace(/^www\./, '')}`;
}

export const APP_CONFIG = {
  name: 'ChapaTuCancha',          // Nombre de la marca (aparece en logo, títulos, códigos)
  nameParts: ['Chapa', 'Tu', 'Cancha'], // Partes del nombre en el logo: "Chapa" (verde oscuro) + "Tu" (verde brillante) + "Cancha" (amarillo)
  tagline: 'Encuentra tu próxima cancha',
  codePrefix: 'CTC',              // Prefijo de los códigos de reserva: CTC-2026-00125
  defaultCountry: 'PE',           // País activo. Para expandirse: agregar países en countries.js
  slotDurationMinutes: 60,        // Duración de cada horario reservable (1 hora)
  daysAheadForBooking: 14,        // Cuántos días hacia adelante se puede reservar
  supportWhatsApp: '51999999999', // Número de contacto (ficticio)
  // URL de la API (carpeta server/). En producción pon aquí el dominio del backend, ej. 'https://api.chapatucancha.pe'
  /**
   * URL de la API. En desarrollo apunta a localhost; en producción, a "api." + el dominio
   * de la web (dondepelotear.com → https://api.dondepelotear.com). Se puede forzar con window.CHAPA_API_URL.
   */
  apiUrl: resolveApiUrl(),
};

/** Devuelve la configuración del país activo (moneda, ciudades, distritos, etc.) */
export function getCountry() {
  return COUNTRIES[APP_CONFIG.defaultCountry];
}
