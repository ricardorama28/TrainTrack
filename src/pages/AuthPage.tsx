import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, enterLocalOnly } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setInfo('Cuenta creada. Si tu proyecto requiere confirmación por email, revisá tu casilla antes de iniciar sesión.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // Redirects away; on return onAuthStateChange picks up the session.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">💪</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TrainTrack</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'signin' ? 'Iniciá sesión para sincronizar tus datos' : 'Creá tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="vos@email.com"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
              {info}
            </div>
          )}

          <Button type="submit" fullWidth disabled={busy}>
            {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <Button variant="secondary" fullWidth disabled={busy} onClick={handleGoogle}>
          <span className="text-base">🔵</span> Continuar con Google
        </Button>

        <div className="text-center text-sm">
          {mode === 'signin' ? (
            <button
              onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              ¿No tenés cuenta? Registrate
            </button>
          ) : (
            <button
              onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              ¿Ya tenés cuenta? Iniciá sesión
            </button>
          )}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={enterLocalOnly}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
          >
            Usar sin cuenta en este dispositivo
          </button>
        </div>
      </div>
    </div>
  );
}
