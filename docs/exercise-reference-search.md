# Búsqueda automática de referencias (Nivel 2) — Diseño

Estado: **diseñado, no implementado**. La app funciona hoy sin esto, usando la
base local de conocimiento (`src/data/exerciseKnowledgeBase.ts`) y la búsqueda
manual (deep-links a YouTube/Google). Este documento describe cómo enchufar la
búsqueda automática externa de forma segura cuando se decida implementarla.

## Objetivo

Para los ejercicios que **no** están en la base local, traer automáticamente una
referencia visual sugerida (video corto de técnica) sin:

- exponer API keys en el frontend,
- romper el funcionamiento local-first,
- requerir login.

## Arquitectura recomendada: serverless function (Opción 3)

```
Frontend (estático)
   │  GET /api/exercise-reference?q=hip+thrust
   ▼
Serverless function  ──(API key como env var, server-side)──▶  YouTube Data API
   │  { url, type, title, thumbnailUrl }  | 204 sin resultado
   ▼
Frontend muestra "Referencia sugerida" → usuario acepta / cambia / descarta
```

### Por qué serverless y no key en el frontend

Una API key embebida en el bundle (o en localStorage del usuario) viaja en la
red y es visible. Aunque YouTube permite restringir por *HTTP referrer*, la key
sigue expuesta y la cuota es fácil de agotar por terceros. La función serverless
mantiene la key **solo en el servidor** (`process.env.YOUTUBE_API_KEY`).

### Contrato del endpoint

`GET /api/exercise-reference?q=<nombre del ejercicio>`

Respuesta `200`:

```json
{
  "url": "https://www.youtube.com/watch?v=XXXX",
  "type": "youtube_short",
  "title": "Hip Thrust — técnica correcta",
  "thumbnailUrl": "https://i.ytimg.com/vi/XXXX/hqdefault.jpg"
}
```

Respuesta `204`: sin resultado útil. Cualquier error/red caída → el frontend cae
al fallback manual (Nivel 3).

### Lógica de la función

1. Validar `q` (no vacío, longitud razonable).
2. Llamar a YouTube `search.list`:
   - `part=snippet`, `type=video`, `videoEmbeddable=true`
   - `videoDuration=short` (prioriza videos cortos/claros)
   - `safeSearch=strict`, `maxResults=3`
   - `q = "<nombre> ejercicio técnica"`
3. Tomar el **primer** resultado y devolver `url`, `type`, `title`, `thumbnailUrl`.
4. Opcional: lista negra de canales/keywords de baja calidad.

### Integración en el frontend (ya preparada)

- `Settings.externalSearch` ya existe (toggle, hoy deshabilitado en la UI).
- Crear `ReferenceProvider` con dos implementaciones:
  - `localKbProvider` (síncrono, ya cubierto por `enrichExerciseFromKnowledgeBase`).
  - `serverlessProvider.search(q)` → `fetch('/api/exercise-reference?q=...')`.
- Flujo: si `externalSearch` activo y el ejercicio no tiene referencia, llamar al
  provider; guardar el resultado con `referenceStatus: 'suggested'` y
  `referenceSource: 'youtube_api'`. **Nunca** auto-aceptar (solo la base local
  auto-acepta). El usuario confirma con "Aceptar".
- **Cache**: guardar el resultado por `nameLower` en localStorage para no repetir
  búsquedas y respetar la cuota.

### Cuota y costos

- YouTube free tier: 10.000 unidades/día; `search.list` = 100 unidades →
  ~100 búsquedas/día. Suficiente con el cache (cada ejercicio se busca una vez).

### Detección de disponibilidad

El mismo build estático funciona con o sin función. El frontend hace
feature-detection: si `fetch('/api/exercise-reference')` da 404/red caída, se
oculta/deshabilita la búsqueda externa y queda el fallback manual.

## Alternativas evaluadas

| Opción | Veredicto |
|---|---|
| YouTube API directa desde frontend | ❌ expone la key |
| BYOK (key del usuario en localStorage) | ⚠️ solo uso 100% personal |
| **Serverless function** | ✅ recomendada |
| Scraping | ❌ frágil, viola ToS — descartado |

## Plataformas posibles para la función

Vercel (`/api/*.ts`), Netlify Functions, o Cloudflare Workers. En todas, la key
va como variable de entorno del proyecto, nunca en el repo ni en el bundle.
