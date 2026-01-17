import React, { useEffect,   } from 'react';
import { useParams, useNavigate } from 'react-router';
import './WorkoutView.css';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { workoutService } from '../services/workoutService';
import { tokenService } from '../../../services/tokenService';
import WorkoutHeader from '../../programs/views/WorkoutHeader';
import StandaloneWorkoutDetailsSection from './StandaloneWorkoutDetailsSection';
import CircuitItem from '../../programs/components/workoutBuilder/CircuitItem';
import EmptyState from '../../programs/components/workoutBuilder/EmptyState';
import { arrayMove } from '@dnd-kit/sortable';
import { WorkoutRequest, BlockType, Block } from '@trainapp-io/train-core';
import { useWorkoutContext, workoutUtils } from '../contexts/WorkoutContext';

const WorkoutView: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();

  const {
    state,
    setWorkoutRequest,
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

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

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

  // Fetch workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      console.log('Fetching standalone workout...', { workoutId });
      setLoading(true);
      try {
        const user = JSON.parse(tokenService.getUser() || '{}');
        
        // Handle creating a new workout
        if (!workoutId || workoutId === 'create') {
          if (!state.workoutRequest) {
            console.log('Creating default workout request');
            const defaultRequest = workoutUtils.createDefaultRequest(user.userId);
            setWorkoutRequest(defaultRequest);
          }
          setIsOwner(true);
          setEditMode(true);
          setLoading(false);
          return;
        }

        // Fetch existing standalone workout
        const response = await workoutService.getWorkoutById(workoutId);
        const workoutRequest = workoutUtils.responseToRequest(response, user.userId);
        setWorkoutRequest(workoutRequest);
        
        const userIsOwner = !response.createdBy || response.createdBy === user.userId;
        setIsOwner(userIsOwner);
        
        // Auto-enable edit mode for new workouts with no blocks
        if (userIsOwner && (!workoutRequest.blocks || workoutRequest.blocks.length === 0)) {
          setEditMode(true);
        }
       
      } catch (error) {
        console.error('Error fetching workout:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch workout');
        const user = JSON.parse(tokenService.getUser() || '{}');
        const defaultRequest = workoutUtils.createDefaultRequest(user.userId);
        setWorkoutRequest(defaultRequest);
        setIsOwner(true);
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [workoutId]);

  // Save workout
  const saveWorkout = async () => {  
    if (!state.workoutRequest) {
      console.log('No workout request, returning early');
      return;
    }
    setSaving(true);
    setError(null);

    console.log('Saving standalone workout:', state.workoutRequest);
  
    const isCreatingNew = !workoutId || workoutId === 'create';
    if (isCreatingNew) {
      await handleCreateWorkout(state.workoutRequest);
    } else {
      await handleUpdateWorkout(state.workoutRequest);
    }
  };

  const handleCreateWorkout = async (request: WorkoutRequest) => {
    try {
      console.log('Creating standalone workout:', request);
      const response = await workoutService.createWorkout(request);
      setWorkoutRequest(response);
      setHasUnsavedChanges(false);
      // Navigate to the newly created workout
      navigate(`/workouts/${response.id}`);
    } catch (error) {
      console.error('Error creating workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to create workout');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWorkout = async (request: WorkoutRequest) => {
    try {
      await workoutService.updateWorkout(workoutId!, request);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to update workout');
    } finally {
      setSaving(false);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handleBack = () => {
    clearCurrentWorkout();
    navigate('/workouts');
  };

  const updateBlock = (updated: Block) => {
    setWorkoutRequest({ ...state.workoutRequest, blocks: state.workoutRequest.blocks?.map((c) => (c.order === updated.order ? updated : c)) });
    setHasUnsavedChanges(true);
  };

  const removeBlock = (block: Block) => {
    setWorkoutRequest({ ...state.workoutRequest, blocks: state.workoutRequest.blocks?.filter((c) => c.order !== block.order) });
    setHasUnsavedChanges(true);
  };

  if (state.loading) return <p>Loading workout...</p>;

  return (
    <div className="workout-view">
      <WorkoutHeader
        onBack={handleBack}
        editMode={state.editMode}
        isOwner={state.isOwner}
        saving={state.saving}
        hasUnsavedChanges={state.hasUnsavedChanges}
        onSave={saveWorkout}
        onToggleEdit={() => setEditMode(!state.editMode)}
        isStandaloneWorkout={true}
      />

      <StandaloneWorkoutDetailsSection
        editMode={state.editMode}
        setHasUnsavedChanges={setHasUnsavedChanges}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="circuits-container">
          {state.workoutRequest?.blocks?.length ? (
            <SortableContext items={state.workoutRequest.blocks.map(c => c.order)} strategy={verticalListSortingStrategy}>
              {state.workoutRequest.blocks.map(circuit => (
                <CircuitItem
                  key={circuit.order}
                  block={circuit}
                  editMode={state.editMode && state.isOwner}
                  workout={state.workoutRequest!}
                  onUpdateBlock={updateBlock}
                  onRemoveBlock={() => removeBlock(circuit)}
                  onSetHasUnsavedChanges={setHasUnsavedChanges}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                />
              ))}
            </SortableContext>
          ) : (
            !state.editMode && <EmptyState onStart={() => setEditMode(true)} isOwner={state.isOwner} />
          )}
          
          {state.editMode && state.isOwner && (
            <button className="add-circuit-btn" onClick={addCircuit}>
              + Add Circuit
            </button>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default WorkoutView;
