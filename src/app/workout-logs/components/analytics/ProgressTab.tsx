import type { WorkoutAnalyticsResponse, VolumeTrendPoint } from '@trainapp-io/train-core';
import { useExerciseProgress } from '../../../../services/apiHooks';
import StrengthLineChart from './StrengthLineChart';
import VolumeBarChart from './VolumeBarChart';

interface Props {
  analytics: WorkoutAnalyticsResponse;
  selectedExercise: string;
  onSelectExercise: (name: string) => void;
}

export default function ProgressTab({ analytics, selectedExercise, onSelectExercise }: Props) {
  const { data: progressData, isLoading } = useExerciseProgress(
    selectedExercise,
    !!selectedExercise
  );

  const exerciseNames = analytics.exerciseStats.map((e) => e.name);

  const volumeChartData: VolumeTrendPoint[] =
    progressData?.sessionHistory.map((s) => ({
      label: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      volumeLbs: s.totalVolumeLbs,
      workoutCount: 1,
    })) ?? [];

  const mostRecentSession =
    progressData?.sessionHistory[progressData.sessionHistory.length - 1];

  return (
    <div className="wla-progress">
      <div className="wla-card">
        <select
          className="wla-exercise-select"
          value={selectedExercise}
          onChange={(e) => onSelectExercise(e.target.value)}
          aria-label="Select exercise"
        >
          <option value="">Select an exercise...</option>
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {!selectedExercise && (
        <div className="wla-empty">Select an exercise to see your progress</div>
      )}

      {selectedExercise && isLoading && (
        <div className="wla-skeleton-card" aria-label="Loading progress" />
      )}

      {selectedExercise && !isLoading && !progressData && (
        <div className="wla-empty">
          No data yet — log this exercise to see your progress
        </div>
      )}

      {progressData && progressData.progressOverTime.length > 0 && (
        <>
          <div className="wla-exercise-pr-card">
            <div className="wla-exercise-pr-card__title">All-Time PR</div>
            <div className="wla-exercise-pr-card__weight">
              {progressData.allTimePR.weight} lbs × {progressData.allTimePR.reps}
            </div>
            <div className="wla-exercise-pr-card__1rm">
              Est. 1RM: {progressData.allTimePR.estimatedOneRepMax} lbs
            </div>
          </div>

          <div className="wla-card">
            <div className="wla-card__title">Estimated 1RM Over Time</div>
            <StrengthLineChart data={progressData.progressOverTime} />
          </div>

          <div className="wla-card">
            <div className="wla-card__title">Volume Per Session</div>
            <VolumeBarChart data={volumeChartData} />
          </div>

          {mostRecentSession && (
            <div className="wla-card">
              <div className="wla-card__title">
                Last Session —{' '}
                {new Date(mostRecentSession.date + 'T00:00:00').toLocaleDateString()}
              </div>
              <table className="wla-set-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Weight</th>
                    <th>Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {mostRecentSession.sets.map((set, i) => (
                    <tr
                      key={i}
                      className={
                        !set.isCompleted ? 'wla-set-table__row--incomplete' : undefined
                      }
                    >
                      <td>{i + 1}</td>
                      <td>{set.weight} lbs</td>
                      <td>{set.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
