import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
// Geist Sans para todo el texto, Geist Mono para todo número que sea un dato.
// Self-hosted: sin salto a fonts.googleapis.com en el primer render.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
