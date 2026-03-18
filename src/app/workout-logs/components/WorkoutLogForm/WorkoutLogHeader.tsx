import React from 'react';
import { WorkoutSnapshot } from '@trainapp-io/train-core';
import './WorkoutLogForm.css';

interface WorkoutLogHeaderProps {
  workoutSnapshot: WorkoutSnapshot;
  isLive: boolean;
  isTimerRunning: boolean;
  elapsedSeconds: number;
  actualStartDate: Date;
  manualDuration: { hours: number; minutes: number };
  onModeToggle: () => void;
  onStartDateChange: (date: Date) => void;
  onManualDurationChange: (field: 'hours' | 'minutes', value: number) => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const WorkoutLogHeader: React.FC<WorkoutLogHeaderProps> = ({
  workoutSnapshot,
  isLive,
  isTimerRunning,
  elapsedSeconds,
  actualStartDate,
  manualDuration,
  onModeToggle,
  onStartDateChange,
  onManualDurationChange,
}) => {
  return (
    <div className="wl-header">
      <h2>{workoutSnapshot.name}</h2>
      {workoutSnapshot.description && (
        <p className="workout-description">{workoutSnapshot.description}</p>
      )}

      {(workoutSnapshot.difficulty || (workoutSnapshot.category?.length ?? 0) > 0) && (
        <div className="workout-metadata">
          {workoutSnapshot.difficulty && (
            <span className="difficulty-badge">{workoutSnapshot.difficulty}</span>
          )}
          {workoutSnapshot.category?.map((cat, i) => (
            <span key={i} className="category-tag">{cat}</span>
          ))}
        </div>
      )}

      <div className="workout-mode-toggle">
        <button className={`mode-btn ${isLive ? 'active' : ''}`}
          onClick={() => !isLive && onModeToggle()}>Live</button>
        <button className={`mode-btn ${!isLive ? 'active' : ''}`}
          onClick={() => isLive && onModeToggle()}>Historical</button>
      </div>

      {isLive ? (
        <div className="live-timer-section">
          <div className="timer-display">
            <span className="timer-label">Elapsed</span>
            <span className={`timer-value ${isTimerRunning ? 'timer-value--running' : ''}`}>
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>
      ) : (
        <div className="historical-entry-section">
          <div className="time-input-group">
            <label htmlFor="start-time">Workout Date &amp; Time</label>
            <input id="start-time" type="datetime-local" className="time-input"
              value={formatDateTimeLocal(actualStartDate)}
              onChange={(e) => onStartDateChange(new Date(e.target.value))} />
          </div>
          <div className="duration-input-section">
            <label>Duration</label>
            <div className="duration-inputs">
              <div className="duration-input-group">
                <input type="number" className="duration-input" min={0}
                  value={manualDuration.hours}
                  onChange={(e) => onManualDurationChange('hours', parseInt(e.target.value) || 0)} />
                <span className="duration-label">hr</span>
              </div>
              <div className="duration-input-group">
                <input type="number" className="duration-input" min={0} max={59}
                  value={manualDuration.minutes}
                  onChange={(e) => onManualDurationChange('minutes', parseInt(e.target.value) || 0)} />
                <span className="duration-label">min</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogHeader;
