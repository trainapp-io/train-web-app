import React, { useState, useEffect, useRef } from 'react';
import { LuPlay, LuPause, LuFlagTriangleRight, LuTimer, LuLayers } from 'react-icons/lu';
import './WorkoutLogForm.css';

interface CompletionFooterProps {
  isLive: boolean;
  isTimerRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  isSaving?: boolean;
  /** 'sets' = tap-through set counter; 'rest' = rest countdown timer */
  midButton?: 'sets' | 'rest';
  /** Total sets to cycle through (sets mode) */
  totalSets?: number;
  /** Default rest duration in seconds (rest mode, default 60) */
  defaultRestSeconds?: number;
}

const CompletionFooter: React.FC<CompletionFooterProps> = ({
  isLive,
  isTimerRunning,
  onStart,
  onPause,
  onFinish,
  isSaving = false,
  midButton = 'sets',
  totalSets = 3,
  defaultRestSeconds = 60,
}) => {
  // ── Set counter state ──
  const [currentSet, setCurrentSet] = useState(1);

  // ── Rest timer state ──
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (restRef.current) clearInterval(restRef.current);
    if (restRemaining === null || restRemaining <= 0) {
      if (restRemaining === 0) {
        const t = setTimeout(() => setRestRemaining(null), 1200);
        return () => clearTimeout(t);
      }
      return;
    }
    restRef.current = setInterval(() => setRestRemaining((s) => (s !== null ? s - 1 : null)), 1000);
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restRemaining]);

  const startRest = () => {
    if (restRemaining !== null && restRemaining > 0) {
      setRestRemaining(null);
    } else {
      setRestRemaining(defaultRestSeconds);
    }
  };

  const advanceSet = () => {
    setCurrentSet((s) => (s >= totalSets ? 1 : s + 1));
  };

  const formatRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const restIdle = restRemaining === null;
  const restDone = restRemaining === 0;

  return (
    <div className="wl-tabbar">
      {/* ── Start / Pause toggle ── */}
      {isLive && (
        <button
          className={`wl-tab wl-tab--active`}
          onClick={isTimerRunning ? onPause : onStart}
          type="button"
        >
          {isTimerRunning ? <LuPause size={22} /> : <LuPlay size={22} />}
          <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
        </button>
      )}

      {/* ── Middle button ── */}
      {midButton === 'sets' ? (
        <button
          className="wl-tab wl-tab--mid"
          onClick={advanceSet}
          type="button"
          title="Tap to advance set"
        >
          <LuLayers size={22} />
          <span>Set {currentSet}/{totalSets}</span>
        </button>
      ) : (
        <button
          className={`wl-tab wl-tab--mid ${!restIdle && !restDone ? 'wl-tab--rest-active' : ''}`}
          onClick={startRest}
          type="button"
          title={restIdle ? 'Start rest timer' : 'Cancel rest'}
        >
          <LuTimer size={22} />
          <span>
            {restDone ? 'Go!' : restIdle ? 'Rest' : formatRest(restRemaining!)}
          </span>
        </button>
      )}

      {/* ── Finish ── */}
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
