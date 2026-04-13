import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { VolumeTrendPoint } from '@trainapp-io/train-core';

interface Props {
  data: VolumeTrendPoint[];
}

export default function VolumeBarChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="wla-chart-empty">No volume data for this period</div>;
  }

  const maxVol = Math.max(...data.map((d) => d.volumeLbs));
  const maxIdx = data.findIndex((d) => d.volumeLbs === maxVol);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: unknown) => [`${Number(value).toLocaleString()} lbs`, 'Volume']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f3' }}
        />
        <Bar dataKey="volumeLbs" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={index === maxIdx ? '#7c3aed' : '#c4b5fd'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
