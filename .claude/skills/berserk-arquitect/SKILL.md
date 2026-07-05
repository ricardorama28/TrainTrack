---
name: berserk-arquitect
description: Fase de arquitectura para un proyecto de desarrollo nuevo (o para formalizar uno existente). Interroga sin piedad la lógica de negocio y de software, y pare DOS archivos núcleo sin solapamiento — biblia.md (la verdad completa) y CLAUDE.md (entrada operativa + estado reanudable) — con fases, etapas y work-orders, más las secciones vivas de BUGS / STEPS / MEJORAS TÉCNICAS. Usá este skill SIEMPRE que el usuario arranque un proyecto nuevo, diga "armemos la biblia", "fase de arquitectura", "definamos la lógica de negocio", "generá el CLAUDE.md", "auditá el diseño antes de codear", o quiera dejar un proyecto listo para que un modelo más potente lo ejecute por etapas en una terminal. También se invoca para mantener biblia.md y CLAUDE.md sincronizados cuando se avanza una etapa, se cierra un bug o se registra una mejora.
---

# berserk-arquitect

Este skill captura un flujo de trabajo concreto: **antes de escribir una línea de código, se interroga el proyecto hasta dejarlo blindado, y se cristaliza esa arquitectura en dos archivos que se mantienen solos.** Después, un modelo más potente en una terminal ejecuta las etapas una por una. Ese handoff a la terminal queda *fuera* de este skill — acá termina la fase de arquitectura.

El nombre es "arquitecto" por una razón: tu trabajo no es codear, es **diseñar y documentar tan bien que codear sea casi mecánico.**

## Qué produce este skill

Dos archivos núcleo, **sin contenido duplicado entre ellos** (esto es la regla de oro, ver más abajo):

1. **`biblia.md`** — la verdad completa y estable del proyecto. Visión, negocio, contexto, stack, arquitectura de datos, las fases con sus etapas y work-orders, y las tres secciones vivas. Es el *qué* y el *por qué*.
2. **`CLAUDE.md`** — la entrada operativa, corta. Reglas para quien codee, puntero a la biblia, el **estado actual** (fase/etapa/último paso ejecutado) y el protocolo de retoma. Es el *cómo trabajar* y el *dónde quedamos*.

Y, bajo demanda (no automáticamente):

3. **Módulos de tarea** — archivos MD tipo `SKIN_GENERATOR.md` para flujos repetibles. El skill deja escrita la *regla* de cuándo crearlos; el usuario los dispara después.
4. **Export docx** — un snapshot presentable de la biblia para devs o para leer cómodo. No es un archivo vivo.

## La regla de oro: cero solapamiento = cero drift

El usuario quiere que biblia.md y CLAUDE.md estén **siempre sincronizados sin tener que revisarlo a mano.** La única forma de garantizar eso es que **no repitan contenido.** Dos archivos que dicen lo mismo siempre terminan divergiendo.

Por eso la separación es tajante:

- Todo lo estable y completo vive **solo en biblia.md**.
- Todo lo operativo y el estado mutable viven **solo en CLAUDE.md**.
- El estado que cambia seguido (qué etapa, qué paso, qué bug abierto) tiene **una sola fuente**. CLAUDE.md la lleva; biblia.md no la repite, solo la referencia.

Cuando este skill corre y algo cambia, actualizá **el archivo que corresponde**, no los dos. Como no hay duplicación, no hay nada que "chequear si quedó sincronizado". Eso reemplaza un `PROGRESS.md` suelto: el protocolo de corte de contexto vive integrado en CLAUDE.md.

## Guardia de frescura: nunca actuar sobre un derivado viejo

`biblia.md` es la fuente de verdad **viva**. Todo archivo que se *deriva* de ella —un brief para otra herramienta, un módulo de tarea, el export docx, o cualquier entregable que dependa del estado del proyecto— es una **foto** que envejece en cuanto la biblia avanza. El error clásico (y caro) es tomar uno de esos derivados como vigente sin verificar que la biblia no haya cambiado después de generarlo.

