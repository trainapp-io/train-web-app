import React from 'react';
import { ExerciseLog, ExerciseSnapshot, MeasurementType } from '@trainapp-io/train-core';
import './WorkoutLogForm.css';

interface ExerciseLogItemProps {
  exerciseSnapshot: ExerciseSnapshot;
  exerciseLog: ExerciseLog;
  onUpdate: (updatedLog: ExerciseLog) => void;
}

const ExerciseLogItem: React.FC<ExerciseLogItemProps> = ({
  exerciseSnapshot,
  exerciseLog,
  onUpdate,
}) => {
  const handleFieldChange = (field: keyof ExerciseLog, value: any) => {
    onUpdate({
      ...exerciseLog,
      [field]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('isCompleted', e.target.checked);
  };

  return (
    <div className={`exercise-log-item ${exerciseLog.isCompleted ? 'completed' : ''}`}>
      <div className="exercise-log-header">
        <div className="exercise-name-checkbox">
          <input
            type="checkbox"
            checked={exerciseLog.isCompleted}
            onChange={handleCheckboxChange}
            className="exercise-checkbox"
          />
          <h4>{exerciseSnapshot.name}</h4>
        </div>
      </div>

      <div className="exercise-log-inputs">
        {exerciseSnapshot.measurementType === MeasurementType.REPS && (
          <div className="input-group">
            <label>Reps</label>
            <input
              type="number"
              value={exerciseLog.actualReps || ''}
              onChange={(e) => handleFieldChange('actualReps', parseInt(e.target.value) || 0)}
              placeholder={exerciseSnapshot.targetReps?.toString() || '0'}
              min="0"
            />
          </div>
        )}

        {exerciseSnapshot.measurementType === MeasurementType.TIME && (
          <div className="input-group">
            <label>Duration (sec)</label>
            <input
              type="number"
              value={exerciseLog.actualDurationSec || ''}
              onChange={(e) => handleFieldChange('actualDurationSec', parseInt(e.target.value) || 0)}
              placeholder={exerciseSnapshot.targetDurationSec?.toString() || '0'}
              min="0"
            />
          </div>
        )}

        {exerciseSnapshot.measurementType === MeasurementType.DISTANCE && (
          <div className="input-group">
            <label>Distance</label>
            <input
              type="number"
              value={exerciseLog.actualDistance || ''}
              onChange={(e) => handleFieldChange('actualDistance', parseFloat(e.target.value) || 0)}
              placeholder={exerciseSnapshot.targetDistance?.toString() || '0'}
              min="0"
              step="0.1"
            />
          </div>
        )}

        {exerciseSnapshot.targetWeight !== undefined && (
          <div className="input-group">
            <label>Weight</label>
            <input
              type="number"
              value={exerciseLog.actualWeight || ''}
              onChange={(e) => handleFieldChange('actualWeight', parseFloat(e.target.value) || 0)}
              placeholder={exerciseSnapshot.targetWeight?.toString() || '0'}
              min="0"
              step="0.5"
            />
          </div>
        )}

        <div className="input-group">
          <label>Rest (sec)</label>
          <input
            type="number"
            value={exerciseLog.actualRest || ''}
            onChange={(e) => handleFieldChange('actualRest', parseInt(e.target.value) || 0)}
            placeholder={exerciseSnapshot.rest?.toString() || '0'}
            min="0"
          />
        </div>
      </div>

      {exerciseSnapshot.notes && (
        <div className="exercise-notes">
          <strong>Notes:</strong> {exerciseSnapshot.notes}
        </div>
      )}
    </div>
  );
};

export default ExerciseLogItem;
