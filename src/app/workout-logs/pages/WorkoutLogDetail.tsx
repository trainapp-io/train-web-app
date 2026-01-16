import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkoutLog, useDeleteWorkoutLog } from '../../../services/apiHooks';
import './WorkoutLogPages.css';

const WorkoutLogDetail: React.FC = () => {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();
  const { data: workoutLog, isLoading, error } = useWorkoutLog(logId!);
  const deleteWorkoutLogMutation = useDeleteWorkoutLog();

  const handleEdit = () => {
    navigate(`/workout-logs/${logId}/edit`);
  };

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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="workout-log-page">
        <div className="loading-container">
          <p>Loading workout log...</p>
        </div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="workout-log-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>Failed to load workout log</p>
          <button onClick={() => navigate('/workout-logs/history')} className="btn-back">
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-log-page">
      <div className="workout-log-page-header">
        <button onClick={() => navigate('/workout-logs/history')} className="btn-back">
          ← Back to History
        </button>
        <div className="header-actions">
          <button onClick={handleEdit} className="btn-edit">
            Edit
          </button>
          <button onClick={handleDelete} className="btn-delete" disabled={deleteWorkoutLogMutation.isPending}>
            {deleteWorkoutLogMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="workout-log-detail">
        <div className="detail-header">
          <h1>{workoutLog.workoutSnapshot.name}</h1>
          {workoutLog.isCompleted && (
            <span className="status-badge completed">Completed</span>
          )}
        </div>

        {workoutLog.workoutSnapshot.description && (
          <p className="workout-description">{workoutLog.workoutSnapshot.description}</p>
        )}

        <div className="workout-metadata">
          <div className="metadata-item">
            <span className="label">Version:</span>
            <span className="value">v{workoutLog.versionId}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Start:</span>
            <span className="value">{formatDate(workoutLog.actualStartDate)}</span>
          </div>
          <div className="metadata-item">
            <span className="label">End:</span>
            <span className="value">{formatDate(workoutLog.actualEndDate)}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Duration:</span>
            <span className="value">{formatDuration(workoutLog.actualDuration)}</span>
          </div>
        </div>

        {workoutLog.blockLogs && workoutLog.blockLogs.length > 0 && (
          <div className="blocks-section">
            <h2>Blocks</h2>
            {workoutLog.blockLogs.map((blockLog, blockIndex) => {
              const blockSnapshot = workoutLog.workoutSnapshot.blockSnapshot?.[blockIndex];
              if (!blockSnapshot) return null;
              
              return (
                <div key={blockIndex} className={`block-detail ${blockLog.isCompleted ? 'completed' : ''}`}>
                  <div className="block-header">
                    <h3>{blockSnapshot.name || blockSnapshot.type}</h3>
                    {blockLog.isCompleted && <span className="check-icon">✓</span>}
                  </div>
                  
                  <div className="block-stats">
                    <div className="stat">
                      <span className="stat-label">Sets:</span>
                      <span className="stat-value">{blockLog.actualSets || 0} / {blockSnapshot.targetSets || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Rest:</span>
                      <span className="stat-value">{blockLog.actualRest || 0}s</span>
                    </div>
                  </div>

                  <div className="exercises-list">
                    {blockLog.exerciseLogs.map((exerciseLog, exerciseIndex) => {
                      const exerciseSnapshot = blockSnapshot.exerciseSnapshot[exerciseIndex];
                      return (
                        <div key={exerciseIndex} className={`exercise-detail ${exerciseLog.isCompleted ? 'completed' : ''}`}>
                          <div className="exercise-name">
                            {exerciseLog.isCompleted && <span className="check-icon">✓</span>}
                            <span>{exerciseSnapshot.name}</span>
                          </div>
                          <div className="exercise-stats">
                            {exerciseLog.actualReps !== undefined && (
                              <span>Reps: {exerciseLog.actualReps}</span>
                            )}
                            {exerciseLog.actualWeight !== undefined && (
                              <span>Weight: {exerciseLog.actualWeight}</span>
                            )}
                            {exerciseLog.actualDurationSec !== undefined && (
                              <span>Duration: {exerciseLog.actualDurationSec}s</span>
                            )}
                            {exerciseLog.actualDistance !== undefined && (
                              <span>Distance: {exerciseLog.actualDistance}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutLogDetail;
