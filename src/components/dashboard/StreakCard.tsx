import { Flame } from 'lucide-react';
import { Card } from '../ui/Card';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary-400 to-primary-600 border-0 text-ink-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ink-950/70 text-sm font-medium">Racha actual</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-display font-bold tabular-nums">{currentStreak}</span>
            <span className="text-ink-950/70">días</span>
          </div>
        </div>
        <Flame size={44} strokeWidth={1.75} className="text-accent-500 fill-accent-500/25" />
      </div>
      <div className="mt-3 pt-3 border-t border-ink-950/15">
        <p className="text-ink-950/70 text-xs">
          Mejor racha: <span className="font-semibold text-ink-950 tabular-nums">{bestStreak} días</span>
        </p>
      </div>
    </Card>
  );
}
