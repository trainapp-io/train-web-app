import type { WorkoutAnalyticsResponse } from '@trainapp-io/train-core';
import StatCard from './StatCard';
import ActivityHeatmap from './ActivityHeatmap';
import VolumeBarChart from './VolumeBarChart';

interface Props {
  data: WorkoutAnalyticsResponse;
}

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function OverviewTab({ data }: Props) {
  const latestPR = data.personalRecords[0];

  return (
    <div className="wla-overview">
      <div className="wla-stat-grid">
        <StatCard value={String(data.totalWorkouts)} label="Workouts" />
        <StatCard value={formatDuration(data.totalDurationSec)} label="Total Time" />
        <StatCard value={`${data.currentStreak}d`} label="Streak" variant="primary" />
        {latestPR ? (
          <StatCard
            value={`${latestPR.maxWeight} lbs`}
            label={latestPR.exerciseName}
            variant="pr"
          />
        ) : (
          <StatCard value="—" label="Latest PR" />
        )}
      </div>

      <div className="wla-card">
        <div className="wla-card__title">This Month</div>
        <ActivityHeatmap activityByDay={data.activityByDay} month={new Date()} />
      </div>

      <div className="wla-card">
        <div className="wla-card__title">Volume</div>
        <VolumeBarChart data={data.volumeTrend} />
      </div>

      {data.personalRecords.length > 0 && (
        <div className="wla-card">
          <div className="wla-card__title">Personal Records</div>
          {data.personalRecords.map((pr) => (
            <div key={pr.exerciseName} className="wla-pr-row">
              <div className="wla-pr-row__name">{pr.exerciseName}</div>
              <div className="wla-pr-row__right">
                <span className="wla-pr-row__weight">
                  {pr.maxWeight} lbs × {pr.reps}
                </span>
                {pr.isNewPR && <span className="wla-pr-row__badge">NEW PR</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.muscleGroups.length > 0 && (
        <div className="wla-card">
          <div className="wla-card__title">Muscle Groups</div>
          {data.muscleGroups.map((mg) => (
            <div key={mg.group} className="wla-muscle-row">
              <div className="wla-muscle-row__header">
                <span>{mg.group}</span>
                <span>{mg.percentage}%</span>
              </div>
              <div className="wla-muscle-bar">
                <div
                  className="wla-muscle-bar__fill"
                  style={{ width: `${mg.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
