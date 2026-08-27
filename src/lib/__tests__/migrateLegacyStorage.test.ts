// @vitest-environment jsdom
// jsdom solo acá: el resto de la suite es lógica pura y corre en `node`, que es
// más rápido. Este módulo necesita un `localStorage` de verdad.
import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLegacyStorage } from '../migrateLegacyStorage';

/** El prefijo viejo, escrito acá a mano para que el test falle si alguien
 *  cambia el de producción sin querer. */
const OLD = 'traintrack_';
const NEW = 'alfallo_';

describe('migrateLegacyStorage', () => {
  beforeEach(() => localStorage.clear());

  it('copia los datos del prefijo viejo al nuevo', () => {
    localStorage.setItem(`${OLD}workouts`, '[{"id":"a"}]');
    localStorage.setItem(`${OLD}settings`, '{"weeklyGoal":4}');

    expect(migrateLegacyStorage()).toBe(2);
    expect(localStorage.getItem(`${NEW}workouts`)).toBe('[{"id":"a"}]');
    expect(localStorage.getItem(`${NEW}settings`)).toBe('{"weeklyGoal":4}');
  });

  it('no pisa datos ya escritos con el prefijo nuevo', () => {
    localStorage.setItem(`${OLD}workouts`, '["viejo"]');
    localStorage.setItem(`${NEW}workouts`, '["nuevo"]');

    expect(migrateLegacyStorage()).toBe(0);
    expect(localStorage.getItem(`${NEW}workouts`)).toBe('["nuevo"]');
  });

  it('es idempotente: la segunda corrida no migra nada', () => {
    localStorage.setItem(`${OLD}routines`, '["r"]');

    expect(migrateLegacyStorage()).toBe(1);
    expect(migrateLegacyStorage()).toBe(0);
    expect(localStorage.getItem(`${NEW}routines`)).toBe('["r"]');
  });

  it('deja intactos los datos viejos, por si el usuario vuelve atrás', () => {
    localStorage.setItem(`${OLD}exercises`, '["e"]');

    migrateLegacyStorage();
    expect(localStorage.getItem(`${OLD}exercises`)).toBe('["e"]');
  });

  it('no hace nada en una instalación nueva', () => {
    expect(migrateLegacyStorage()).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('cubre las siete claves, incluida la de modo local', () => {
    const suffixes = [
      'workouts', 'routines', 'exercises', 'settings',
      'initialized', 'active_session', 'local_only',
    ];
    for (const s of suffixes) localStorage.setItem(OLD + s, `v-${s}`);

    expect(migrateLegacyStorage()).toBe(suffixes.length);
    for (const s of suffixes) {
      expect(localStorage.getItem(NEW + s)).toBe(`v-${s}`);
    }
  });
});
