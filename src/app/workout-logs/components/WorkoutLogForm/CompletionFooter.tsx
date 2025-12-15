import React from 'react';
import './WorkoutLogForm.css';

interface CompletionFooterProps {
  actualDuration: number;
  isCompleted: boolean;
  onCompletionToggle: (completed: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const CompletionFooter: React.FC<CompletionFooterProps> = ({
  actualDuration,
  isCompleted,
  onCompletionToggle,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="completion-footer">
      <div className="duration-summary">
        <span className="duration-label">Total Duration:</span>
        <span className="duration-value">{formatDuration(actualDuration)}</span>
      </div>

      <div className="completion-toggle">
        <label className="completion-checkbox-label">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => onCompletionToggle(e.target.checked)}
            className="completion-checkbox"
          />
          <span>Mark as Completed</span>
        </label>
      </div>

      <div className="footer-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="btn-save"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Workout Log'}
        </button>
      </div>
    </div>
  );
};

export default CompletionFooter;
