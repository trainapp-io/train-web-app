import React from 'react';
import { LuClock } from 'react-icons/lu';
import { useProgramContext } from '../contexts/ProgramContext';
import TimePicker from '../components/workoutBuilder/TimePicker';

interface Props {
  editMode: boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

const WorkoutDetailsSection: React.FC<Props> = ({ editMode, setHasUnsavedChanges }) => {
  const { state, updateWorkoutRequest } = useProgramContext();
  const workout = state.workoutRequest;

  const handleNameChange = (name: string) => {
    updateWorkoutRequest({ ...workout, name });
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (description: string) => {
    updateWorkoutRequest({ ...workout, description });
    setHasUnsavedChanges(true);
  };

  const handleDurationChange = (seconds: number) => {
    updateWorkoutRequest({ ...workout, duration: Math.round(seconds / 60) });
    setHasUnsavedChanges(true);
  };

  if (!editMode) {
    return (
      <div className="wd-view">
        <h1 className="wd-view__name">{workout.name || 'Untitled Workout'}</h1>
        <div className="wd-view__row">
          {workout.description && (
            <p className="wd-view__desc">{workout.description}</p>
          )}
          {(workout.duration ?? 0) > 0 && (
            <span className="wd-view__duration">
              <LuClock aria-hidden="true" />
              {workout.duration} min
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
        <label className="wd-edit__duration-label">
          <LuClock aria-hidden="true" /> Duration
        </label>
        <TimePicker
          value={(workout.duration || 0) * 60}
          onChange={handleDurationChange}
          placeholder="0"
          defaultUnit="min"
        />
      </div>
    </div>
  );
};

export default WorkoutDetailsSection;
