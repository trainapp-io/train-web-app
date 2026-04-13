import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ExerciseProgressPoint } from '@trainapp-io/train-core';

interface Props {
  data: ExerciseProgressPoint[];
}

export default function StrengthLineChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="wla-chart-empty">Log more sessions to see your strength curve</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            new Date(v + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }
        />
        <Tooltip
          formatter={(value: unknown) => [`${value} lbs`, 'Est. 1RM']}
          labelFormatter={(label: unknown) =>
            new Date(String(label) + 'T00:00:00').toLocaleDateString()
          }
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f3' }}
        />
        <Line
          type="monotone"
          dataKey="estimatedOneRepMax"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ fill: '#7c3aed', r: 4 }}
          activeDot={{ r: 6, fill: '#5b21b6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