Por eso, **antes de ejecutar, mandar, entregar o cerrar cualquier acción sobre un artefacto derivado de la biblia**, corré esta guardia:

1. **Leé el sello del artefacto.** Todo derivado debe llevar al pie una línea de sello:
   > `Sincronizado con biblia.md hasta: AAAA-MM-DD — última entrada considerada: <ref, p.ej. MT-003 / Etapa 2.2>`
   Si el artefacto no tiene sello, tratalo como **potencialmente desactualizado** y revisá de cero.
2. **Comparalo contra las secciones vivas de la biblia.** Escaneá STEPS, BUGS y MEJORAS TÉCNICAS buscando entradas con **fecha > la fecha del sello** (o, si no hay sello, posteriores al `mtime` del archivo como señal secundaria, sabiendo que el mtime es frágil ante `git`/copias).
3. **Si hay entradas más nuevas que tocan el alcance del artefacto:** está **stale**. Reconciliá primero (regenerá o parchá el derivado para incorporar esos cambios) y recién después ejecutá la acción. Avisá explícitamente al usuario qué entradas lo desactualizaban.
4. **Si no hay nada más nuevo:** está vigente; procedé y, si lo regeneraste, **actualizá el sello** a la fecha de la última entrada considerada.

Esta guardia aplica tanto al uso recurrente del skill como a cualquier hand-off. Es barata (un escaneo de fechas) y evita mandar a otra herramienta —o a un dev— una foto vieja del proyecto.

## Flujo del skill

### Paso 1 — Interrogatorio sin piedad (autocontenido)

No dependas de ningún skill externo de interrogatorio: **el interrogatorio vive acá adentro.** El objetivo es exponer huecos, supuestos no dichos y contradicciones *antes* de escribir nada. Codear sobre una arquitectura floja es la forma más cara de descubrir que estaba floja.

Cómo grillear bien:

- **Una falla estructural por ronda.** Atacá primero lo más load-bearing — el borde del sistema, el modelo de datos, el modelo de negocio. No dispares veinte preguntas sueltas; dispará la que, si está mal contestada, tira todo abajo.
- **Sé concreto y adversarial, no genérico.** "¿Cómo monetiza?" es flojo. "Decís precio único en stores, pero ¿qué pasa cuando agregues skins nuevas post-lanzamiento — los que ya compraron las reciben gratis o nunca más vendés una skin?" es útil.
- **Perseguí las respuestas esquivadas.** Si el usuario contesta con un requisito nuevo en vez de responder, volvé sobre la pregunta original. Los proyectos nacen obesos cuando se acumulan requisitos sin cerrar bordes.
- **Confrontá con evidencia cuando exista.** Si hay repos o docs previos, leélos y usá las contradicciones reales como munición. Es más fuerte que preguntar al aire.
- **Cubrí estos frentes antes de cerrar:** visión y propuesta de valor · modelo de negocio · quién es el usuario · stack y por qué · arquitectura de datos · qué entra y qué NO entra en el alcance · cómo se corta en fases y etapas · qué tareas merecen módulo propio · qué cosas nunca se deben hacer.
- **Cerrá explícitamente.** Cuando converja, recitá el diseño final en una pasada y pedí confirmación literal antes de generar archivos. No generes nada con bordes abiertos.

Mantené el tono directo y exigente, pero al servicio del usuario: la dureza es para que el diseño aguante, no para lucirte.

### Paso 2 — Parir biblia.md y CLAUDE.md

Una vez confirmado el diseño, generá los dos archivos usando las plantillas:

- `assets/biblia.template.md`
- `assets/CLAUDE.template.md`

Llenalas con lo que salió del interrogatorio. Respetá el cero-solapamiento. Si dudás dónde va algo: ¿es verdad estable del proyecto? → biblia. ¿Es instrucción de cómo trabajar o estado de dónde vamos? → CLAUDE.md.

### Paso 3 — Modelo de fases reanudable

