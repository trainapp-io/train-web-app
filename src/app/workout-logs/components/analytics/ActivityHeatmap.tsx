import type { ActivityDay } from '@trainapp-io/train-core';

interface Props {
  activityByDay: ActivityDay[];
  month: Date;
}

function getIntensity(count: number): 0 | 1 | 2 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  return 2;
}

export default function ActivityHeatmap({ activityByDay, month }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate: Record<string, number> = {};
  for (const d of activityByDay) {
    byDate[d.date] = d.count;
  }

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startPad = firstDay.getDay(); // 0=Sun

  const cells: Array<{ date: Date | null; count: number }> = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ date: null, count: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIdx, d);
    const key = date.toISOString().split('T')[0];
    cells.push({ date, count: byDate[key] ?? 0 });
  }

  return (
    <div className="wla-heatmap-grid" aria-label="Activity heatmap">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
        <div key={i} className="wla-heatmap-day-label">{label}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell.date) {
          return <div key={`pad-${i}`} className="wla-heatmap-day wla-heatmap-day--empty" />;
        }
        const isFuture = cell.date > today;
        const isToday = cell.date.getTime() === today.getTime();
        const intensity = isFuture ? 'future' : getIntensity(cell.count);
        return (
          <div
            key={i}
            className={`wla-heatmap-day${isToday ? ' wla-heatmap-day--today' : ''}`}
            data-intensity={intensity}
            title={`${cell.date.toLocaleDateString()}: ${cell.count} workout${cell.count !== 1 ? 's' : ''}`}
          />
        );
      })}
    </div>
  );
}
