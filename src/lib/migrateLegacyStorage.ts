/**
 * Migración de las claves de `localStorage` del nombre viejo al nuevo.
 *
 * La app es local-first: para quien la usa sin cuenta, `localStorage` no es una
 * caché, es la base de datos. Renombrar las claves junto con la marca habría
 * dejado los entrenamientos, rutinas y ajustes de todos los usuarios existentes
 * huérfanos bajo un prefijo que ya nadie lee — indistinguible de un borrado.
 *
 * Por eso el prefijo viejo sigue apareciendo acá, y solo acá. Es deliberado: es
 * el único punto del código donde la cadena tiene que sobrevivir para que los
 * datos también lo hagan.
 *
 * La migración copia (no mueve) y nunca pisa una clave nueva que ya exista, así
 * que es idempotente y segura de correr en cada arranque. Los datos viejos se
 * dejan en su sitio a propósito: si el usuario abre una versión anterior de la
 * app —o si algo sale mal acá— sus datos siguen estando.
 */

const LEGACY_PREFIX = 'traintrack_';
const PREFIX = 'alfallo_';

/** Sufijos de las claves, sin prefijo. Debe seguir a `KEYS` en `storage.ts`. */
const SUFFIXES = [
  'workouts',
  'routines',
  'exercises',
  'settings',
  'initialized',
  'active_session',
  'local_only',
] as const;

/**
 * Copia las claves del prefijo viejo al nuevo cuando el nuevo todavía no
 * existe. Llamar una vez, antes del primer render.
 *
 * @returns cuántas claves se migraron (0 en una instalación nueva o ya migrada).
 */
export function migrateLegacyStorage(): number {
  if (typeof localStorage === 'undefined') return 0;

  let migrated = 0;
  for (const suffix of SUFFIXES) {
    const from = LEGACY_PREFIX + suffix;
    const to = PREFIX + suffix;
    try {
      // Ya migrada o escrita por esta versión: no tocar.
      if (localStorage.getItem(to) !== null) continue;
      const value = localStorage.getItem(from);
      if (value === null) continue;
      localStorage.setItem(to, value);
      migrated++;
    } catch {
      // Cuota llena o storage bloqueado: seguir con el resto en vez de abortar
      // la migración entera por una clave.
    }
  }
  return migrated;
}
