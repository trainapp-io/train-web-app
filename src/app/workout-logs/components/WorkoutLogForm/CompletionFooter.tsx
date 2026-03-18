import React from 'react';
import { LuPlay, LuPause, LuFlagTriangleRight } from 'react-icons/lu';
import './WorkoutLogForm.css';

interface CompletionFooterProps {
  isLive: boolean;
  isTimerRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  isSaving?: boolean;
}

const CompletionFooter: React.FC<CompletionFooterProps> = ({
  isLive,
  isTimerRunning,
  onStart,
  onPause,
  onFinish,
  isSaving = false,
}) => {
  return (
    <div className="wl-tabbar">
      {isLive && (
        <>
          <button
            className={`wl-tab ${!isTimerRunning ? 'wl-tab--active' : 'wl-tab--dim'}`}
            onClick={onStart}
            disabled={isTimerRunning}
            type="button"
          >
            <LuPlay size={22} />
            <span>Start</span>
          </button>

          <button
            className={`wl-tab ${isTimerRunning ? 'wl-tab--active' : 'wl-tab--dim'}`}
            onClick={onPause}
            disabled={!isTimerRunning}
            type="button"
          >
            <LuPause size={22} />
            <span>Pause</span>
          </button>
        </>
      )}

      <button
        className="wl-tab wl-tab--finish"
        onClick={onFinish}
        disabled={isSaving}
        type="button"
      >
        <LuFlagTriangleRight size={22} />
        <span>{isSaving ? 'Saving…' : 'Finish'}</span>
      </button>
    </div>
  );
};

export default CompletionFooter;
