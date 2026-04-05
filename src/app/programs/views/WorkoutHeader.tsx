import React from 'react';
import { useNavigate, useParams } from 'react-router';
import './WorkoutHeader.css';
import { LuArrowLeft, LuCheck, LuPencil } from 'react-icons/lu';

interface WorkoutHeaderProps {
  onBack: () => void;
  editMode: boolean;
  isOwner: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  saving: boolean;
  isStandaloneWorkout?: boolean;
}

const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  onBack,
  editMode,
  isOwner,
  onToggleEdit,
  onSave,
  hasUnsavedChanges,
  isStandaloneWorkout = false,
}) => {
  const navigate = useNavigate();
  const { programId, weekId, workoutId } = useParams<{ programId: string; weekId: string; workoutId: string }>();

  const handleDoneClick = () => {
    if (hasUnsavedChanges) {
      onSave();
    }
    onToggleEdit();
  };

  const handleLogWorkout = () => {
    if (isStandaloneWorkout && workoutId) {
      navigate(`/workouts/${workoutId}/log`);
    } else if (programId && weekId && workoutId) {
      navigate(`/programs/${programId}/weeks/${weekId}/workouts/${workoutId}/log`);
    }
  };

  return (
    <div className="wh-bar">
      <button className="wh-back" onClick={onBack}>
        <LuArrowLeft size={15} />
        {isStandaloneWorkout ? 'Workouts' : 'Week'}
      </button>

      <div className="wh-actions">
        {!editMode && (
          <button className="wh-log" onClick={handleLogWorkout}>
            Log Workout
          </button>
        )}

        {isOwner && (
          <button className="wh-edit" onClick={editMode ? handleDoneClick : onToggleEdit}>
            {editMode ? (
              <>
                {hasUnsavedChanges && <span className="wh-dot" aria-hidden="true" />}
                <LuCheck size={14} />
                Done
              </>
            ) : (
              <>
                <LuPencil size={13} />
                Edit
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutHeader;
