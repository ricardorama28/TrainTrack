# {NOMBRE_PROYECTO} — BIBLIA DE ARQUITECTURA

> Fuente de verdad del proyecto. Toda decisión técnica, de producto y de negocio vive acá.
> Antes de implementar cualquier feature, leer este archivo completo.
> El estado de avance (fase/etapa/paso actual) NO vive acá — vive en CLAUDE.md. Acá vive el plan; allá, dónde vamos.

---

## 1. VISIÓN DEL PRODUCTO

{Qué es, para quién, qué problema resuelve.}

**Propuesta de valor:** {una frase.}

**Modelo de negocio:** {cómo se monetiza. Precio, canales, qué NO se cobra.}

---

## 2. CONTEXTO DEL USUARIO / EQUIPO

{Quién va a desarrollar y operar esto. Nivel técnico, stack cómodo, preferencias, herramientas que usa a diario, restricciones conocidas.}

---

## 3. STACK TÉCNICO

| Capa | Tecnología | Razón |
|------|-----------|-------|
| {Frontend} | {…} | {…} |
| {Backend} | {…} | {…} |
| {DB} | {…} | {…} |
| {Deploy} | {…} | {…} |

{Notas relevantes del stack: costos, plugins, decisiones no obvias.}

---

## 4. ARQUITECTURA DE DATOS / SISTEMA

{Modelo de datos, esquema, diagrama de componentes o flujo. Lo que necesita saber alguien para no romper nada.}

```
{esquema / diagrama}
```

### Reglas de datos
{Invariantes: qué siempre se cumple, qué nunca. Ej: offline-first, dónde se persiste, qué no se hardcodea.}

---

## 5. ALCANCE — QUÉ ENTRA Y QUÉ NO

**En alcance (esta versión):** {…}

**Fuera de alcance (explícito):** {lo que parece que entraría pero no, y por qué. Esto evita scope creep.}

---

## 6. FASES Y ETAPAS

El desarrollo se corta en fases. Cada fase tiene etapas. Cada etapa tiene work-orders atómicos, tomables de a uno por una sesión de terminal. El avance (casillas) se refleja acá Y el puntero de "dónde vamos" vive en CLAUDE.md.

### FASE 0 — {nombre} {✅ / 🔄 / ⏳}
**Definición:** {qué significa que esta fase esté terminada.}

**Etapa 0.1 — {nombre}**
- [ ] {work-order atómico}
- [ ] {work-order atómico}

### FASE 1 — {nombre} {✅ / 🔄 / ⏳}
**Definición:** {…}

**Etapa 1.1 — {nombre}**
- [ ] {work-order atómico}

---

## 7. REGLA DE MODULARIZACIÓN

Las tareas repetibles con un workflow propio NO viven como sección de esta biblia: se modularizan en su propio archivo MD (ej: `{TAREA}_GENERATOR.md`), con el formato de `modulo.template.md`, y se referencian desde acá.

**Módulos del proyecto:**
- {`NOMBRE_MODULO.md`} — {qué flujo cubre} {(crear bajo demanda)}

---

## 8. REGLAS DEL PROYECTO

{Reglas duras para quien codee. Lo que se hace siempre y lo que no se hace nunca.}

- {regla}
- {regla}

---

## 9. BUGS

Defectos encontrados fuera del flujo normal de etapas.
**Atributos:** estado · etapa donde se reconoció · fecha · duración de corrección.

---

### {⏳/✅} BUG-001 — {título}
- **Estado:** {Abierto / Resuelto}
- **Etapa reconocida:** {…}
- **Fecha:** {YYYY-MM-DD}
- **Duración:** {…}
- **Descripción:** {…}
- **Fix:** {…}

---

## 10. MEJORAS TÉCNICAS

Cambios de calidad técnica que no son feature ni bug.
**Atributos:** estado · etapa de referencia · fecha · duración · impacto medible.

---

### {⏳/✅} MT-001 — {título}
- **Estado:** {…}
- **Etapa de referencia:** {…}
- **Fecha:** {YYYY-MM-DD}
- **Duración:** {…}
- **Impacto:** {medible.}
- **Descripción:** {…}

---

## 11. CONTEXTO PARA NUEVAS SESIONES

> "{Frase de arranque para pegar al iniciar una sesión nueva: qué es el proyecto, stack, fase actual, y 'leé CLAUDE.md y esta biblia antes de empezar'.}"
