/** @type {import('tailwindcss').Config} */

/* Semantic token helper: reads the CSS variables declared in index.css so a
   single utility (`bg-surface`, `text-muted`) resolves correctly in both
   themes — no `dark:` twin required. `<alpha-value>` keeps opacity modifiers
   (`bg-surface/60`) working. */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Marca / progreso — LIMA ELÉCTRICO
        primary: {
          50:  '#F5FEE7',
          100: '#E7FCC4',
          200: '#D3F996',
          300: '#B7F03A',
          400: '#9BE31C',
          500: '#84D717',
          600: '#6BB50F',
          700: '#518A0E',
          800: '#3E6912',
          900: '#2F4E14',
          950: '#16240A',
        },
        // Señal cálida — ÁMBAR/CORAL (racha · PR · esfuerzo)
        accent: {
          50:  '#FFF3ED',
          100: '#FFE1D2',
          200: '#FFC1A3',
          300: '#FF9F73',
          400: '#FF7A45',
          500: '#F85F26',
          600: '#E24717',
          700: '#BB3512',
          800: '#8F2A12',
          900: '#6E2411',
        },
        /* Frío de apoyo — VERDE AZULADO APAGADO. Único hue frío del sistema:
           reemplaza al blue/teal/cyan/purple/yellow sueltos de Tailwind que
           convertían los badges y los gráficos en un arcoíris. */
        sea: {
          50:  '#EFF7F5',
          100: '#D6EAE6',
          200: '#AFD5CE',
          300: '#7FB8B0',
          400: '#529A93',
          500: '#377D78',
          600: '#2A6461',
          700: '#244F4D',
          800: '#1E3F3E',
          900: '#182F2F',
        },

        // Base dark on-brand — GRAFITO VERDOSO
        ink: {
          600: '#26312A',
          700: '#1B241D',
          800: '#141B16',
          900: '#0E1411',
          950: '#0A0F0C',
        },

        /* Rampa neutral de marca. Sustituye a la `gray` de Tailwind: los pasos
           claros (50–300) son papel cálido y los oscuros (700–950) grafito
           verdoso, así el mismo nombre de utilidad sirve para el tema claro
           (`bg-gray-100`) y el oscuro (`dark:bg-gray-800`) sin que aparezcan
           los grises fríos genéricos que rompían la paleta. */
        gray: {
          50:  '#FAFAF7',
          100: '#F1F2EC',
          200: '#E3E5DB',
          300: '#CBCEC2',
          400: '#8B9187',
          500: '#656C63',
          600: '#4A524A',
          700: '#2C352E',
          800: '#1B241D',
          900: '#0E1411',
          950: '#0A0F0C',
        },

        // Tokens semánticos (ver `index.css`): una sola clase por rol,
        // válida en claro y oscuro.
        canvas:      token('--c-canvas'),
        surface:     token('--c-surface'),
        'surface-2': token('--c-surface-2'),
        'surface-3': token('--c-surface-3'),
        hairline:    token('--c-hairline'),
        'hairline-strong': token('--c-hairline-strong'),
        content: {
          DEFAULT: token('--c-text'),
          muted:   token('--c-text-muted'),
          subtle:  token('--c-text-subtle'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Escala editorial: cifras protagonistas + microtipografía legible.
        'metric-xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '700' }],
        'metric-lg': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.035em', fontWeight: '700' }],
        'metric':    ['1.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'overline':  ['0.6875rem', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        // Radios escalonados: contenedor > tarjeta > control > chip.
        'card': '1.25rem',
        'hero': '1.75rem',
        'sheet': '1.75rem',
      },
      boxShadow: {
        // La profundidad se reserva para lo que flota; las tarjetas usan filete.
        'lift':  '0 1px 2px rgb(14 20 17 / 0.04), 0 8px 24px -12px rgb(14 20 17 / 0.14)',
        'float': '0 2px 6px rgb(14 20 17 / 0.06), 0 18px 40px -16px rgb(14 20 17 / 0.28)',
        'dock':  '0 8px 32px -8px rgb(10 15 12 / 0.45)',
        'glow':  '0 0 0 1px rgb(132 215 23 / 0.35), 0 10px 30px -12px rgb(132 215 23 / 0.45)',
      },
      keyframes: {
        'rise-in': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'sheet-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'meter': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'rise-in':  'rise-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in':  'fade-in 200ms ease-out both',
        'meter':    'meter 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
