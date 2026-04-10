import React, { useState, useEffect, useRef } from 'react';
import { LuPlay, LuPause, LuFlagTriangleRight, LuTimer } from 'react-icons/lu';
import './WorkoutLogForm.css';

interface CompletionFooterProps {
  isLive: boolean;
  isTimerRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  isSaving?: boolean;
  /** When > 0, immediately starts a rest countdown for this many seconds */
  restSeconds?: number;
}

const CompletionFooter: React.FC<CompletionFooterProps> = ({
  isLive,
  isTimerRunning,
  onStart,
  onPause,
  onFinish,
  isSaving = false,
  restSeconds = 0,
}) => {
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start rest countdown when restSeconds prop changes to > 0
  useEffect(() => {
    if (restSeconds > 0) {
      if (restRef.current) clearInterval(restRef.current);
      setRestRemaining(restSeconds);
    }
  }, [restSeconds]);

  useEffect(() => {
    if (restRef.current) clearInterval(restRef.current);
    if (restRemaining === null || restRemaining <= 0) {
      if (restRemaining === 0) {
        const t = setTimeout(() => setRestRemaining(null), 1200);
        return () => clearTimeout(t);
      }
      return;
    }
    restRef.current = setInterval(
      () => setRestRemaining((s) => (s !== null ? s - 1 : null)),
      1000
    );
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restRemaining]);

  const startManualRest = () => {
    if (restRemaining !== null && restRemaining > 0) {
      setRestRemaining(null);
    } else {
      setRestRemaining(60);
    }
  };

  const formatRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const restIdle = restRemaining === null;
  const restDone = restRemaining === 0;

  return (
    <div className="wl-tabbar">
      {/* Start / Pause */}
      {isLive && (
        <button
          className="wl-tab wl-tab--active"
          onClick={isTimerRunning ? onPause : onStart}
          type="button"
        >
          {isTimerRunning ? <LuPause size={22} /> : <LuPlay size={22} />}
          <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
        </button>
      )}

      {/* Rest */}
      <button
        className={`wl-tab wl-tab--mid${!restIdle && !restDone ? ' wl-tab--rest-active' : ''}`}
        onClick={startManualRest}
        type="button"
        title={restIdle ? 'Start rest timer' : 'Cancel rest'}
      >
        <LuTimer size={22} />
        <span>
          {restDone ? 'Go!' : restIdle ? 'Rest' : formatRest(restRemaining!)}
        </span>
      </button>

      {/* Finish */}
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
