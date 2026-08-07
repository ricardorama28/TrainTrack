import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART } from './chartTheme';
import { formatDateShort } from '../../lib/dates';
import type { WeekVolumePoint } from '../../lib/volume';

interface WeeklyVolumeChartProps {
  data: WeekVolumePoint[];
  metric?: 'volume' | 'sets';
}

/** Supporting line chart: tonnage or working-set count per week. */
export function WeeklyVolumeChart({ data, metric = 'sets' }: WeeklyVolumeChartProps) {
  if (data.length < 2) return null;
  const rows = data.map(p => ({ week: formatDateShort(p.weekStart), value: metric === 'volume' ? Math.round(p.volume) : p.sets }));
  const label = metric === 'volume' ? 'Tonelaje (kg)' : 'Series de trabajo';

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#cbd5e1' }}
            itemStyle={{ color: CHART.accent }}
            formatter={(v: number) => [v, label]}
          />
          <Line type="monotone" dataKey="value" stroke={CHART.accent} strokeWidth={2.5} dot={{ r: 3, fill: CHART.accent }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
