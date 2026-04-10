import React, { useState, useEffect, useRef } from 'react';
import { LuPlay, LuPause, LuTimer } from 'react-icons/lu';
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

const RING_RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 119.4

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
  const [restDuration, setRestDuration] = useState<number>(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start rest when restSeconds prop changes to > 0
  useEffect(() => {
    if (restSeconds > 0) {
      if (restRef.current) clearInterval(restRef.current);
      setRestRemaining(restSeconds);
      setRestDuration(restSeconds);
    }
  }, [restSeconds]);

  // Countdown tick
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
      // Cancel active rest
      setRestRemaining(null);
    } else {
      setRestRemaining(60);
      setRestDuration(60);
    }
  };

  const formatRest = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const restIdle = restRemaining === null;
  const restDone = restRemaining === 0;

  // Progress ring: full when just started, empty when done
  const progress = restDuration > 0 && restRemaining !== null
    ? restRemaining / restDuration
    : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="wl-tabbar">
      {/* Start / Pause — only in live mode */}
      {isLive && (
        <button
          className="wl-pause-btn"
          onClick={isTimerRunning ? onPause : onStart}
          type="button"
          aria-label={isTimerRunning ? 'Pause workout timer' : 'Start workout timer'}
        >
          {isTimerRunning ? <LuPause size={18} /> : <LuPlay size={18} />}
        </button>
      )}

      {/* Rest timer */}
      {restIdle ? (
        <button className="wl-rest-idle" onClick={startManualRest} type="button">
          <LuTimer size={18} className="wl-rest-idle__icon" />
          <span className="wl-rest-idle__label">Rest</span>
        </button>
      ) : (
        <div className="wl-rest-card" onClick={startManualRest} role="button" tabIndex={0}>
          <div className="wl-rest-ring">
            <svg
              width="46"
              height="46"
              viewBox="0 0 46 46"
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              <circle
                cx="23" cy="23" r={RING_RADIUS}
                fill="none" stroke="#ede9fe" strokeWidth="4"
              />
              <circle
                cx="23" cy="23" r={RING_RADIUS}
                fill="none" stroke="#7c3aed" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="wl-rest-ring__label">REST</div>
          </div>
          <div className="wl-rest-info">
            <div className="wl-rest-info__title">Resting</div>
            {restDone ? (
              <div className="wl-rest-info__done">Go!</div>
            ) : (
              <div className="wl-rest-info__countdown">
                {formatRest(restRemaining!)}
              </div>
            )}
          </div>
          <span className="wl-rest-skip">Skip →</span>
        </div>
      )}

      {/* Finish */}
      <button
        className="wl-finish-btn"
        onClick={onFinish}
        disabled={isSaving}
        type="button"
      >
        {isSaving ? 'Saving…' : 'Finish'}
      </button>
    </div>
  );
};

export default CompletionFooter;
