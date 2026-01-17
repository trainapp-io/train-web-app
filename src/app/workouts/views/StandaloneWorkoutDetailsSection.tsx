import React from 'react';
import { useWorkoutContext } from '../contexts/WorkoutContext';
import TimePicker from '../../programs/components/workoutBuilder/TimePicker';

interface Props {
  editMode: boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

const StandaloneWorkoutDetailsSection: React.FC<Props> = ({ editMode, setHasUnsavedChanges }) => {
  const { state, updateWorkoutRequest } = useWorkoutContext();
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

  return (
    <div className="workout-details">
      {editMode ? (
        <input
          type="text"
          value={workout.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          className="workout-name-input"
          placeholder="Workout name"
        />
      ) : (
        <h1>{workout.name}</h1>
      )}
      
      {editMode ? (
        <textarea
          value={workout.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="workout-description-input"
          placeholder="Workout description"
          rows={3}
        />
      ) : (
        <p className="workout-description">{workout.description}</p>
      )}

      <div className="workout-meta">
        <div className="duration-section">
          <h3>Duration</h3>
          {editMode ? (
            <TimePicker
              value={(workout.duration || 0) * 60}
              onChange={handleDurationChange}
              placeholder="Duration"
              defaultUnit="min"
            />
          ) : (
            <span>{workout.duration} minutes</span>
          )}
        </div>

        {/* <MuscleGroupsEditor
          muscleGroups={workout.muscleGroups}
          editMode={editMode}
          setWorkout={setWorkout}
          workout={workout}
        /> */}
      </div>
    </div>
  );
};

export default StandaloneWorkoutDetailsSection;
