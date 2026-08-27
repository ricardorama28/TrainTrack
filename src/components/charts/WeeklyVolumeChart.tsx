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
            contentStyle={{ background: '#141B16', border: 'none', borderRadius: 12, fontSize: 12, color: '#F1F2EC' }}
            labelStyle={{ color: '#9BA197' }}
            itemStyle={{ color: CHART.primary }}
            formatter={(v: number) => [v, label]}
          />
          <Line type="monotone" dataKey="value" stroke={CHART.line} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART.line }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
