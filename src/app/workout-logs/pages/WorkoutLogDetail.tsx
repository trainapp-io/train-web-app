import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkoutLog, useDeleteWorkoutLog } from '../../../services/apiHooks';
import type { ExerciseLog } from '@trainapp-io/train-core';
import '../components/analytics/WorkoutAnalytics.css';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function ExerciseCard({ exercise }: { exercise: ExerciseLog }) {
  const completedSets = exercise.setLogs?.filter((s) => s.isCompleted) ?? [];
  const totalSets = exercise.setLogs?.length ?? 0;

  return (
    <div className="wld-exercise-card">
      <div className="wld-exercise-card__header">
        <span className="wld-exercise-card__name">{exercise.name}</span>
        <span className={`wla-status-badge ${completedSets.length === totalSets && totalSets > 0 ? 'wla-status-badge--done' : 'wla-status-badge--partial'}`}>
          {completedSets.length}/{totalSets} sets
        </span>
      </div>

      {exercise.setLogs && exercise.setLogs.length > 0 ? (
        <table className="wla-set-table">
          <thead>
            <tr>
              <th>Set</th>
              {exercise.setLogs.some((s) => s.actualWeight !== undefined) && <th>Weight</th>}
              {exercise.setLogs.some((s) => s.actualReps !== undefined) && <th>Reps</th>}
              {exercise.setLogs.some((s) => s.actualDurationSec !== undefined) && <th>Duration</th>}
              {exercise.setLogs.some((s) => s.actualDistance !== undefined) && <th>Distance</th>}
            </tr>
          </thead>
          <tbody>
            {exercise.setLogs.map((set, i) => (
              <tr key={i} className={!set.isCompleted ? 'wla-set-table__row--incomplete' : undefined}>
                <td>{i + 1}</td>
                {exercise.setLogs!.some((s) => s.actualWeight !== undefined) && (
                  <td>{set.actualWeight !== undefined ? `${set.actualWeight} lbs` : '—'}</td>
                )}
                {exercise.setLogs!.some((s) => s.actualReps !== undefined) && (
                  <td>{set.actualReps !== undefined ? set.actualReps : '—'}</td>
                )}
                {exercise.setLogs!.some((s) => s.actualDurationSec !== undefined) && (
                  <td>{set.actualDurationSec !== undefined ? `${set.actualDurationSec}s` : '—'}</td>
                )}
                {exercise.setLogs!.some((s) => s.actualDistance !== undefined) && (
                  <td>{set.actualDistance !== undefined ? set.actualDistance : '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="wld-exercise-card__no-sets">No set data recorded</p>
      )}
    </div>
  );
}

const WorkoutLogDetail: React.FC = () => {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();
  const { data: workoutLog, isLoading, error } = useWorkoutLog(logId!);
  const deleteWorkoutLogMutation = useDeleteWorkoutLog();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        await deleteWorkoutLogMutation.mutateAsync({ params: logId!, data: {} });
        navigate('/workout-logs/history');
      } catch (err) {
        console.error('Error deleting workout log:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="wla-page">
        <div className="wla-body">
          <div className="wla-skeleton">
            <div className="wla-skeleton-card" />
            <div className="wla-skeleton-card" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="wla-page">
        <div className="wla-body">
          <div className="wla-empty-state">
            <div className="wla-empty-state__icon">⚠️</div>
            <h2 className="wla-empty-state__title">Workout not found</h2>
            <p className="wla-empty-state__sub">This log may have been deleted.</p>
          </div>
        </div>
      </div>
    );
  }

  // Collect all exercise logs across all blocks
  const allExercises: ExerciseLog[] = workoutLog.blockLogs?.flatMap((b) => b.exerciseLogs) ?? workoutLog.exerciseLogs ?? [];

  return (
    <div className="wla-page">
      {/* Header */}
      <div className="wla-header">
        <div className="wla-header__top">
          <button className="wld-back-btn" onClick={() => navigate('/workout-logs/history')}>
            ← History
          </button>
          <div className="wld-header-actions">
            <button className="wld-edit-btn" onClick={() => navigate(`/workout-logs/${logId}/edit`)}>
              Edit
            </button>
            <button
              className="wld-delete-btn"
              onClick={handleDelete}
              disabled={deleteWorkoutLogMutation.isPending}
            >
              {deleteWorkoutLogMutation.isPending ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="wla-body">
        {/* Title + status */}
        <div className="wld-title-row">
          <h1 className="wld-title">{workoutLog.workoutSnapshot.name}</h1>
          <span className={`wla-status-badge ${workoutLog.isCompleted ? 'wla-status-badge--done' : 'wla-status-badge--partial'}`}>
            {workoutLog.isCompleted ? 'Completed' : 'Partial'}
          </span>
        </div>

        {/* Meta card */}
        <div className="wla-card">
          <div className="wld-meta-grid">
            <div className="wld-meta-item">
              <span className="wld-meta-label">Start</span>
              <span className="wld-meta-value">{formatDate(workoutLog.actualStartDate)}</span>
            </div>
            <div className="wld-meta-item">
              <span className="wld-meta-label">End</span>
              <span className="wld-meta-value">{formatDate(workoutLog.actualEndDate)}</span>
            </div>
            <div className="wld-meta-item">
              <span className="wld-meta-label">Duration</span>
              <span className="wld-meta-value">{formatDuration(workoutLog.actualDuration)}</span>
            </div>
            <div className="wld-meta-item">
              <span className="wld-meta-label">Version</span>
              <span className="wld-meta-value">v{workoutLog.versionId}</span>
            </div>
          </div>
        </div>

        {/* Exercises */}
        {allExercises.length > 0 && (
          <>
            <p className="wld-section-label">Exercises</p>
            {allExercises.map((exercise, i) => (
              <ExerciseCard key={i} exercise={exercise} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutLogDetail;
