# TrainTrack 💪

App personal para registrar entrenamientos, rutinas y progreso. Funciona completamente offline y guarda todo en tu dispositivo.

## Stack

- **React 18 + TypeScript** — UI moderna con tipado estático
- **Vite** — build tool ultrarrápido
- **Tailwind CSS v3** — estilos utilitarios, mobile-first
- **localStorage** — persistencia local sin backend

> **¿Por qué localStorage y no IndexedDB?**
> Los datos de esta app (rutinas, registros, ajustes) son JSON compactos que rara vez superan 1–2 MB incluso después de años de uso. localStorage es síncrono, simple y sin abstracciones extra. Si en el futuro se necesita más capacidad o consultas complejas, la capa de `storage.ts` se puede migrar a IndexedDB sin tocar el resto de la app.

---

## Instalación local

```bash
git clone https://github.com/ricardorama28/traintrack.git
cd traintrack
npm install
```

## Correr en desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Build de producción

```bash
npm run build
npm run preview   # para ver el build localmente
```

Los archivos generados quedan en `/dist`.

---

## Cómo usar la app

### Dashboard
- Resumen semanal con progreso visual
- Racha actual y mejor racha
- Último entrenamiento registrado
- Próximos 7 días con estado

### Calendario
- Vista mensual con colores por tipo de día
- Tocar cualquier día para registrar o editar
- Tipos: Entrenado 💪 | Descanso 💤 | Descanso activo 🚶 | No realizado ✗

### Rutinas
- Ver, crear, editar, duplicar y eliminar rutinas
- Cada rutina tiene ejercicios con series, reps, peso, descanso, grupo muscular y link a video
- **Importar desde texto**: pegá una rutina generada en ChatGPT y la app la convierte automáticamente

### Ejercicios
- Historial de progreso por ejercicio
- Ver último peso usado
- Buscar ejercicios

### Ajustes
- Objetivo semanal de entrenamientos
- Días de descanso habituales
- Configurar si los descansos mantienen la racha
- Modo oscuro
- Exportar / importar datos en JSON
- Borrar todos los datos

---

## Importar rutinas desde texto

En **Rutinas → Importar**, pegá texto libre como:

```
Día A:
- Hip thrust: 4x10, 25 kg
- Peso muerto rumano: 3x12, 25 kg
- Sentadilla: 3x12
- Plancha: 3x30 segundos

Día B:
- Press militar: 3x10, 7.5 kg
- Bíceps: 3x12, 7.5 kg

Descanso activo:
- Movilidad de cadera
- Estiramientos
```

La app detecta días, ejercicios, series, repeticiones y pesos. Podés editar todo antes de confirmar.

---

## Despliegue

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
# Subir la carpeta /dist a Netlify Drop: https://app.netlify.com/drop
```

### GitHub Pages

1. Instalar `gh-pages`: `npm install -D gh-pages`
2. Agregar en `package.json`:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
3. Configurar `base` en `vite.config.ts`:
   ```ts
   base: '/traintrack/'
   ```
4. Ejecutar `npm run build && npm run deploy`

---

## Usar desde el celular

1. Desplegá la app en Vercel o Netlify (gratis)
2. Abrí la URL en Chrome (Android) o Safari (iOS)
3. **Android**: Menú → "Agregar a pantalla de inicio"
4. **iOS**: Compartir → "Agregar a pantalla de inicio"

La app funciona offline una vez cargada gracias al manifest PWA. Todos tus datos quedan en el dispositivo.

---

## Estructura del proyecto

```
src/
  types/index.ts          — Modelos de datos TypeScript
  lib/
    storage.ts            — Abstracción de localStorage
    streaks.ts            — Cálculo de rachas
    parser.ts             — Parser de rutinas desde texto libre
    dates.ts              — Utilidades de fechas en español
    sampleData.ts         — Datos de ejemplo iniciales
  hooks/
    useWorkouts.ts        — CRUD de entrenamientos
    useRoutines.ts        — CRUD de rutinas
    useSettings.ts        — Ajustes
  components/
    ui/                   — Componentes reutilizables (Card, Badge, Button, Modal...)
    dashboard/            — Componentes del dashboard
    calendar/             — Calendario y detalle de día
    routines/             — Rutinas, ejercicios e importador
    exercises/            — Historial de progreso
    settings/             — Gestión de datos
  pages/                  — Una página por sección
  App.tsx                 — Rutas y estado global
  main.tsx                — Entry point
```

---

## Mejoras futuras sugeridas

- **Service Worker** para cache offline real (actualmente usa localStorage pero el HTML requiere conexión inicial)
- **Notificaciones push** para recordar entrenamientos
- **Gráficos de progreso** con chart.js o recharts
- **Timer de descanso** entre series con alerta de sonido
- **Compartir rutinas** vía URL (codificadas en base64, sin backend)
- **Plantillas de rutinas** predefinidas para distintos objetivos
- **Sincronización opcional** con Google Drive o iCloud (via API pública)
- **Modo sesión activa**: registrar series en tiempo real durante el entrenamiento
- **Estadísticas avanzadas**: volumen por semana, grupos musculares trabajados, etc.
