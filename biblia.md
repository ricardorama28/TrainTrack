# TrainTrack — BIBLIA DE ARQUITECTURA

> Fuente de verdad del proyecto. Toda decisión técnica, de producto y de negocio vive acá.
> Antes de implementar cualquier feature, leer este archivo completo.
> El estado de avance (fase/etapa/paso actual) NO vive acá — vive en CLAUDE.md. Acá vive el plan; allá, dónde vamos.

---

## 1. VISIÓN DEL PRODUCTO

App personal para registrar entrenamientos, rutinas y progreso físico. Centraliza en un solo lugar: la biblioteca de ejercicios, las rutinas armadas, el registro día a día de cada workout (series, reps, peso, sensación), el calendario de cumplimiento y un dashboard con rachas y resumen semanal. Funciona **offline-first** y, opcionalmente, sincroniza entre dispositivos del mismo dueño vía Supabase.

**Propuesta de valor:** llevar tu entrenamiento sin fricción — funciona sin internet, sin cuenta y sin servidor; la nube es un extra para tener los mismos datos en el celu y la laptop.

**Modelo de negocio:** ninguno. Es una app personal, no se monetiza. Sin planes pagos, sin anuncios, sin venta de datos.

---

## 2. CONTEXTO DEL USUARIO / EQUIPO

- **Dueño/usuario principal:** una sola persona (el autor), que entrena y registra desde celular y laptop.
- **Alcance de usuarios:** personal hoy, pero **abierto a compartir con conocidos**: un amigo/cliente podría usarla con su **propia cuenta**, con datos completamente aislados por RLS. No hay datos compartidos entre cuentas ni nada colaborativo.
- **Operación:** se despliega como sitio estático (build de Vite). Supabase es opcional: si no se configuran las env vars, la app corre 100% local sin pantalla de login.
- **Preferencia de trabajo:** mobile-first, dark mode por defecto, simplicidad por encima de features. Se prioriza que nada del flujo core dependa de la red.

---

## 3. STACK TÉCNICO

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend / UI | React 19 + TypeScript 6 | Hooks, tipado estático estricto |
| Build / dev | Vite 8 | Build rápido, dev server, salida estática |
| Estilos | Tailwind CSS v3 | Utilitario, mobile-first, dark mode |
| Iconos | lucide-react | Set SVG consistente (ver FASE 2: aún quedan emojis de teclado a migrar) |
| Routing | react-router-dom 7 | Navegación entre páginas |
| Fechas | date-fns 4 | Manejo de fechas/calendario |
| Persistencia base | localStorage (vía `src/lib/storage.ts`) | Síncrono, simple; datos JSON compactos (1–2 MB tras años). Abstracción → puerta a IndexedDB si hiciera falta |
| Auth + Sync (opcional) | Supabase (`@supabase/supabase-js`) | Login (email/password + Google OAuth) y sync en la nube por usuario |
| Deploy | Sitio estático (Vercel u host equivalente) | Build `dist/` servible en cualquier CDN |

**Notas no obvias del stack:**
- La **anon key** de Supabase es pública y va en el frontend; la seguridad la da RLS, no el secreto de la key.
- `npm run build` corre `tsc && vite build`: el type-check es parte del build; un error de tipos rompe el deploy.
- Sin env vars de Supabase → la app arranca en modo local-only, sin gate de auth.

---

## 4. ARQUITECTURA DE DATOS / SISTEMA

### Entidades (ver `src/types/index.ts`)

- **`Exercise`** — biblioteca global de ejercicios. Campos descriptivos opcionales que se autocompletan desde la knowledge base local (`src/data/exerciseKnowledgeBase.ts`) sin pisar lo que cargó el usuario. Maneja referencias de video (`referenceUrl` + `referenceType`/`referenceSource`/`referenceStatus`).
- **`Routine`** — rutina con `ExerciseTemplate[]` (sets/reps/peso/descanso por ejercicio), tipo `workout`/`active-rest`, días sugeridos.
- **`WorkoutLog`** — registro de un día: tipo (`workout`/`rest`/`active-rest`/`missed`), rutina asociada, duración, sensación, y `ExerciseLog[]` con `SetLog[]` (reps/peso/completado por serie).
- **`Settings`** — meta semanal, días de descanso, racha, dark mode, autoenriquecido, búsqueda externa.

### Persistencia

```
hooks (useRoutines, useWorkouts, useExercises, useSettings)
        │   (única puerta de escritura/lectura)
        ▼
src/lib/storage.ts  ──►  localStorage  (claves traintrack_*)
        │   storage.onChange (notify)
        ▼
src/lib/cloudSync.ts  ──►  Supabase tabla user_data (jsonb por entidad)
        debounce ~2 s, push del dataset entero, RLS por user_id
```

Tabla nube (`user_data`): `user_id` (PK, FK a auth.users), `workout_logs`, `routines`, `exercises` (jsonb), `settings` (jsonb), timestamps. Policy RLS `auth.uid() = user_id` para todas las operaciones.

