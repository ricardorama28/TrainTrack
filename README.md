# alfallo

App personal para registrar entrenamientos, rutinas y progreso. Funciona offline-first y, opcionalmente, sincroniza entre dispositivos vía Supabase.

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | UI con hooks |
| TypeScript | 6 | Tipado estático |
| Vite | 8 | Build tool y dev server |
| Tailwind CSS | v3 | Estilos utilitarios, mobile-first, dark mode |
| lucide-react | latest | Iconos SVG |
| Supabase | (cliente JS) | Auth + sync en la nube (opcional) |

> **¿Por qué localStorage como capa base?**
> Los datos (rutinas, registros, ajustes) son JSON compactos que raramente superan 1–2 MB incluso después de años. localStorage es síncrono y simple. La capa `src/lib/storage.ts` actúa como abstracción: si en el futuro se necesita IndexedDB, el cambio es puntual.

---

## Instalación local

```bash
git clone https://github.com/ricardorama28/alfallo.git
cd alfallo
npm install
npm run dev
```

Abre `http://localhost:5173`.

```bash
npm run build      # build de producción → /dist
npm run preview    # servir el build localmente
```

---

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

- **`.env.local` no se commitea.** `.env.example` sí (sin valores reales).
- La **anon key** es pública y puede ir en el frontend; la seguridad la da RLS.
- **Nunca** uses la `service_role` key en el frontend.
- Si no configurás estas variables, la app funciona completamente local (sin pantalla de login).

---

## Supabase — Setup inicial

### 1. Crear la tabla

En **SQL Editor** del dashboard de Supabase, ejecutá:

```sql
create table user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  workout_logs jsonb not null default '[]'::jsonb,
  routines     jsonb not null default '[]'::jsonb,
  exercises    jsonb not null default '[]'::jsonb,
  settings     jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table user_data enable row level security;

create policy "own data" on user_data
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

RLS garantiza que cada usuario solo accede a su propia fila.

### 2. Login con Google (OAuth)

**En [Google Cloud Console](https://console.cloud.google.com):**
1. Creá o seleccioná un proyecto.
2. **APIs & Services → OAuth consent screen** → tipo "External", completá nombre y email.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipo "Web application".
4. En **Authorized redirect URIs** agregá:
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`
5. Copiá el **Client ID** y **Client Secret**.

**En el dashboard de Supabase:**
1. **Authentication → Providers → Google** → activar.
2. Pegá el Client ID y Client Secret.
3. **Authentication → URL Configuration → Site URL** → URL de producción (ej. `https://alfallo-xxx.vercel.app`), **sin barra final**.
4. **Authentication → URL Configuration → Redirect URLs**, agregá:
   - La URL de producción.
   - `http://localhost:5173` (desarrollo).
   - Opcional: `https://*.vercel.app` para preview deployments.

> El `redirectTo: window.location.origin` del código debe coincidir con una de las Redirect URLs permitidas.

> ⚠️ Los preview deployments de Vercel tienen URL cambiante. El OAuth solo funciona de forma confiable en la URL de producción estable. Probá siempre desde ahí.

### Problema: me quedo en `.../auth/v1/callback`

Si al iniciar sesión con Google la app no vuelve y quedás en la URL de callback de Supabase:

- **Causa:** la URL de tu app no está permitida en Supabase → redirige al Site URL (por defecto `localhost`), que desde el celular no resuelve.
- **Solución:** configurá Site URL y Redirect URLs con la URL de producción (pasos 3 y 4 de arriba). No requiere redeploy.

---

## Arquitectura de sincronización

```
hooks → localStorage (síncrono, offline-first)
              ↓  debounce ~2 s
         Supabase (cuando hay sesión activa)
```

**Al iniciar sesión:**

| Situación | Comportamiento |
|---|---|
| Cloud vacío + datos locales | Auto-push silencioso al cloud |
| Cloud con datos + local vacío | Auto-pull desde cloud |
| Cloud con datos + local con datos | Cloud gana, pull automático (sin modal) |

Cerrar sesión **no borra** los datos locales. Sin Supabase configurado, la app funciona igual pero sin sync entre dispositivos.

---

## Despliegue

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

En el dashboard de Vercel, configurá las variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) bajo **Settings → Environment Variables**.

### Netlify

```bash
npm run build
# Subir la carpeta /dist a Netlify Drop: https://app.netlify.com/drop
```

### GitHub Pages

1. `npm install -D gh-pages`
2. En `package.json`: `"deploy": "gh-pages -d dist"`
3. En `vite.config.ts`: `base: '/alfallo/'`
4. `npm run build && npm run deploy`

---

## Instalar como PWA (celular)

1. Desplegá en Vercel o Netlify.
2. Abrí la URL en Chrome (Android) o Safari (iOS).
3. **Android:** Menú → "Agregar a pantalla de inicio".
4. **iOS:** Compartir → "Agregar a pantalla de inicio".

La app funciona offline una vez cargada (datos en localStorage). Con cuenta, los cambios se sincronizan al reconectarse.

---

## Funcionalidades

### Dashboard

