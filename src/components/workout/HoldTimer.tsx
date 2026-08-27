import { useEffect, useRef, useState } from 'react';
import { playBeep, vibrate } from '../../lib/feedback';

interface HoldTimerProps {
  /** Target hold duration in seconds. */
  seconds: number;
  /** Fired when the full hold is completed. */
  onComplete: (seconds: number) => void;
  /** Fired when the user stops early; reports the seconds actually held. */
  onStop: (elapsedSeconds: number) => void;
}

function remainingFrom(endsAt: number): number {
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
}

/**
 * Hold (isometric) countdown for time-based exercises like planks. Timestamp-
 * based like RestTimer so locking the phone mid-hold doesn't desync it. On a
 * full cycle it reports completion; stopping early records the time held.
 */
export function HoldTimer({ seconds, onComplete, onStop }: HoldTimerProps) {
  const endsAtRef = useRef(Date.now() + seconds * 1000);
  const [remaining, setRemaining] = useState(() => remainingFrom(endsAtRef.current));
  const finishedRef = useRef(false);

  useEffect(() => {
    const endsAt = endsAtRef.current;
    const tick = () => {
      const r = remainingFrom(endsAt);
      setRemaining(r);
      if (r <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        playBeep();
        vibrate([300, 120, 300]);
        setTimeout(() => onComplete(seconds), 400);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [seconds, onComplete]);

  function handleStop() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onStop(Math.max(0, seconds - remaining));
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = seconds > 0 ? Math.min(1, remaining / seconds) : 0;

  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink-950/98 backdrop-blur-md p-6">
      <p className="mb-8 text-overline uppercase text-accent-400">Aguantá</p>

      <div className="relative w-56 h-56 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#F85F26"
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

      <button
        onClick={handleStop}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base active:scale-95 transition border border-white/10"
      >
        Detener
      </button>
    </div>
  );
}
