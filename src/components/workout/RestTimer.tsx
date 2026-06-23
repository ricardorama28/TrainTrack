import { useEffect, useRef, useState, useCallback } from 'react';

interface RestTimerProps {
  /** Initial countdown duration in seconds */
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}

/** Plays a short beep using the Web Audio API. Best-effort: silent on failure. */
function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available — ignore */
  }
}

function vibrate() {
  try {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  } catch {
    /* ignore */
  }
}

export function RestTimer({ seconds, onDone, onSkip }: RestTimerProps) {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const finishedRef = useRef(false);

  // Countdown tick
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Fire completion exactly once when we hit zero
  useEffect(() => {
    if (remaining === 0 && !finishedRef.current) {
      finishedRef.current = true;
      playBeep();
      vibrate();
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [remaining, onDone]);

  const adjust = useCallback((delta: number) => {
    setRemaining(r => Math.max(0, r + delta));
    setTotal(t => Math.max(0, t + delta));
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = total > 0 ? remaining / total : 0;

  // SVG progress ring
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm p-6">
      <p className="text-gray-400 text-sm uppercase tracking-widest mb-6">Descanso</p>

      <div className="relative w-44 h-44 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white tabular-nums">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => adjust(-30)}
          className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 active:scale-95 transition"
        >
          −30s
        </button>
        <button
          onClick={() => adjust(30)}
          className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 active:scale-95 transition"
        >
          +30s
        </button>
      </div>

      <button
        onClick={onSkip}
        className="px-8 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium active:scale-95 transition"
      >
        Saltar descanso →
      </button>
    </div>
  );
}