- Saludo personalizado con el nombre del usuario (extraído de Google OAuth o prefijo del email).
- Mensaje motivacional contextual según el día de la semana y la franja horaria (mañana / tarde / noche).
- Racha actual y mejor racha.
- Resumen semanal de progreso visual.
- Último entrenamiento registrado (rutina, duración, sensación, notas).
- Próximos 7 días con estado esperado.
- Accesos rápidos a Calendario y Rutinas.

### Calendario

- Vista mensual con colores por tipo de día.
- Tocar cualquier día para registrar o editar.
- Tipos: Entrenado | Descanso | Descanso activo | No realizado.

### Rutinas

- Ver, crear, editar, duplicar y eliminar rutinas.
- **Reordenar rutinas** con flechas ↑/↓ (el orden se persiste).
- Cada rutina tiene ejercicios con series, reps, peso, descanso, grupo muscular y link a video.
- **Importar desde texto**: pegá una rutina generada en ChatGPT y la app la parsea automáticamente.

### Ejercicios

- Historial de progreso por ejercicio.
- Último peso usado.
- Detalle con video de referencia embebido (YouTube) cuando está disponible.
- Búsqueda por nombre.
- **Enriquecimiento automático**: al cargar o tras un pull de cloud, los ejercicios se completan automáticamente desde una base de conocimiento local (músculos, descripción, video de referencia). Solo rellena campos vacíos; nunca sobreescribe datos ingresados manualmente.

### Ajustes

- Objetivo semanal de entrenamientos.
- Días de descanso habituales.
- Configurar si los descansos mantienen la racha.
- Toggle de enriquecimiento automático de ejercicios.
- Modo oscuro.
- Exportar / importar datos en JSON.
- Borrar todos los datos.
- Estado de sincronización con Supabase; botón de reintento si hay error.

---

## Importar rutinas desde texto

En **Rutinas → Importar**, pegá texto libre:

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

La app detecta días, ejercicios, series, reps y pesos. Podés editar todo antes de confirmar.

---

## Estructura del proyecto

```
src/
  types/index.ts              — Modelos TypeScript
  data/
    exerciseKnowledgeBase.ts  — Base de conocimiento de ejercicios (músculo, video, desc.)
  lib/
    storage.ts                — Abstracción de localStorage
    supabase.ts               — Cliente Supabase
    cloudSync.ts              — Push/pull hacia Supabase
    enrichExercise.ts         — Enriquecimiento de ejercicios desde knowledge base
    streaks.ts                — Cálculo de rachas
    parser.ts                 — Parser de rutinas desde texto libre
    dates.ts                  — Utilidades de fechas en español
    sampleData.ts             — Datos de ejemplo iniciales
  hooks/
    useWorkouts.ts            — CRUD de entrenamientos
    useRoutines.ts            — CRUD de rutinas (incluye moveRoutine)
    useSettings.ts            — Ajustes
    useExercises.ts           — CRUD + enriquecimiento de ejercicios
  context/
    AuthContext.tsx           — Sesión, migration cases A/B/C
  components/
    ui/                       — Card, Badge, Button, Modal, BottomNav, Toggle...
    dashboard/                — StreakCard, WeeklySummary, MotivationalQuote, UpcomingDays
    calendar/                 — Calendario mensual y detalle de día
    routines/                 — RoutineCard, ExerciseEditor, RoutineImporter
    exercises/                — Historial y detalle de ejercicio
    settings/                 — DataManagement
    auth/                     — AuthGate
  pages/                      — Dashboard, CalendarPage, RoutinesPage, ExercisesPage, SettingsPage, AuthPage
  App.tsx                     — Rutas, estado global, auto-enrich on mount
  main.tsx                    — Entry point
public/
  manifest.json               — PWA manifest (theme violet #7c3aed)
  favicon.svg
```

---

## Notas técnicas

- **iOS Safari zoom en inputs**: iOS hace zoom automático al enfocar un input si su `font-size` es menor a 16px. La app aplica `font-size: 16px` en `@media (pointer: coarse)` para inputs/textarea/select, evitando el zoom sin deshabilitar el pinch-zoom manual ni afectar el diseño en desktop.
- **`referenceStatus`**: cada ejercicio tiene un campo `referenceStatus: 'suggested' | 'accepted' | 'manual' | 'missing'`. El enriquecimiento automático nunca sobreescribe un URL marcado como `'accepted'` o `'manual'`.
- **Modo local sin cuenta**: si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están definidas, `isSupabaseConfigured` es `false`, la pantalla de login no aparece y todo funciona en localStorage.

---

## Mejoras futuras sugeridas

- **Service Worker** para cache offline completo (actualmente el HTML inicial requiere conexión).
- **Notificaciones push** para recordar entrenamientos.
- **Gráficos de progreso** (volumen semanal, grupos musculares, récords).
- **Timer de descanso** entre series con alerta de sonido.
- **Compartir rutinas** vía URL (codificadas en base64, sin backend).
- **Plantillas de rutinas** predefinidas para distintos objetivos.
- **Modo sesión activa**: registrar series en tiempo real durante el entrenamiento.