### Flujo de sync (cloud-first, last-write-wins)

- **Al iniciar sesión** (`AuthContext.runMigration`): si la nube tiene datos → `pullFromCloud` y **la nube gana** (pisa lo local, sin prompt). Si la nube está vacía y hay datos locales → `pushToCloud` para sembrarla. Si ambos vacíos → nada.
- **Tras el login**, cada escritura local dispara un `pushToCloud` con debounce de 2 s que hace `upsert` del **dataset completo** (sobrescribe la fila de la nube). No hay merge a nivel registro.
- `suppressSync` evita el loop de feedback cuando `pullFromCloud` escribe en localStorage.

### Reglas de datos (invariantes)

- **INV-1 — Offline-first.** La app funciona al 100% sin red ni login. localStorage es la capa base síncrona; ningún flujo core depende de la nube.
- **INV-2 — Sync cloud-first, last-write-wins (decisión consciente).** El push sube el blob entero; en el login la nube gana y pisa lo local. NO hay resolución de conflictos a nivel registro. Riesgo asumido: editar en un dispositivo desfasado puede pisar datos del otro sin aviso. (Mitigación futura no bloqueante: avisar "la nube va a sobrescribir lo local" antes del pull — ver MEJORAS TÉCNICAS.)
- **INV-3 — Aislamiento por usuario vía RLS.** Cada cuenta solo ve su fila (`auth.uid() = user_id`). La anon key es pública; **nunca** usar `service_role` en el frontend.
- **INV-4 — El enriquecimiento nunca pisa datos del usuario.** Referencias con estado `manual` o `accepted` (y cualquier link cargado a mano) son intocables para `enrichExerciseFromKnowledgeBase`.
- **INV-5 — `storage.ts` es la única abstracción de persistencia.** Los hooks no tocan `localStorage` directo; eso mantiene viva la puerta a IndexedDB.
- **INV-6 — Referencias de ejercicio sin backend.** El fallback son deep-links de búsqueda de YouTube que "nunca quedan muertos". No se depende de un servidor para tener referencia de un ejercicio.
- **INV-7 — Secretos.** `.env.local` nunca se commitea; solo `.env.example` (sin valores reales).

---

## 5. ALCANCE — QUÉ ENTRA Y QUÉ NO

**En alcance (esta versión):** biblioteca de ejercicios con enriquecido local, rutinas, registro de workouts serie por serie, calendario de cumplimiento, dashboard (racha, resumen semanal, próximos días, frase motivacional), settings, import/export de datos, sync opcional cloud-first entre dispositivos del mismo dueño, auth (email/password + Google + modo local-only).

**Fuera de alcance (explícito):**
- **Features sociales** — feed, ranking, compartir, perfiles públicos, seguir gente. No se hace.
- **Multiusuario colaborativo / datos compartidos entre cuentas** — "abierto a compartir" significa cada conocido con su **propia** cuenta aislada, no datos en común.
- **Monetización** — sin planes pagos, anuncios ni venta de datos.
- **Backend propio para referencias** — el enriquecido es local + deep-links de YouTube; no se construye un servicio de búsqueda externo (ver MT-001 sobre el toggle muerto).
- **Romper offline-first** — nada que exija red para el flujo core.

---

## 6. FASES Y ETAPAS

El desarrollo se corta en fases. Cada fase tiene etapas. Cada etapa tiene work-orders atómicos, tomables de a uno por una sesión de terminal. El avance (casillas) se refleja acá Y el puntero de "dónde vamos" vive en CLAUDE.md.

### FASE 0 — Núcleo funcional ✅
**Definición:** la app cubre el ciclo completo de uso personal sin red y con sync opcional.

**Etapa 0.1 — Datos y persistencia**
- [x] Modelo de datos (`Exercise`, `Routine`, `WorkoutLog`, `Settings`)
- [x] Capa `storage.ts` sobre localStorage con notificación de cambios
- [x] Import/export de datos (`AppData`)

**Etapa 0.2 — Funcionalidad core**
- [x] Biblioteca de ejercicios + enriquecido desde knowledge base local
- [x] Rutinas (alta/edición, import por parser, días sugeridos)
- [x] Registro de workouts serie por serie + sesión guiada + timers (descanso / por tiempo)
- [x] Calendario de cumplimiento (mes + detalle de día)
- [x] Dashboard (racha, resumen semanal, próximos días, frase motivacional)
- [x] Settings (meta semanal, días de descanso, dark mode, enriquecido)

**Etapa 0.3 — Auth y sync**
- [x] Auth Supabase (email/password + Google OAuth + modo local-only)
- [x] Sync cloud-first last-write-wins con debounce (`cloudSync.ts`)
- [x] `ErrorBoundary` ante datos inválidos (evita pantalla blanca)

### FASE 1 — Mantenimiento evolutivo 🔄
**Definición:** el núcleo está cerrado; el avance lo gobiernan las secciones vivas (BUGS / MEJORAS TÉCNICAS / STEPS), no un roadmap de features grandes.

