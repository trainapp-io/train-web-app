import React from 'react';
import { BlockLog, BlockSnapshot } from '@trainapp-io/train-core';
import ExerciseLogItem from './ExerciseLogItem';
import './WorkoutLogForm.css';

interface BlockLogSectionProps {
  blockSnapshot: BlockSnapshot;
  blockLog: BlockLog;
  onUpdate: (updatedLog: BlockLog) => void;
}

const BlockLogSection: React.FC<BlockLogSectionProps> = ({
  blockSnapshot,
  blockLog,
  onUpdate,
}) => {
  const handleFieldChange = (field: keyof BlockLog, value: any) => {
    onUpdate({
      ...blockLog,
      [field]: value,
    });
  };

  const handleExerciseLogUpdate = (index: number, updatedExerciseLog: any) => {
    const updatedExerciseLogs = [...blockLog.exerciseLogs];
    updatedExerciseLogs[index] = updatedExerciseLog;
    handleFieldChange('exerciseLogs', updatedExerciseLogs);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('isCompleted', e.target.checked);
  };

  return (
    <div className={`block-log-section ${blockLog.isCompleted ? 'completed' : ''}`}>
      <div className="block-log-header">
        <div className="block-name-checkbox">
          <input
            type="checkbox"
            checked={blockLog.isCompleted}
            onChange={handleCheckboxChange}
            className="block-checkbox"
          />
          <h3>{blockSnapshot.name || `${blockSnapshot.type}`}</h3>
        </div>
        <span className="block-type-badge">{blockSnapshot.type}</span>
      </div>

      {blockSnapshot.description && (
        <p className="block-description">{blockSnapshot.description}</p>
      )}

      <div className="block-log-inputs">
        <div className="input-group">
          <label>Sets</label>
          <input
            type="number"
            value={blockLog.actualSets || ''}
            onChange={(e) => handleFieldChange('actualSets', parseInt(e.target.value) || 0)}
            placeholder={blockSnapshot.targetSets?.toString() || '0'}
            min="0"
          />
        </div>
        <div className="input-group">
          <label>Rest (sec)</label>
          <input
            type="number"
            value={blockLog.actualRest || ''}
            onChange={(e) => handleFieldChange('actualRest', parseInt(e.target.value) || 0)}
            placeholder={blockSnapshot.rest?.toString() || '0'}
            min="0"
          />
        </div>
      </div>

      <div className="exercises-section">
        <h4>Exercises</h4>
        {blockSnapshot.exerciseSnapshot.map((exerciseSnapshot, index) => {
          const exerciseLog = blockLog.exerciseLogs?.[index];
          if (!exerciseLog) return null;
          
          return (
            <ExerciseLogItem
              key={index}
              exerciseSnapshot={exerciseSnapshot}
              exerciseLog={exerciseLog}
              onUpdate={(updated) => handleExerciseLogUpdate(index, updated)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BlockLogSection;