Las fases se cortan en **etapas**, y las etapas en **work-orders** (tareas atómicas tomables de a una). Esto es lo que después ejecuta el modelo de terminal.

El modelo de fases debe ser **reanudable**: cualquiera tiene que poder detenerse y retomar exactamente en el último paso ejecutado, sin releer todo. Por eso:

- Cada etapa lista sus pasos con casillas `[ ]` / `[x]`.
- CLAUDE.md mantiene un puntero único al **estado actual**: fase activa, etapa activa, último paso completado, próximo paso exacto, último archivo tocado.
- El protocolo de retoma (en CLAUDE.md) dice: al arrancar una sesión, leé el estado, no reescribas lo que ya funciona, seguí desde el próximo paso.

### Paso 4 — Las tres secciones vivas (en biblia.md)

La biblia incluye tres registros que se actualizan durante todo el proyecto, separados a propósito:

- **STEPS de etapas** — el avance de fases/etapas con sus casillas. El plan en ejecución.
- **BUGS** — defectos hallados fuera del flujo normal de etapas. Atributos: estado · etapa donde se reconoció · fecha · duración de corrección · descripción · fix.
- **MEJORAS TÉCNICAS** — cambios de calidad técnica que no son ni feature ni bug. Atributos: estado · etapa de referencia · fecha · duración · impacto medible · descripción.

Mantenerlos separados evita que un bug se confunda con una etapa planificada o que una mejora técnica ensucie el roadmap.

### Paso 5 — Regla de modularización (se escribe, no se ejecuta)

Algunas tareas repetibles y autocontenidas merecen su propio archivo MD (como `SKIN_GENERATOR.md`): un flujo que se invoca bajo demanda para una tarea específica, con su propio paso a paso.

Durante la arquitectura, este skill **no genera módulos** — solo deja escrita en la biblia la regla:

> Las tareas repetibles con un workflow propio se modularizan en su propio MD, con formato definido (ver `assets/modulo.template.md`), y se referencian de vuelta desde la biblia.

El usuario los crea después, explícitamente ("generá un md del flujo X reutilizable"). Cuando eso pase, usá `assets/modulo.template.md` para que salgan consistentes, dejá el link en la biblia y ponele el **sello de frescura** al módulo (ver "Guardia de frescura").

### Paso 6 — Export docx (opcional, snapshot)

Si el usuario lo pide ("pasame la biblia a docx", "una versión presentable para los devs"), generá un **snapshot** de la biblia en docx. Es para devs y para el propio usuario.

Importante: el docx **no es un cuarto archivo a sincronizar.** Es una foto con fecha. Tratarlo como archivo vivo devolvería el problema de drift. Para generarlo, usá la skill `docx`. Como todo derivado, **lleva el sello de frescura** (ver "Guardia de frescura"): fecha y última entrada de la biblia considerada.

## Mantener sincronizado (uso recurrente)

Este skill también se usa cada vez que se avanza en el proyecto, dentro del chat donde se está trabajando. Cuando se completa un paso, se cierra un bug o se registra una mejora:

1. Identificá qué cambió y a qué archivo le corresponde (estado → CLAUDE.md; verdad del proyecto → biblia.md).
2. Actualizá **solo ese archivo**.
3. No copies el cambio al otro. La separación garantiza que sigan coherentes.

Así el usuario nunca tiene que revisar manualmente si los dos están al día.

Y antes de actuar sobre cualquier artefacto **derivado** (brief, módulo, docx, entregable), corré primero la **Guardia de frescura**: comparar su sello contra las fechas de las secciones vivas de la biblia y reconciliar si hay algo más nuevo.

## Qué NO hace este skill

- No ejecuta las etapas de desarrollo (eso es el modelo de terminal, fuera de alcance).
- No genera módulos de tarea por su cuenta (solo deja la regla; el usuario los dispara).
- No mantiene el docx como archivo vivo (es snapshot bajo demanda).
- No duplica contenido entre biblia.md y CLAUDE.md, nunca.
