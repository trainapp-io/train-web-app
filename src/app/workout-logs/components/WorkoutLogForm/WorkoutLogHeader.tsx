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
  onFinish: () => void;
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
  onFinish,
}) => {
  return (
    <div className="wl-header">
      {/* Row 1: name + finish */}
      <div className="wl-header__top">
        <span className="wl-header__name">{workoutSnapshot.name}</span>
        <button className="wl-header__finish-btn" onClick={onFinish} type="button">
          Finish
        </button>
      </div>

      {/* Row 2: timer display only */}
      {isLive && (
        <div className="wl-timer-row">
          <span className={`wl-elapsed${!isTimerRunning ? ' wl-elapsed--paused' : ''}`}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* Mode toggle — less prominent */}
      <div className="wl-mode-toggle">
        <button className="wl-mode-link" onClick={onModeToggle} type="button">
          {isLive ? 'Switch to historical entry' : 'Switch to live timer'}
        </button>
      </div>

      {/* Historical entry fields */}
      {!isLive && (
        <div className="wl-historical">
          <div>
            <label htmlFor="wl-start-time">Workout Date &amp; Time</label>
            <input
              id="wl-start-time"
              type="datetime-local"
              value={formatDateTimeLocal(actualStartDate)}
              onChange={(e) => onStartDateChange(new Date(e.target.value))}
            />
          </div>
          <div>
            <label>Duration</label>
            <div className="wl-duration-row">
              <div className="wl-duration-group">
                <input
                  type="number" min={0}
                  value={manualDuration.hours}
                  onChange={(e) => onManualDurationChange('hours', parseInt(e.target.value) || 0)}
                  aria-label="Hours"
                />
                <span className="wl-duration-unit">hr</span>
              </div>
              <div className="wl-duration-group">
                <input
                  type="number" min={0} max={59}
                  value={manualDuration.minutes}
                  onChange={(e) => onManualDurationChange('minutes', parseInt(e.target.value) || 0)}
                  aria-label="Minutes"
                />
                <span className="wl-duration-unit">min</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogHeader;
