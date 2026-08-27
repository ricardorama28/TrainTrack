import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Wordmark } from '../components/brand/Wordmark';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

/** Official multicolor Google "G", inlined so no keyboard emoji is used. */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

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
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-5 py-10">
      {/* Primera impresión: el halo de marca en vez de un fondo plano. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 brand-halo" aria-hidden="true" />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Sin ícono adosado: acá la marca denominativa va sola, a tamaño
            grande. Dos elementos de marca juntos compiten. */}
        <div className="text-center">
          <h1>
            <Wordmark className="text-4xl" />
          </h1>
          <p className="mt-3 text-caption text-content-muted">
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
            <div className="bg-sea-500/8 ring-1 ring-inset ring-sea-500/15 rounded-xl p-3 text-caption text-sea-700 dark:text-sea-300">
              {info}
            </div>
          )}

          <Button type="submit" fullWidth disabled={busy}>
            {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-caption text-content-subtle">o</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <Button variant="secondary" fullWidth disabled={busy} onClick={handleGoogle}>
          <GoogleIcon /> Continuar con Google
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
            className="text-caption text-content-subtle underline-offset-4 hover:text-content hover:underline"
          >
            Usar sin cuenta en este dispositivo
          </button>
        </div>
      </div>
    </div>
  );
}
