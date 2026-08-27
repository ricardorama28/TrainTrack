// Paleta de gráficos. Deriva de la misma restricción que el resto del sistema:
// lima (marca) → ámbar (cálido) → sea (frío) → neutros. Antes había cyan, pink,
// gold y teal sueltos, hues "tech" que no pertenecían a ninguna familia y
// convertían cualquier gráfico en un arcoíris.

/** Lee un token semántico de `index.css` como color CSS resoluble por Recharts,
 *  para que ejes y rejilla sigan el tema sin duplicar valores. */
const token = (name: string) => `rgb(var(${name}))`;

export const CHART = {
  primary: '#84D717',   // primary-500 (lima)
  primaryDim: '#B7F03A',
  accent: '#F85F26',    // accent-500 (ámbar) — reservado a señales, no a series
  /** Serie única de apoyo: tinta. Una sola línea no necesita un color propio. */
  line: token('--c-text-muted'),
  grid: token('--c-hairline'),
  axis: token('--c-text-subtle'),
};

/**
 * Series por grupo muscular es UNA medida comparada entre categorías, no diez
 * series distintas: darle un hue propio a cada músculo era color decorativo,
 * y con diez categorías ningún juego de hues se sostiene. Se codifica por
 * intensidad sobre un solo tono de marca — la barra más alta es la más densa —
 * y la posición sigue haciendo el resto del trabajo.
 */
const RAMP = ['#84D717', '#8FCF35', '#93BE52', '#93AC66', '#8F9C73', '#8B9187'];

/** Color de la barra en la posición `rank` de un ranking de `total` barras. */
export function rampColor(rank: number, total: number): string {
  if (total <= 1) return RAMP[0];
  const i = Math.round((rank / (total - 1)) * (RAMP.length - 1));
  return RAMP[Math.min(i, RAMP.length - 1)];
}
