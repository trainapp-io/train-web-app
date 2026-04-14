import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import './WorkoutView.css';
import { programService } from '../services/programService';
import { tokenService } from '../../../services/tokenService';
import WorkoutHeader from './WorkoutHeader';
import WorkoutDetailsSection from '../components/workoutBuilder/WorkoutDetailsSection';
import WorkoutBuilderBlocks from '../components/workoutBuilder/WorkoutBuilderBlocks';
import { WorkoutRequest } from '@trainapp-io/train-core';
import { useProgramContext, programUtils } from '../contexts/ProgramContext';

const ProgramWorkoutView: React.FC = () => {
  const { programId, weekId, workoutId } = useParams<{ programId: string; weekId: string; workoutId: string }>();
  const navigate = useNavigate();

  const {
    state,
    setWorkoutRequest,
    updateWorkoutRequest,
    setWorkoutLoading,
    setWorkoutError,
    setWorkoutSaving,
    setWorkoutEditMode,
    setWorkoutIsOwner,
    setWorkoutHasUnsavedChanges,
    clearCurrentWorkout,
    updateExerciseInBlockPartial,
    removeExerciseFromBlock,
  } = useProgramContext();

  useEffect(() => {
    return () => {
      clearCurrentWorkout();
      setWorkoutLoading(false);
      setWorkoutSaving(false);
      setWorkoutEditMode(false);
      setWorkoutIsOwner(false);
      setWorkoutHasUnsavedChanges(false);
      setWorkoutError(null);
    };
  }, []);

  useEffect(() => {
    const fetchWorkout = async () => {
      setWorkoutLoading(true);
      try {
        const user = JSON.parse(tokenService.getUser() || '{}');

        if (workoutId === 'new') {
          if (!state.workoutRequest) return;
          setWorkoutIsOwner(true);
          setWorkoutEditMode(true);
          setWorkoutLoading(false);
          return;
        }

        if (!programId || !weekId || !workoutId) throw new Error('Missing required parameters');

        const response = await programService.getWorkout(programId, weekId, workoutId);
        const workoutRequest = programUtils.workoutResponseToRequest(response, user.userId);
        setWorkoutRequest(workoutRequest);

        const userIsOwner = !response.createdBy || response.createdBy === user.userId;
        setWorkoutIsOwner(userIsOwner);

        if (userIsOwner && (!workoutRequest.blocks || workoutRequest.blocks.length === 0)) {
          setWorkoutEditMode(true);
        }
      } catch (error) {
        console.error('Error fetching workout:', error);
        setWorkoutError(error instanceof Error ? error.message : 'Failed to fetch workout');
        const user = JSON.parse(tokenService.getUser() || '{}');
        setWorkoutRequest(programUtils.createDefaultWorkoutRequest(user.userId));
        setWorkoutIsOwner(true);
        setWorkoutEditMode(true);
      } finally {
        setWorkoutLoading(false);
      }
    };
    fetchWorkout();
  }, [programId, weekId, workoutId]);

  const saveWorkout = async () => {
    if (!state.workoutRequest) return;
    setWorkoutSaving(true);
    setWorkoutError(null);
    if (workoutId === 'new') {
      await handleCreateWorkout(state.workoutRequest);
    } else {
      await handleUpdateWorkout(state.workoutRequest);
    }
  };

  const handleCreateWorkout = async (request: WorkoutRequest) => {
    try {
      const response = await programService.createWorkout(programId!, weekId!, request);
      setWorkoutRequest(response);
    } catch (error) {
      setWorkoutError(error instanceof Error ? error.message : 'Failed to create workout');
    } finally {
      setWorkoutSaving(false);
    }
  };

  const handleUpdateWorkout = async (request: WorkoutRequest) => {
    try {
      await programService.updateWorkout(programId!, weekId!, workoutId!, programUtils.sanitizeWorkoutRequest(request));
      setWorkoutHasUnsavedChanges(false);
    } catch (error) {
      setWorkoutError(error instanceof Error ? error.message : 'Failed to update workout');
    } finally {
      setWorkoutSaving(false);
    }
  };

  const handleBackToWeek = () => {
    clearCurrentWorkout();
    if (!programId || !weekId) {
      navigate('/workouts');
    } else {
      navigate(`/programs/${programId}/weeks/${weekId}`);
    }
  };

  if (state.workoutLoading) return <p>Loading workout...</p>;

  return (
    <div className="workout-view">
      <WorkoutHeader
        onBack={handleBackToWeek}
        editMode={state.workoutEditMode}
        isOwner={state.workoutIsOwner}
        saving={state.workoutSaving}
        hasUnsavedChanges={state.workoutHasUnsavedChanges}
        onSave={saveWorkout}
        onToggleEdit={() => setWorkoutEditMode(!state.workoutEditMode)}
        isStandaloneWorkout={!programId || !weekId}
      />

      <WorkoutDetailsSection
        workout={state.workoutRequest}
        editMode={state.workoutEditMode}
        onUpdate={updateWorkoutRequest}
        onSetHasUnsavedChanges={setWorkoutHasUnsavedChanges}
      />

      <WorkoutBuilderBlocks
        workout={state.workoutRequest}
        editMode={state.workoutEditMode}
        isOwner={state.workoutIsOwner}
        onBlocksChange={(blocks) => updateWorkoutRequest({ blocks })}
        onSectionsChange={(sections) => updateWorkoutRequest({ sections })}
        onSetHasUnsavedChanges={setWorkoutHasUnsavedChanges}
        updateExerciseInBlockPartial={updateExerciseInBlockPartial}
        removeExerciseFromBlock={removeExerciseFromBlock}
        onEditModeStart={() => setWorkoutEditMode(true)}
      />
    </div>
  );
};

export default ProgramWorkoutView;
