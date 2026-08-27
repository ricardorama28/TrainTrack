import { Flame } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Antes: tarjeta con degradado lima (el tópico del "hero con gradiente").
 * Ahora: superficie grafito de marca con la cifra en tipografía display a
 * tamaño real — el dato es el protagonista y el lima queda como acento, no
 * como fondo.
 */
export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  const active = currentStreak > 0;

  return (
    <div className="relative overflow-hidden rounded-hero bg-ink-900 text-white p-5">
      {/* Brasa: el calor sube desde la esquina donde está la llama. */}
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full blur-2xl"
        style={{
          background: active
            ? 'radial-gradient(circle, rgba(248,95,38,0.30), transparent 68%)'
            : 'radial-gradient(circle, rgba(132,215,23,0.14), transparent 68%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-overline uppercase text-white/45">Racha actual</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-display text-metric-xl tabular-nums ${active ? 'text-primary-300' : 'text-white/35'}`}
            >
              {currentStreak}
            </span>
            <span className="text-sm font-medium text-white/50">
              {currentStreak === 1 ? 'día' : 'días'}
            </span>
          </div>
        </div>

        <Flame
          size={30}
          strokeWidth={1.75}
          className={active ? 'text-accent-400 fill-accent-500/25' : 'text-white/20'}
        />
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
        <span className="text-xs text-white/45">Mejor racha</span>
        <span className="text-xs font-semibold tabular-nums text-white/85">{bestStreak} días</span>
      </div>
    </div>
  );
}
