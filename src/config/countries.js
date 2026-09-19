/**
 * CONFIGURACIÓN POR PAÍS (moneda, idioma, teléfono)
 * --------------------------------------------------
 * Las ubicaciones (departamento → provincia → distrito) están en locations.js.
 * Para expandir a otro país: agrega una entrada aquí y su árbol de ubicaciones allá.
 */
export const COUNTRIES = {
  PE: {
    code: 'PE',
    name: 'Perú',
    currency: 'PEN',
    currencySymbol: 'S/',
    locale: 'es-PE',
    phoneCode: '+51',
    timezone: 'America/Lima',
    /** Centro por defecto para ordenar por distancia cuando no hay ubicación elegida */
    center: { lat: -12.0464, lng: -77.0428 },
  },
};

/** Quita acentos y mayúsculas para comparar textos: "Áncash" → "ancash" */
export function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
