import React, { useState } from 'react';
import { LuClock, LuRefreshCw } from 'react-icons/lu';
import { WorkoutRequest } from '@trainapp-io/train-core';

type DurationUnit = 'min' | 'hr';

interface Props {
  workout: WorkoutRequest;
  editMode: boolean;
  onUpdate: (updates: Partial<WorkoutRequest>) => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
}

const WorkoutDetailsSection: React.FC<Props> = ({ workout, editMode, onUpdate, onSetHasUnsavedChanges }) => {
  const [unit, setUnit] = useState<DurationUnit>('min');

  const storedMinutes = workout.duration || 0;
  const displayValue = unit === 'hr'
    ? (storedMinutes > 0 ? +(storedMinutes / 60).toFixed(2) : '')
    : (storedMinutes > 0 ? storedMinutes : '');

  if (!editMode) {
    return (
      <div className="wd-view">
        <h1 className="wd-view__name">{workout.name || 'Untitled Workout'}</h1>
        <div className="wd-view__row">
          {workout.description && <p className="wd-view__desc">{workout.description}</p>}
          {storedMinutes > 0 && (
            <span className="wd-view__duration">
              <LuClock aria-hidden="true" />
              {storedMinutes} min
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wd-edit">
      <input
        className="wd-edit__name"
        type="text"
        value={workout.name || ''}
        onChange={(e) => { onUpdate({ name: e.target.value }); onSetHasUnsavedChanges(true); }}
        placeholder="Workout name"
        aria-label="Workout name"
      />
      <textarea
        className="wd-edit__desc"
        value={workout.description || ''}
        onChange={(e) => { onUpdate({ description: e.target.value }); onSetHasUnsavedChanges(true); }}
        placeholder="Description (optional)"
        rows={2}
        aria-label="Workout description"
      />
      <div className="wd-edit__duration">
        <LuClock size={13} className="wd-edit__duration-icon" aria-hidden="true" />
        <div className="ex-m">
          <input
            className="ex-m__input wd-edit__duration-input"
            type="number"
            min={0}
            value={displayValue}
            onChange={(e) => {
              const n = parseFloat(e.target.value) || 0;
              const minutes = unit === 'hr' ? Math.round(n * 60) : Math.round(n);
              onUpdate({ duration: minutes });
              onSetHasUnsavedChanges(true);
            }}
            placeholder="0"
            aria-label="Duration"
          />
          <button className="ex-m__label--tap" onClick={() => setUnit(u => u === 'min' ? 'hr' : 'min')} title="Change unit">
            {unit}<LuRefreshCw size={9} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetailsSection;
