import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { WorkoutLogRequest, WorkoutSnapshot, BlockSnapshot, ExerciseSnapshot } from '@seenelm/train-core';
import { useCreateWorkoutLog } from '../../../services/apiHooks';
import { programService } from '../../programs/services/programService';
import { tokenService } from '../../../services/tokenService';
import WorkoutLogForm from '../components/WorkoutLogForm/WorkoutLogForm';
import './WorkoutLogPages.css';

const WorkoutLogCreate: React.FC = () => {
  const navigate = useNavigate();
  const { programId, weekId, workoutId } = useParams<{ programId: string; weekId: string; workoutId: string }>();
  const [workoutSnapshot, setWorkoutSnapshot] = useState<WorkoutSnapshot | null>(null);
  const [versionId, setVersionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createWorkoutLogMutation = useCreateWorkoutLog();

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!programId || !weekId || !workoutId) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        const workout = await programService.getWorkout(programId, weekId, workoutId);
        
        console.log('Fetched workout:', workout);
        
        // Create workout snapshot from workout response
        const snapshot: WorkoutSnapshot = {
          name: workout.name,
          description: workout.description,
          category: workout.category,
          difficulty: workout.difficulty,
          duration: workout.duration,
          blockSnapshot: workout.blocks?.map((block): BlockSnapshot => ({
            type: block.type,
            name: block.name,
            targetSets: block.targetSets,
            description: block.description,
            rest: block.rest,
            exerciseSnapshot: block.exercises.map((exercise): ExerciseSnapshot => ({
              name: exercise.name,
              rest: exercise.rest,
              targetReps: exercise.targetReps,
              targetDurationSec: exercise.targetDurationSec,
              targetWeight: exercise.targetWeight,
              targetDistance: exercise.targetDistance,
              notes: exercise.notes,
              order: exercise.order,
              measurementType: exercise.measurementType,
            })),
            order: block.order,
          })) || [],
          accessType: workout.accessType,
          createdBy: workout.createdBy,
          startDate: workout.startDate,
          endDate: workout.endDate,
        };

        console.log('Created snapshot:', snapshot);
        setWorkoutSnapshot(snapshot);
        setVersionId(workout.versionId || 1);
      } catch (err) {
        console.error('Error fetching workout:', err);
        setError('Failed to load workout');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [programId, weekId, workoutId]);

  const handleSubmit = async (workoutLogRequest: WorkoutLogRequest) => {
    try {
      const user = JSON.parse(tokenService.getUser() || '{}');
      
      const completeRequest: WorkoutLogRequest = {
        ...workoutLogRequest,
        userId: user.userId,
        workoutId: workoutId!,
        versionId: versionId,
      };

      await createWorkoutLogMutation.mutateAsync(completeRequest);
      navigate('/workout-logs/history');
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to save workout log');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="workout-log-page">
        <div className="loading-container">
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error || !workoutSnapshot) {
    return (
      <div className="workout-log-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Failed to load workout'}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-log-page">
      <div className="workout-log-page-header">
        <h1>Log Workout</h1>
      </div>
      <WorkoutLogForm
        workoutSnapshot={workoutSnapshot}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSaving={createWorkoutLogMutation.isPending}
      />
    </div>
  );
};

export default WorkoutLogCreate;
