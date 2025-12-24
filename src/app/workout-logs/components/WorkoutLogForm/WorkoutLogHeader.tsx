import React, { useState, useEffect } from 'react';
import { WorkoutSnapshot } from '@trainapp-io/train-core';
import './WorkoutLogForm.css';

interface WorkoutLogHeaderProps {
  workoutSnapshot: WorkoutSnapshot;
  actualStartDate: Date;
  actualEndDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onDurationChange: (duration: number) => void;
}

const WorkoutLogHeader: React.FC<WorkoutLogHeaderProps> = ({
  workoutSnapshot,
  actualStartDate,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
}) => {
  const [isLive, setIsLive] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualDuration, setManualDuration] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (isLive && isTimerRunning) {
      const totalSeconds = elapsedSeconds;
      onDurationChange(totalSeconds);
      
      // Update end date based on elapsed time
      const newEndDate = new Date(actualStartDate.getTime() + totalSeconds * 1000);
      onEndDateChange(newEndDate);
    }
  }, [elapsedSeconds, isLive, isTimerRunning, actualStartDate]);

  useEffect(() => {
    if (!isLive) {
      const totalSeconds = manualDuration.hours * 3600 + manualDuration.minutes * 60;
      onDurationChange(totalSeconds);
      
      // Update end date based on manual duration
      const newEndDate = new Date(actualStartDate.getTime() + totalSeconds * 1000);
      onEndDateChange(newEndDate);
    }
  }, [manualDuration, isLive, actualStartDate]);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartDateChange(new Date(e.target.value));
  };

  const handleStartTimer = () => {
    if (!isTimerRunning) {
      onStartDateChange(new Date());
    }
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    onStartDateChange(new Date());
  };

  const handleModeToggle = () => {
    setIsLive(!isLive);
    setIsTimerRunning(false);
    setElapsedSeconds(0);
  };

  const handleManualDurationChange = (field: 'hours' | 'minutes', value: number) => {
    setManualDuration(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  };

  return (
    <div>
      <h2>{workoutSnapshot.name}</h2>
      {workoutSnapshot.description && (
        <p className="workout-description">{workoutSnapshot.description}</p>
      )}
      
      <div className="workout-metadata">
        {workoutSnapshot.difficulty && (
          <span className="difficulty-badge">{workoutSnapshot.difficulty}</span>
        )}
        {workoutSnapshot.category && workoutSnapshot.category.length > 0 && (
          <div className="category-tags">
            {workoutSnapshot.category.map((cat, idx) => (
              <span key={idx} className="category-tag">{cat}</span>
            ))}
          </div>
        )}
      </div>

      <div className="workout-mode-toggle">
        <button
          type="button"
          className={`mode-btn ${isLive ? 'active' : ''}`}
          onClick={() => !isLive && handleModeToggle()}
        >
          Live Workout
        </button>
        <button
          type="button"
          className={`mode-btn ${!isLive ? 'active' : ''}`}
          onClick={() => isLive && handleModeToggle()}
        >
          Historical Entry
        </button>
      </div>

      {isLive ? (
        <div className="live-timer-section">
          <div className="timer-display">
            <span className="timer-label">Elapsed Time:</span>
            <span className="timer-value">{formatElapsedTime(elapsedSeconds)}</span>
          </div>
          <div className="timer-controls">
            {!isTimerRunning ? (
              <button type="button" className="timer-btn start-btn" onClick={handleStartTimer}>
                {elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}
              </button>
            ) : (
              <button type="button" className="timer-btn pause-btn" onClick={handlePauseTimer}>
                Pause
              </button>
            )}
            {elapsedSeconds > 0 && (
              <button type="button" className="timer-btn reset-btn" onClick={handleResetTimer}>
                Reset
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="historical-entry-section">
          <div className="time-input-group">
            <label htmlFor="start-time">Workout Date & Time</label>
            <input
              id="start-time"
              type="datetime-local"
              value={formatDateTimeLocal(actualStartDate)}
              onChange={handleStartDateChange}
              className="time-input"
            />
          </div>
          <div className="duration-input-section">
            <label>Workout Duration</label>
            <div className="duration-inputs">
              <div className="duration-input-group">
                <input
                  type="number"
                  value={manualDuration.hours}
                  onChange={(e) => handleManualDurationChange('hours', parseInt(e.target.value) || 0)}
                  min="0"
                  className="duration-input"
                />
                <span className="duration-label">hours</span>
              </div>
              <div className="duration-input-group">
                <input
                  type="number"
                  value={manualDuration.minutes}
                  onChange={(e) => handleManualDurationChange('minutes', parseInt(e.target.value) || 0)}
                  min="0"
                  max="59"
                  className="duration-input"
                />
                <span className="duration-label">minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogHeader;
