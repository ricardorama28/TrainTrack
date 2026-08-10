import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { storage } from '../lib/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time exceptions anywhere below it so a single bad/legacy data
 * record can never leave the user staring at a blank white screen. Shows the
 * real error (collapsible, for debugging) plus two recovery paths:
 *  - Reintentar: re-mount the tree (useful for transient errors).
 *  - Borrar datos locales y recargar: wipe localStorage and reload — the
 *    escape hatch when local state is poisoned.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  handleReset = (): void => {
    try {
      storage.clearAll();
    } catch (e) {
      console.error('Failed to clear local data:', e);
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="flex justify-center"><AlertTriangle size={44} className="text-accent-500" /></div>
          <h1 className="mt-3 text-xl font-display font-bold text-gray-900 dark:text-white">
            Algo salió mal
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            La app encontró un problema al cargar tus datos. Probá reintentar; si sigue
            fallando, borrá los datos guardados en este dispositivo.
          </p>

          <div className="mt-5 space-y-2">
            <button
              onClick={this.handleRetry}
              className="w-full px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-red-500 dark:text-red-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Borrar datos locales y recargar
            </button>
          </div>

          <details className="mt-5 text-left">
            <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
              Detalles técnicos
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-100 dark:bg-gray-900 p-2 text-[11px] text-gray-600 dark:text-gray-300">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
