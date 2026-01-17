import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import './WorkoutHeader.css';
import { tokenService } from '../../../services/tokenService';
import { userProfileService } from '../../profiles/services/userProfileService';

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

interface AfterDemoQuestions {
  name: string;
  email: string;
  difficulty: number;
  feedback: string;
}

const TRAIN_EMAIL_API = import.meta.env.VITE_TRAIN_EMAIL_API;

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
  const [showAfterDemoDialog, setShowAfterDemoDialog] = useState(false);
  const [difficulty, setDifficulty] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Get user info from localStorage
    const fetchUserInfo = async () => {
      try {
        const userString = tokenService.getUser();
        if (userString) {
          const user = JSON.parse(userString);
          setUserName(user.name || '');
        }

        // Get email from user profile
        const profile = await userProfileService.getCurrentUserProfile();
        setUserEmail(profile.email || '');
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleDoneClick = () => {
    if (hasUnsavedChanges) {
      onSave();
    }
    onToggleEdit();
    
    // Show after-demo dialog
    setShowAfterDemoDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAfterDemoDialog(false);
    setDifficulty(5);
    setFeedback('');
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const afterDemoQuestions: AfterDemoQuestions = {
        name: userName,
        email: userEmail,
        difficulty: difficulty,
        feedback: feedback.trim(),
      };

      const response = await fetch(`${TRAIN_EMAIL_API}/after-demo-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(afterDemoQuestions),
      });

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Feedback submitted successfully:', data);

      // Close dialog on success
      handleCloseDialog();
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogWorkout = () => {
    if (isStandaloneWorkout && workoutId) {
      // For standalone workouts, navigate to a standalone workout log route
      navigate(`/workouts/${workoutId}/log`);
    } else if (programId && weekId && workoutId) {
      // For program workouts, use the existing route
      navigate(`/programs/${programId}/weeks/${weekId}/workouts/${workoutId}/log`);
    }
  };

  return (
    <>
      <div className="workout-header">
        <button className="back-button" onClick={onBack}>
          &larr; {isStandaloneWorkout ? 'Back to Workouts' : 'Back to Week'}
        </button>

        <div className="header-actions">
          {hasUnsavedChanges && <span className="unsaved-indicator">Unsaved changes</span>}

          {!editMode && (
            <button className="log-workout-button" onClick={handleLogWorkout}>
              Log This Workout
            </button>
          )}

          {isOwner && (
            <button className="edit-button" onClick={editMode ? handleDoneClick : onToggleEdit}>
              {editMode ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* After Demo Dialog */}
      {showAfterDemoDialog && (
        <div className="after-demo-dialog-overlay" onClick={handleCloseDialog}>
          <div className="after-demo-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close-dialog-btn" onClick={handleCloseDialog}>
              ×
            </button>

            <h2 className="dialog-title">How Was Your Experience?</h2>
            <p className="dialog-subtitle">We'd love to hear your feedback!</p>

            <div className="dialog-content1">
              {/* Difficulty Rating */}
              <div className="form-field">
                <label htmlFor="difficulty-rating">
                  On a scale from 1-10 (1-easy, 10-hard), how hard was it to create a program? *
                </label>
                <div className="difficulty-slider-container">
                  <div className="difficulty-labels">
                    <span className="difficulty-label-left">Easy (1)</span>
                    <span className="difficulty-value">{difficulty}</span>
                    <span className="difficulty-label-right">Hard (10)</span>
                  </div>
                  <input
                    id="difficulty-rating"
                    type="range"
                    min="1"
                    max="10"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="difficulty-slider"
                  />
                  <div className="slider-track-fill" style={{ width: `${((difficulty - 1) / 9) * 100}%` }} />
                </div>
              </div>

              {/* Feedback Textarea */}
              <div className="form-field">
                <label htmlFor="feedback-text">
                  Was there any part of the process that you thought was difficult or missing? *
                </label>
                <textarea
                  id="feedback-text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience creating the program..."
                  rows={5}
                  className="feedback-textarea"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                className="submit-feedback-btn"
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedback.trim()}
              >
                {submitting ? 'Submitting...' : 'Finish Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkoutHeader;
