import { useEffect, useRef, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { playBeep, vibrate } from '../../lib/feedback';

interface RestTimerProps {
  /** Absolute epoch-ms timestamp when the rest finishes. */
  endsAt: number;
  /** Total rest duration in seconds (for the progress ring). */
  total: number;
  onDone: () => void;
  onSkip: () => void;
  /** Adjust the rest by ±seconds (parent owns endsAt so it can persist it). */
  onAdjust: (deltaSeconds: number) => void;
}

function remainingFrom(endsAt: number): number {
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
}

/**
 * Timestamp-based rest countdown. Because it derives the remaining time from an
 * absolute `endsAt` (recomputed each tick and whenever the tab regains focus),
 * it stays correct even when the browser throttles or suspends timers while the
 * phone is locked or the app is backgrounded.
 */
export function RestTimer({ endsAt, total, onDone, onSkip, onAdjust }: RestTimerProps) {
  const [remaining, setRemaining] = useState(() => remainingFrom(endsAt));
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;

    const tick = () => {
      const r = remainingFrom(endsAt);
      setRemaining(r);
      if (r <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        playBeep();
        vibrate();
        setTimeout(onDone, 500);
      }
    };

    tick(); // recompute immediately (covers remounts / prop changes)
    const id = setInterval(tick, 250);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [endsAt, onDone]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = total > 0 ? Math.min(1, remaining / total) : 0;

  // SVG progress ring
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink-950/98 backdrop-blur-md p-6">
      <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-semibold mb-8">Descanso</p>

      <div className="relative w-56 h-56 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#84D717"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold text-white tabular-nums leading-none">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <span className="text-gray-500 text-xs mt-2">seg restantes</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => onAdjust(-30)}
          className="px-5 py-3 rounded-xl bg-white/8 text-gray-300 text-sm font-semibold hover:bg-white/15 active:scale-95 transition border border-white/10"
        >
          −30s
        </button>
        <button
          onClick={() => onAdjust(30)}
          className="px-5 py-3 rounded-xl bg-white/8 text-gray-300 text-sm font-semibold hover:bg-white/15 active:scale-95 transition border border-white/10"
        >
          +30s
        </button>
      </div>

      <button
        onClick={onSkip}
        className="w-full max-w-xs inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-ink-950 font-semibold text-base active:scale-95 transition shadow-lg shadow-primary-500/25"
      >
        Saltar descanso <SkipForward size={18} className="fill-current" />
      </button>
    </div>
  );
}
