/**
 * MÉTODOS DE PAGO
 * ---------------
 * El cobro lo procesa la API (server/src/lib/payments.ts, simulado por ahora).
 * Aquí solo se describen los métodos que se muestran en el formulario de reserva.
 * Para integrar Mercado Pago, Culqi, Niubiz, etc., se hace en el backend: nunca
 * pongas claves privadas en el frontend.
 */
export const PAYMENT_METHODS = [
  { id: 'yape', label: 'Yape', description: 'Paga con tu app Yape', enabled: true },
  { id: 'plin', label: 'Plin', description: 'Paga con tu app Plin', enabled: true },
  { id: 'card', label: 'Tarjeta', description: 'Débito o crédito', enabled: true },
  { id: 'onsite', label: 'Pagar en la cancha', description: 'Pagas al llegar', enabled: true },
];

export function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[0];
}
