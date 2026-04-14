import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import './WorkoutView.css';
import '../../programs/views/WorkoutView.css';
import { workoutService } from '../services/workoutService';
import { tokenService } from '../../../services/tokenService';
import WorkoutHeader from '../../programs/views/WorkoutHeader';
import WorkoutDetailsSection from '../../programs/components/workoutBuilder/WorkoutDetailsSection';
import WorkoutBuilderBlocks from '../../programs/components/workoutBuilder/WorkoutBuilderBlocks';
import { WorkoutRequest } from '@trainapp-io/train-core';
import { useWorkoutContext, workoutUtils } from '../contexts/WorkoutContext';

const WorkoutView: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();

  const {
    state,
    setWorkoutRequest,
    updateWorkoutRequest,
    setLoading,
    setError,
    setSaving,
    setEditMode,
    setIsOwner,
    setHasUnsavedChanges,
    clearCurrentWorkout,
    updateExerciseInBlockPartial,
    removeExerciseFromBlock,
  } = useWorkoutContext();

  useEffect(() => {
    return () => {
      clearCurrentWorkout();
      setLoading(false);
      setSaving(false);
      setEditMode(false);
      setIsOwner(false);
      setHasUnsavedChanges(false);
      setError(null);
    };
  }, []);

  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(tokenService.getUser() || '{}');

        if (!workoutId || workoutId === 'create') {
          if (!state.workoutRequest) {
            setWorkoutRequest(workoutUtils.createDefaultRequest(user.userId));
          }
          setIsOwner(true);
          setEditMode(true);
          setLoading(false);
          return;
        }

        const response = await workoutService.getWorkoutById(workoutId);
        console.log('Fetched workout:', response);
        const workoutRequest = workoutUtils.responseToRequest(response, user.userId);
        setWorkoutRequest(workoutRequest);

        const userIsOwner = !response.createdBy || response.createdBy === user.userId;
        setIsOwner(userIsOwner);

        if (userIsOwner && (!workoutRequest.blocks || workoutRequest.blocks.length === 0)) {
          setEditMode(true);
        }
      } catch (error) {
        console.error('Error fetching workout:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch workout');
        const user = JSON.parse(tokenService.getUser() || '{}');
        setWorkoutRequest(workoutUtils.createDefaultRequest(user.userId));
        setIsOwner(true);
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [workoutId]);

  const saveWorkout = async () => {
    if (!state.workoutRequest) return;
    setSaving(true);
    setError(null);
    const isCreatingNew = !workoutId || workoutId === 'create';
    if (isCreatingNew) {
      await handleCreateWorkout(state.workoutRequest);
    } else {
      await handleUpdateWorkout(state.workoutRequest);
    }
  };

  const handleCreateWorkout = async (request: WorkoutRequest) => {
    try {
      console.log('Creating workout:', request);
      const response = await workoutService.createWorkout(request);
      setWorkoutRequest(response);
      setHasUnsavedChanges(false);
      navigate(`/workouts/${response.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create workout');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWorkout = async (request: WorkoutRequest) => {
    try {
      console.log('Updating workout:', request);
      await workoutService.updateWorkout(workoutId!, request);
      setHasUnsavedChanges(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update workout');
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) return <p>Loading workout...</p>;

  return (
    <div className="workout-view">
      <WorkoutHeader
        onBack={() => { clearCurrentWorkout(); navigate('/workouts'); }}
        editMode={state.editMode}
        isOwner={state.isOwner}
        saving={state.saving}
        hasUnsavedChanges={state.hasUnsavedChanges}
        onSave={saveWorkout}
        onToggleEdit={() => setEditMode(!state.editMode)}
        isStandaloneWorkout={true}
      />

      <WorkoutDetailsSection
        workout={state.workoutRequest}
        editMode={state.editMode}
        onUpdate={updateWorkoutRequest}
        onSetHasUnsavedChanges={setHasUnsavedChanges}
      />

      <WorkoutBuilderBlocks
        workout={state.workoutRequest}
        editMode={state.editMode}
        isOwner={state.isOwner}
        onBlocksChange={(blocks) => updateWorkoutRequest({ blocks })}
        onSectionsChange={(sections) => updateWorkoutRequest({ sections })}
        onSetHasUnsavedChanges={setHasUnsavedChanges}
        updateExerciseInBlockPartial={updateExerciseInBlockPartial}
        removeExerciseFromBlock={removeExerciseFromBlock}
        onEditModeStart={() => setEditMode(true)}
      />
    </div>
  );
};

export default WorkoutView;
