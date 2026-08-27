/** Ventana, en ms desde el arranque del documento, en la que se considera que
 *  la app todavía está haciendo su primer render de la sesión. */
const COLD_START_MS = 1500;

/**
 * Si la entrada escalonada de las tarjetas debe reproducirse.
 *
 * La animación es una bienvenida, no un efecto de navegación: volver al
 * Dashboard desde el dock por décima vez no debería re-animar toda la pantalla.
 * Se resuelve con el reloj del documento en vez de un flag de módulo porque así
 * es idempotente — el doble render de StrictMode en desarrollo devuelve lo
 * mismo las dos veces, y un flag mutable no.
 *
 * Degradación: en un arranque muy lento simplemente no anima.
 */
export function isColdStart(): boolean {
  return typeof performance !== 'undefined' && performance.now() < COLD_START_MS;
}
