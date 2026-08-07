import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART } from './chartTheme';
import { exerciseMetricKind, type ExercisePerformance } from '../../lib/analytics';
import { formatDateShort } from '../../lib/dates';
import type { MetricKind } from '../../types';

interface ExerciseProgressChartProps {
  performances: ExercisePerformance[];
  metricKind?: MetricKind;
}

/** Pick the y-metric and label according to the nature of the exercise. */
function metricFor(kind: MetricKind): { key: keyof ExercisePerformance; label: string } {
  switch (kind) {
    case 'bodyweight':
      return { key: 'totalReps', label: 'Reps totales' };
    case 'isometric':
      return { key: 'maxSeconds', label: 'Segundos (máx)' };
    default:
      return { key: 'estimated1RM', label: '1RM estimado (kg)' };
  }
}

export function ExerciseProgressChart({ performances, metricKind }: ExerciseProgressChartProps) {
  if (performances.length < 2) return null;

  const kind = exerciseMetricKind(performances, metricKind);
  const { key, label } = metricFor(kind);

  const data = performances.map(p => ({
    date: formatDateShort(p.date),
    value: Math.round(((p[key] as number) ?? 0) * 10) / 10,
  }));

  return (
    <div className="w-full h-44">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#cbd5e1' }}
            itemStyle={{ color: CHART.primaryDim }}
            formatter={(v: number) => [v, label]}
          />
          <Line type="monotone" dataKey="value" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 3, fill: CHART.primary }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
