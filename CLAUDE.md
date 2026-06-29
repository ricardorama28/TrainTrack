# CLAUDE.md — TrainTrack

> Entrada operativa. La verdad completa del proyecto vive en `biblia.md` — leela entera antes de codear.
> Este archivo NO repite la biblia: solo dice cómo trabajar y dónde quedamos.

---

## REGLA DE ORO

Todo cambio de arquitectura, feature, endpoint, modelo de datos o decisión técnica debe quedar reflejado en `biblia.md` en la misma sesión en que se implementa. El estado de avance se actualiza acá abajo.

Al iniciar una sesión sobre este repo:
1. Leer `biblia.md` completo — es la fuente de verdad (incluye los invariantes INV-1 a INV-7).
2. Leer el ESTADO ACTUAL más abajo — es dónde quedamos.
3. Seguir desde el "próximo paso". No reescribir lo que ya funciona.

---

## ESTADO ACTUAL

> Fuente única del avance. No duplicar en biblia.md.

- **Fase activa:** 1 — Mantenimiento evolutivo
- **Etapa activa:** 1.1 — Higiene técnica
- **Último paso completado:** Fase de arquitectura cerrada — generados `biblia.md` y `CLAUDE.md` que formalizan el proyecto existente (FASE 0 documentada como núcleo cerrado).
- **Próximo paso:** Resolver MT-001 — decidir si se **remueve** o se **cablea** el toggle muerto `externalSearch` (`SettingsPage.tsx:241` tiene `onChange` no-op + comentario "requires backend" engañoso).
- **Último archivo tocado:** `CLAUDE.md` (creación inicial)
- **Notas de sesión:** El avance del proyecto está gobernado por las secciones vivas de la biblia (BUGS / MEJORAS TÉCNICAS), no por un roadmap de features grandes. FASE 2 (profesionalización visual) culmina en un `brief.md` para Claude Design, que será artefacto derivado con sello de frescura.

---

## PROTOCOLO DE RETOMA (corte de contexto)

Si estás por quedarte sin contexto o cortás la sesión:
1. Actualizá el bloque ESTADO ACTUAL: último paso completado, próximo paso exacto, último archivo tocado.
2. Si tomaste decisiones que cambian la verdad del proyecto, llevalas a `biblia.md`.
3. Commit: `WIP: {dónde quedó}`.

Al retomar: leer ESTADO ACTUAL antes que nada y continuar desde el próximo paso.

---

## CÓMO TRABAJAR

- Tomar de a **una etapa** por sesión. No mezclar etapas.
- Trabajar en bloques chicos y auditables. Validar antes de seguir.
- **Build / validación:** `npm run build` corre `tsc && vite build` — el type-check es parte del build, un error de tipos rompe el deploy. `npm run dev` para desarrollo, `npm run preview` para servir el build.
- **Persistencia:** toda lectura/escritura de datos pasa por `src/lib/storage.ts`. No tocar `localStorage` directo desde hooks o componentes (INV-5).
- **Sync:** es cloud-first last-write-wins por diseño (INV-2). No introducir merges parciales sin actualizar el invariante en la biblia.
- **Secretos:** nunca commitear `.env.local`; solo `.env.example`. `service_role` jamás en el frontend (INV-3, INV-7).
- **Guardia de frescura:** antes de ejecutar, mandar, entregar o cerrar cualquier acción sobre un artefacto **derivado** de `biblia.md` (el futuro `brief.md` de estilo, módulos de tarea, docx, entregables), verificá que no esté viejo. Leé su línea de sello (`Sincronizado con biblia.md hasta: AAAA-MM-DD — última entrada: <ref>`) y escaneá BUGS / MEJORAS TÉCNICAS / fases de la biblia por entradas con **fecha posterior** a ese sello (el `mtime` del archivo es señal secundaria, frágil ante git/copias). Si hay algo más nuevo que toca el alcance del artefacto → **reconciliá primero** (regenerá o parchá) y avisá qué lo desactualizaba; recién después procedé. Si regenerás, actualizá el sello.
- **Git:** trabajar en rama (no pushear directo a `main` sin pedirlo). El núcleo de la app ya vive en `main`.

---

## QUÉ NO HACER NUNCA

- No duplicar contenido entre este archivo y `biblia.md`.
- No hardcodear credenciales ni secretos; no commitear `.env.local`; no usar `service_role` en el frontend.
- No romper offline-first: ningún flujo core puede exigir red ni login (INV-1).
- No pisar datos del usuario al enriquecer ejercicios: referencias `manual`/`accepted` son intocables (INV-4).
- No agregar features sociales, multiusuario colaborativo ni monetización — están fuera de alcance por diseño (biblia §5).
