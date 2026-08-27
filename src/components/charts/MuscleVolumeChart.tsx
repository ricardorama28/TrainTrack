import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART, rampColor } from './chartTheme';
import { MUSCLE_LABELS } from '../../lib/labels';
import type { MuscleVolume } from '../../lib/volume';

interface MuscleVolumeChartProps {
  data: MuscleVolume[];
}

/** Horizontal bars of working sets per muscle group. */
export function MuscleVolumeChart({ data }: MuscleVolumeChartProps) {
  if (data.length === 0) return null;
  const rows = data.map(d => ({ ...d, label: MUSCLE_LABELS[d.muscleGroup] }));
  const height = Math.max(120, rows.length * 34);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} width={72} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.1)' }}
            contentStyle={{ background: '#141B16', border: 'none', borderRadius: 12, fontSize: 12, color: '#F1F2EC' }}
            labelStyle={{ color: '#9BA197' }}
            formatter={(v: number) => [`${v} series`, 'Trabajo']}
          />
          <Bar dataKey="sets" radius={[0, 6, 6, 0]}>
            {rows.map((r, i) => (
              <Cell key={r.muscleGroup} fill={rampColor(i, rows.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
