/**
 * CONFIGURACIÓN GENERAL DE LA APLICACIÓN
 * ---------------------------------------
 * Cambia aquí el nombre, el país por defecto y otros valores globales.
 * Este es el único archivo que necesitas tocar para renombrar la plataforma.
 */
import { COUNTRIES } from './countries.js';

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
  apiUrl: (typeof window !== 'undefined' && window.CHAPA_API_URL) || 'http://localhost:3000',
};

/** Devuelve la configuración del país activo (moneda, ciudades, distritos, etc.) */
export function getCountry() {
  return COUNTRIES[APP_CONFIG.defaultCountry];
}
