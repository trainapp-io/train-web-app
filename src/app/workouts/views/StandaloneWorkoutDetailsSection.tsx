import React, { useState } from 'react';
import { LuClock, LuRefreshCw } from 'react-icons/lu';
import { useWorkoutContext } from '../contexts/WorkoutContext';
import '../../programs/views/WorkoutView.css';

type DurationUnit = 'min' | 'hr';

interface Props {
  editMode: boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

const StandaloneWorkoutDetailsSection: React.FC<Props> = ({ editMode, setHasUnsavedChanges }) => {
  const { state, updateWorkoutRequest } = useWorkoutContext();
  const workout = state.workoutRequest;
  const [unit, setUnit] = useState<DurationUnit>('min');

  const handleNameChange = (name: string) => {
    updateWorkoutRequest({ ...workout, name });
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (description: string) => {
    updateWorkoutRequest({ ...workout, description });
    setHasUnsavedChanges(true);
  };

  const handleDurationChange = (displayValue: string) => {
    const n = parseFloat(displayValue) || 0;
    const minutes = unit === 'hr' ? Math.round(n * 60) : Math.round(n);
    updateWorkoutRequest({ ...workout, duration: minutes });
    setHasUnsavedChanges(true);
  };

  const cycleUnit = () => setUnit(u => u === 'min' ? 'hr' : 'min');

  const storedMinutes = workout.duration || 0;
  const displayValue = unit === 'hr'
    ? (storedMinutes > 0 ? +(storedMinutes / 60).toFixed(2) : '')
    : (storedMinutes > 0 ? storedMinutes : '');

  if (!editMode) {
    return (
      <div className="wd-view">
        <h1 className="wd-view__name">{workout.name || 'Untitled Workout'}</h1>
        <div className="wd-view__row">
          {workout.description && (
            <p className="wd-view__desc">{workout.description}</p>
          )}
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
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Workout name"
        aria-label="Workout name"
      />
      <textarea
        className="wd-edit__desc"
        value={workout.description || ''}
        onChange={(e) => handleDescriptionChange(e.target.value)}
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
            onChange={(e) => handleDurationChange(e.target.value)}
            placeholder="0"
            aria-label="Duration"
          />
          <button className="ex-m__label--tap" onClick={cycleUnit} title="Change unit">
            {unit}<LuRefreshCw size={9} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandaloneWorkoutDetailsSection;
