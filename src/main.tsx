import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
// Geist Sans para todo el texto, Geist Mono para todo número que sea un dato.
// Self-hosted: sin salto a fonts.googleapis.com en el primer render.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './index.css';
import { migrateLegacyStorage } from './lib/migrateLegacyStorage';

// Antes del primer render: los hooks leen storage al montar, así que la
// migración tiene que haber corrido para entonces o un usuario que viene de la
// versión anterior vería la app vacía.
migrateLegacyStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