**Etapa 1.1 — Higiene técnica**
- [ ] Resolver MT-001 (toggle `externalSearch` muerto: remover o cablear)

### FASE 2 — Profesionalización visual ⏳
**Definición:** la app se ve profesional y consistente; se elimina el look "casero" de los emojis de teclado.

**Etapa 2.1 — Sistema de iconos**
- [ ] Reemplazar emojis de teclado (🔎, etc.) por iconos de `lucide-react` (ver MT-002)

**Etapa 2.2 — Brief de estilo para Claude Design**
- [ ] Generar `brief.md` (artefacto **derivado** de esta biblia, con **sello de frescura**) para estilizar la UI con Claude Design
- [ ] Aplicar el rediseño guiado por el brief

---

## 7. REGLA DE MODULARIZACIÓN

Las tareas repetibles con un workflow propio NO viven como sección de esta biblia: se modularizan en su propio archivo MD (ej: `BRIEF_ESTILO_GENERATOR.md`, `IMPORTAR_RUTINA.md`), con el formato de `modulo.template.md`, y se referencian desde acá. Todo módulo lleva **sello de frescura** (sincronizado con biblia.md hasta fecha + última entrada considerada).

**Módulos del proyecto:**
- _(ninguno todavía — crear bajo demanda cuando un flujo se vuelva repetible, p. ej. la generación del brief de estilo o el import de rutinas)_

---

## 8. REGLAS DEL PROYECTO

- Respetar SIEMPRE los invariantes INV-1 a INV-7 (§4). Cualquier cambio que toque uno se discute y se documenta acá antes de codear.
- Toda escritura/lectura de datos pasa por `storage.ts`; los hooks no acceden a `localStorage` directo.
- El enriquecido nunca pisa datos del usuario (referencias `manual`/`accepted` protegidas).
- Nunca commitear `.env.local` ni secretos; `service_role` jamás en el frontend.
- El flujo core siempre funciona sin red ni login.
- Antes de tocar el sync, recordar que es last-write-wins por diseño: no introducir merges parciales sin actualizar INV-2.

---

## 9. BUGS

Defectos encontrados fuera del flujo normal de etapas.
**Atributos:** estado · etapa donde se reconoció · fecha · duración de corrección.

---

_(Sin bugs abiertos al cierre de la fase de arquitectura. El crash de pantalla blanca por datos inválidos ya fue resuelto con `ErrorBoundary` en la Etapa 0.3.)_

---

## 10. MEJORAS TÉCNICAS

Cambios de calidad técnica que no son feature ni bug.
**Atributos:** estado · etapa de referencia · fecha · duración · impacto medible.

---

### ⏳ MT-001 — `externalSearch` es un toggle muerto y su comentario engaña
- **Estado:** Abierto
- **Etapa de referencia:** 1.1
- **Fecha:** 2026-06-29
- **Duración:** —
- **Impacto:** menos superficie de código muerto; setting que no miente sobre lo que hace.
- **Descripción:** El setting `externalSearch` (`src/types/index.ts`, default en `storage.ts`) tiene su toggle en `SettingsPage.tsx:241` con `onChange={() => { /* gated until backend exists */ }}` — **no hace nada**. El comentario "external search is opt-in (requires backend)" apunta a un backend serverless que **nunca se construyó**. La búsqueda real de referencias que sí funciona son los **deep-links de YouTube** (botón "🔎 Buscar en YouTube" en `WorkoutSession.tsx` y `ExercisesPage.tsx`), independientes de este flag. Decisión pendiente: **remover** el setting/toggle o **cablearlo** a algo real.

### ⏳ MT-002 — Profesionalización visual: emojis de teclado → iconos
- **Estado:** Abierto
- **Etapa de referencia:** 2.1
- **Fecha:** 2026-06-29
- **Duración:** —
- **Impacto:** percepción de calidad/profesionalismo de la app.
- **Descripción:** Hay iconos que son emojis de teclado (ej. 🔎 en los botones de búsqueda de YouTube). Migrar al set `lucide-react`, ya presente, para una vista consistente. Antesala de la FASE 2 y del brief de estilo para Claude Design. _Idea relacionada a evaluar:_ ofrecer referencias de video sin problemas de derechos de autor.

---

## 11. CONTEXTO PARA NUEVAS SESIONES

> "TrainTrack es una app personal de tracking de entrenamiento (React 19 + TS + Vite + Tailwind, persistencia offline-first en localStorage vía `storage.ts`, sync opcional cloud-first last-write-wins con Supabase). El núcleo (FASE 0) está cerrado; estamos en FASE 1 (mantenimiento evolutivo) con la FASE 2 (profesionalización visual) por delante. Antes de tocar nada: leé `CLAUDE.md` (cómo trabajar y dónde quedamos) y esta biblia completa (la verdad del proyecto). Respetá los invariantes INV-1 a INV-7."
