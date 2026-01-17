import React, { useEffect,   } from 'react';
import { useParams, useNavigate } from 'react-router';
import './WorkoutView.css';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { programService } from '../services/programService';
import { tokenService } from '../../../services/tokenService';
import WorkoutHeader from './WorkoutHeader';
import WorkoutDetailsSection from './WorkoutDetailsSection';
import CircuitItem from '../components/workoutBuilder/CircuitItem';
import EmptyState from '../components/workoutBuilder/EmptyState';
import { arrayMove } from '@dnd-kit/sortable';
import { WorkoutRequest, BlockType, Block } from '@trainapp-io/train-core';
import { useProgramContext, programUtils } from '../contexts/ProgramContext';

const ProgramWorkoutView: React.FC = () => {
  const { programId, weekId, workoutId } = useParams<{ programId: string; weekId: string; workoutId: string }>();
  const navigate = useNavigate();

  const {
    state,
    setWorkoutRequest,
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

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

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

  // Fetch workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      console.log('Fetching workout...');
      setWorkoutLoading(true);
      try {
        const user = JSON.parse(tokenService.getUser() || '{}');
        // Handle 'new' workout - don't fetch from API
        if (workoutId === 'new') {
          if (!state.workoutRequest) {
            console.log('No workout request');
            return;
          }

          console.log('Workout request:', state.workoutRequest);

          // Ensure createdBy is set to the current user's ID
          // if (!state.workoutRequest.createdBy || state.workoutRequest.createdBy === '') {
          //   console.log('Setting createdBy to user ID:', user.userId);
          //   setWorkoutRequest({
          //     ...state.workoutRequest,
          //     createdBy: user.userId
          //   });
          // }

          setWorkoutIsOwner(true);
          setWorkoutEditMode(true);
          setWorkoutLoading(false);
          return;
        }

        // Ensure required params exist
        if (!programId || !weekId || !workoutId) {
          throw new Error('Missing required parameters');
        }

        
        const response = await programService.getWorkout(programId, weekId, workoutId);
        
        const workoutRequest = programUtils.workoutResponseToRequest(response, user.userId);
        setWorkoutRequest(workoutRequest);
        
        const userIsOwner = !response.createdBy || response.createdBy === user.userId;
        setWorkoutIsOwner(userIsOwner);
        
        // Auto-enable edit mode for new workouts with no circuits
        if (userIsOwner && (!workoutRequest.blocks || workoutRequest.blocks.length === 0)) {
          setWorkoutEditMode(true);
        }
       
      } catch (error) {
        console.error('Error fetching workout:', error);
        setWorkoutError(error instanceof Error ? error.message : 'Failed to fetch workout');
        const user = JSON.parse(tokenService.getUser() || '{}');
        const defaultRequest = programUtils.createDefaultWorkoutRequest(user.userId);
        setWorkoutRequest(defaultRequest);
        setWorkoutIsOwner(true);
        setWorkoutEditMode(true);
      } finally {
        setWorkoutLoading(false);
      }
    };
    fetchWorkout();
  }, [programId, weekId, workoutId]);

  // Save workout
  const saveWorkout = async () => {  
    if (!state.workoutRequest) {
      console.log('No workout request, returning early');
      return;
    }
    setWorkoutSaving(true);
    setWorkoutError(null);

    console.log('Saving workout Request: ', state.workoutRequest);
  
    if (workoutId === 'new') {
      await handleCreateWorkout(state.workoutRequest);
    } else {
      await handleUpdateWorkout(state.workoutRequest);
    }
  };

  const handleCreateWorkout = async (request: WorkoutRequest) => {
    try {
      console.log('Creating workout:', request);
      const response = await programService.createWorkout(programId!, weekId!, request);
      setWorkoutRequest(response);
    } catch (error) {
      console.error('Error creating workout:', error);
      setWorkoutError(error instanceof Error ? error.message : 'Failed to create workout');
    } finally {
      setWorkoutSaving(false);
    }
  };

  const handleUpdateWorkout = async (request: WorkoutRequest) => {
    try {
      // Sanitize the request to remove MongoDB-specific fields
      const sanitizedRequest = programUtils.sanitizeWorkoutRequest(request);
      await programService.updateWorkout(programId!, weekId!, workoutId!, sanitizedRequest);
      setWorkoutHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating workout:', error);
      setWorkoutError(error instanceof Error ? error.message : 'Failed to update workout');
    } finally {
      setWorkoutSaving(false);
    }
  };
  

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !state.workoutRequest) return;

    const oldIndex = state.workoutRequest.blocks?.findIndex((c, idx) => idx === active.id || c.order === active.id);
    const newIndex = state.workoutRequest.blocks?.findIndex((c, idx) => idx === over.id || c.order === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reordered = arrayMove(state.workoutRequest.blocks!, oldIndex!, newIndex!);
    // Update order property for all blocks
    const reorderedWithOrder = reordered.map((circuit, idx) => ({
      ...circuit,
      order: idx
    }));
    
    setWorkoutRequest({ ...state.workoutRequest, blocks: reorderedWithOrder });
    // setWorkout({ ...workout, circuits: reorderedWithOrder });
    setWorkoutHasUnsavedChanges(true);
  };

  const addCircuit = () => {
    if (!state.workoutRequest || !state.workoutRequest.blocks) {
      console.log('No workout request or blocks');
      return;
    } 

    const newCircuit: Block = {
      type: BlockType.CIRCUIT,
      name: `Circuit ${state.workoutRequest.blocks.length + 1}`,
      targetSets: 3,
      rest: 0,
      exercises: [],
      order: state.workoutRequest.blocks?.length + 1
    };
    setWorkoutRequest({ ...state.workoutRequest, blocks: [...state.workoutRequest.blocks, newCircuit] });
    setWorkoutHasUnsavedChanges(true);
  };

  const handleBackToWeek = () => {
    clearCurrentWorkout();
    // Check if this is a standalone workout (accessed via /workouts route)
    if (!programId || !weekId) {
      navigate('/workouts');
    } else {
      navigate(`/programs/${programId}/weeks/${weekId}`);
    }
  };

  // Determine if this is a standalone workout
  const isStandaloneWorkout = !programId || !weekId;

  if (state.workoutLoading) return <p>Loading workout...</p>;

  const updateBlock = (updated: Block) => {
    setWorkoutRequest({ ...state.workoutRequest, blocks: state.workoutRequest.blocks?.map((c) => (c.order === updated.order ? updated : c)) });
    setWorkoutHasUnsavedChanges(true);
  };

  const removeBlock = (block: Block) => {
    setWorkoutRequest({ ...state.workoutRequest, blocks: state.workoutRequest.blocks?.filter((c) => c.order !== block.order) });
    setWorkoutHasUnsavedChanges(true);
  };

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
        isStandaloneWorkout={isStandaloneWorkout}
      />

      <WorkoutDetailsSection
        editMode={state.workoutEditMode}
        setHasUnsavedChanges={setWorkoutHasUnsavedChanges}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="circuits-container">
          {state.workoutRequest?.blocks?.length ? (
            <SortableContext items={state.workoutRequest.blocks.map(c => c.order)} strategy={verticalListSortingStrategy}>
              {state.workoutRequest.blocks.map(circuit => (
                <CircuitItem
                  key={circuit.order}
                  block={circuit}
                  editMode={state.workoutEditMode && state.workoutIsOwner}
                  workout={state.workoutRequest!}
                  onUpdateBlock={updateBlock}
                  onRemoveBlock={() => removeBlock(circuit)}
                  onSetHasUnsavedChanges={setWorkoutHasUnsavedChanges}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                />
              ))}
            </SortableContext>
          ) : (
            !state.workoutEditMode && <EmptyState onStart={() => setWorkoutEditMode(true)} isOwner={state.workoutIsOwner} />
          )}
          
          {state.workoutEditMode && state.workoutIsOwner && (
            <button className="add-circuit-btn" onClick={addCircuit}>
              + Add Circuit
            </button>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default ProgramWorkoutView;
