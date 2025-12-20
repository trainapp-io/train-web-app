import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import './Workouts.css';
import {WorkoutCard } from '../../programs/components/WorkoutCard';
import { tokenService } from '../../../services/tokenService';
import ConfirmDialog from '../../programs/components/ConfirmDialog';
import { workoutService } from '../services/workoutService';
import { useWorkoutContext } from '../contexts/WorkoutContext';

const Workouts: React.FC = () => {
  const navigate = useNavigate();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string>('');
  const [deletingWorkoutName, setDeletingWorkoutName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    state,
    setLoading,
    setError,
    setWorkouts,
    clearCurrentWorkout,
  } = useWorkoutContext();

  useEffect(() => {
    return () => {
      clearCurrentWorkout();
      setLoading(false);
      setError(null);
    };
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userString = tokenService.getUser();
      if (!userString) {
        throw new Error("User not logged in");
      }
      

      const workoutsData = await workoutService.getWorkouts();
      
      setWorkouts(workoutsData);
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError("Failed to load workouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = () => {
    navigate('/workouts/create');
  };

  const handleDeleteWorkout = (workoutId: string) => {
    const workout = state.workouts.find(w => w.id === workoutId);
    if (workout) {
      setDeletingWorkoutId(workoutId);
      setDeletingWorkoutName(workout.name);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteWorkout = async () => {
    if (!deletingWorkoutId) return;

    try {
      setIsDeleting(true);
      await workoutService.deleteWorkout(deletingWorkoutId);
      
      setWorkouts(state.workouts.filter(workout => workout.id !== deletingWorkoutId));
      setShowDeleteConfirm(false);
      setDeletingWorkoutId('');
      setDeletingWorkoutName('');
    } catch (error) {
      console.error('Error deleting workout:', error);
      setError('Failed to delete workout. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteWorkout = () => {
    setShowDeleteConfirm(false);
    setDeletingWorkoutId('');
    setDeletingWorkoutName('');
  };

  const handleEditWorkout = (workoutId: string) => {
    navigate(`/workouts/${workoutId}/edit`);
  };

  if (state.loading) {
    return <div className="loading-container">Loading workouts...</div>;
  }

  if (state.error) {
    return <div className="error-container">{state.error}</div>;
  }

  return (
    <div className="workouts-page">
      <div className="workouts-header">
        <h1>My Workouts</h1>
        <button className="add-workout-btn" onClick={handleAddWorkout}>
          + Create Workout
        </button>
      </div>

      {state.workouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h2>No workouts yet</h2>
            <p>Create your first standalone workout to get started!</p>
            <button className="create-first-workout-btn" onClick={handleAddWorkout}>
              Create Your First Workout
            </button>
          </div>
        </div>
      ) : (
        <div className="workouts-grid">
          {state.workouts.map(workout => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onDelete={handleDeleteWorkout}
              onEdit={handleEditWorkout}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Workout?"
        message={`Are you sure you want to delete "${deletingWorkoutName}"? This action cannot be undone.`}
        confirmText="Delete Workout"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteWorkout}
        onCancel={cancelDeleteWorkout}
      />
    </div>
  );
};

export default Workouts;
