/** @type {import('tailwindcss').Config} */
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
        // Base dark on-brand — GRAFITO VERDOSO
        ink: {
          600: '#26312A',
          700: '#1B241D',
          800: '#141B16',
          900: '#0E1411',
          950: '#0A0F0C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
