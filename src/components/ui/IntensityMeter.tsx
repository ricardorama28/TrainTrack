import type { FeelingType } from '../../types';

// Effort / RIR meter — replaces the 😊😐😤🥵 faces with a 4-level segmented
// bar that ramps lime → amber (Fácil → Máx). No emoji.

const LEVELS: { value: FeelingType; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Difícil' },
  { value: 'very-hard', label: 'Máx' },
];

const INDEX: Record<FeelingType, number> = { easy: 0, normal: 1, hard: 2, 'very-hard': 3 };

// Bar fill color for a given selected level (0-3): lime for low effort → amber for max.
const FILL = ['bg-primary-500', 'bg-primary-400', 'bg-accent-400', 'bg-accent-500'];
const HEIGHTS = ['h-2', 'h-3', 'h-4', 'h-5'];

interface IntensityMeterProps {
  value?: FeelingType | '';
  onChange?: (v: FeelingType) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';
  /** Force the dark palette (for the always-dark guided-session screen). */
  dark?: boolean;
}

/** Bars filled up to `level` in that level's color; the rest muted. */
function Bars({ level, size, mutedClass }: { level: number; size: 'sm' | 'md'; mutedClass: string }) {
  const scale = size === 'sm' ? ['h-1.5', 'h-2', 'h-2.5', 'h-3'] : HEIGHTS;
  return (
    <div className="flex items-end gap-0.5">
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${scale[i]} ${
            level >= 0 && i <= level ? FILL[level] : mutedClass
          }`}
        />
      ))}
    </div>
  );
}

export function IntensityMeter({ value, onChange, readOnly = false, size = 'md', dark = false }: IntensityMeterProps) {
  const level = value ? INDEX[value] : -1;
  const muted = dark ? 'bg-ink-600' : 'bg-gray-200 dark:bg-gray-600';

  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
        <Bars level={level} size="sm" mutedClass={muted} />
        {level >= 0 && <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{LEVELS[level].label}</span>}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {LEVELS.map((l, i) => {
        const active = level === i;
        const inactiveBorder = dark ? 'border-ink-600 hover:border-ink-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
        const inactiveLabel = dark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400';
        const activeLabel = dark ? 'text-primary-400' : 'text-primary-600 dark:text-primary-300';
        return (
          <button
            key={l.value}
            type="button"
            onClick={() => onChange?.(l.value)}
            className={`flex-1 flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition-all ${
              active ? 'border-primary-500 bg-primary-500/10' : inactiveBorder
            }`}
          >
            <Bars level={i} size={size} mutedClass={muted} />
            <span className={`text-[11px] font-semibold ${active ? activeLabel : inactiveLabel}`}>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
