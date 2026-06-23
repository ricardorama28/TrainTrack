import { Card } from '../ui/Card';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary-500 to-primary-600 border-0 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-100 text-sm font-medium">Racha actual</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-bold">{currentStreak}</span>
            <span className="text-primary-100">días</span>
          </div>
        </div>
        <span className="text-5xl">🔥</span>
      </div>
      <div className="mt-3 pt-3 border-t border-primary-400/50">
        <p className="text-primary-100 text-xs">
          Mejor racha: <span className="font-semibold text-white">{bestStreak} días</span>
        </p>
      </div>
    </Card>
  );
}
