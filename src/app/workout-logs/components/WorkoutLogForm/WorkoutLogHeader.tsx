import React from 'react';
import { WorkoutSnapshot } from '@trainapp-io/train-core';
import { LuPlay, LuPause, LuChevronLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import './WorkoutLogForm.css';

interface WorkoutLogHeaderProps {
  workoutSnapshot: WorkoutSnapshot;
  isTimerRunning: boolean;
  elapsedSeconds: number;
  onPausePlay: () => void;
  onFinish: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WorkoutLogHeader: React.FC<WorkoutLogHeaderProps> = ({
  workoutSnapshot,
  isTimerRunning,
  elapsedSeconds,
  onPausePlay,
  onFinish,
}) => {
  const navigate = useNavigate();

  return (
    <div className="wl-header">
      {/* Row 1: back button (left) + finish (right) */}
      <div className="wl-header__top">
        <button
          className="wl-back-btn"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="Go back"
        >
          <LuChevronLeft size={16} />
          <span>Back</span>
        </button>
        <button className="wl-header__finish-btn" onClick={onFinish} type="button">
          Finish
        </button>
      </div>

      {/* Row 2: workout title centered */}
      <div className="wl-header__title-row">
        <span className="wl-header__name">{workoutSnapshot.name}</span>
      </div>

      {/* Row 3: pause/play + timer centered */}
      <div className="wl-timer-row">
        <button
          className="wl-pause-btn"
          onClick={onPausePlay}
          type="button"
          aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
        >
          {isTimerRunning ? <LuPause size={16} /> : <LuPlay size={16} />}
        </button>
        <span className={`wl-elapsed${!isTimerRunning ? ' wl-elapsed--paused' : ''}`}>
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
    </div>
  );
};

export default WorkoutLogHeader;
