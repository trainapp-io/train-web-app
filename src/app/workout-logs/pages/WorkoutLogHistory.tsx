import React from 'react';
import { useNavigate } from 'react-router';
import { useWorkoutLogHistory } from '../../../services/apiHooks';
import './WorkoutLogPages.css';

const WorkoutLogHistory: React.FC = () => {
  const navigate = useNavigate();
  const { data: workoutLogs, isLoading, error } = useWorkoutLogHistory();

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleLogClick = (logId: string) => {
    navigate(`/workout-logs/${logId}`);
  };

  const handleLogWorkout = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="workout-log-page">
        <div className="loading-container">
          <p>Loading workout history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workout-log-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>Failed to load workout history</p>
        </div>
      </div>
    );
  }

  if (!workoutLogs || workoutLogs.length === 0) {
    return (
      <div className="workout-log-page">
        <div className="workout-log-page-header">
          <h1>Workout History</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No workouts logged yet</h2>
          <p>Start tracking your fitness journey by logging your first workout!</p>
          <button onClick={handleLogWorkout} className="btn-primary">
            Log Your First Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-log-page">
      <div className="workout-log-page-header">
        <h1>Workout History</h1>
        <button onClick={handleLogWorkout} className="btn-primary">
          Log Another Workout
        </button>
      </div>

      <div className="workout-log-list">
        {workoutLogs.map((log) => (
          <div
            key={log.id}
            className="workout-log-card"
            onClick={() => handleLogClick(log.id)}
          >
            <div className="card-header">
              <h3>{log.workoutSnapshot.name}</h3>
              {log.isCompleted && (
                <span className="status-badge completed">Completed</span>
              )}
            </div>

            {log.workoutSnapshot.description && (
              <p className="card-description">{log.workoutSnapshot.description}</p>
            )}

            <div className="card-metadata">
              <div className="metadata-row">
                <span className="metadata-label">Date:</span>
                <span className="metadata-value">{formatDate(log.actualStartDate)}</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Duration:</span>
                <span className="metadata-value">{formatDuration(log.actualDuration)}</span>
              </div>
              {log.blockLogs && (
                <div className="metadata-row">
                  <span className="metadata-label">Blocks:</span>
                  <span className="metadata-value">{log.blockLogs.length}</span>
                </div>
              )}
              <div className="metadata-row">
                <span className="metadata-label">Version:</span>
                <span className="metadata-value">v{log.versionId}</span>
              </div>
            </div>

            {log.blockLogs && (
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">Completed Blocks</span>
                  <span className="stat-value">
                    {log.blockLogs.filter(b => b.isCompleted).length} / {log.blockLogs.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutLogHistory;
