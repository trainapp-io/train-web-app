import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { WorkoutRequest, ProfileAccess, WorkoutDifficulty, WorkoutResponse, Exercise, Block, MeasurementType, Measurement, MeasurementUnit } from '@trainapp-io/train-core';
import { MuscleGroup } from '../views/types';

// State interface
interface WorkoutState {
  workoutRequest: WorkoutRequest;
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  editMode: boolean;
  isOwner: boolean;
  error: string | null;
}

// Action types
type WorkoutAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_WORKOUT_REQUEST'; payload: WorkoutRequest }
  | { type: 'UPDATE_WORKOUT_REQUEST'; payload: Partial<WorkoutRequest> }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_IS_OWNER'; payload: boolean }
  | { type: 'SET_HAS_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: WorkoutState = {
  workoutRequest: {
    name: '',
    description: '',
    category: [],
    difficulty: WorkoutDifficulty.BEGINNER,
    duration: 0,
    blocks: [],
    accessType: ProfileAccess.Public,
    createdBy: '',
    startDate: new Date(),
    endDate: new Date(),
  },
  loading: false,
  saving: false,
  hasUnsavedChanges: false,
  editMode: false,
  isOwner: false,
  error: null,
};

// Reducer
function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_WORKOUT_REQUEST':
      return { ...state, workoutRequest: action.payload, hasUnsavedChanges: false };
    case 'UPDATE_WORKOUT_REQUEST':
      return { 
        ...state, 
        workoutRequest: { ...state.workoutRequest, ...action.payload },
        hasUnsavedChanges: true 
      };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'SET_IS_OWNER':
      return { ...state, isOwner: action.payload };
    case 'SET_HAS_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context
interface WorkoutContextType {
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
  
  // Convenience methods
  updateWorkoutRequest: (updates: Partial<WorkoutRequest>) => void;
  setWorkoutRequest: (workoutRequest: WorkoutRequest) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setEditMode: (editMode: boolean) => void;
  setIsOwner: (isOwner: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  
  // Exercise-specific methods
  updateExerciseInBlock: (blockIndex: number, exerciseIndex: number, updatedExercise: Exercise) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  addExerciseToBlock: (blockIndex: number, exercise: Exercise) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
  reorderExercisesInBlock: (blockIndex: number, fromIndex: number, toIndex: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Provider component
interface WorkoutProviderProps {
  children: ReactNode;
}

export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Convenience methods
  const updateWorkoutRequest = (updates: Partial<WorkoutRequest>) => {
    dispatch({ type: 'UPDATE_WORKOUT_REQUEST', payload: updates });
  };

  const setWorkoutRequest = (workoutRequest: WorkoutRequest) => {
    dispatch({ type: 'SET_WORKOUT_REQUEST', payload: workoutRequest });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setSaving = (saving: boolean) => {
    dispatch({ type: 'SET_SAVING', payload: saving });
  };

  const setEditMode = (editMode: boolean) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: editMode });
  };

  const setIsOwner = (isOwner: boolean) => {
    dispatch({ type: 'SET_IS_OWNER', payload: isOwner });
  };

  const setHasUnsavedChanges = (hasChanges: boolean) => {
    dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: hasChanges });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Exercise-specific methods
  const updateExerciseInBlock = (blockIndex: number, exerciseIndex: number, updatedExercise: Exercise) => {
    if (!state.workoutRequest?.blocks) return;
    
    const updatedBlocks = state.workoutRequest.blocks.map((block, bIndex) => {
      if (bIndex === blockIndex) {
        const updatedExercises = block.exercises.map((exercise, eIndex) => 
          eIndex === exerciseIndex ? updatedExercise : exercise
        );
        return { ...block, exercises: updatedExercises };
      }
      return block;
    });
    
    updateWorkoutRequest({ blocks: updatedBlocks });
  };

  const updateExerciseInBlockPartial = (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => {
    if (!state.workoutRequest?.blocks) return;
    
    const updatedBlocks = state.workoutRequest.blocks.map((block, bIndex) => {
      if (bIndex === blockIndex) {
        const updatedExercises = block.exercises.map((exercise, eIndex) => 
          eIndex === exerciseIndex ? { ...exercise, ...updates } : exercise
        );
        return { ...block, exercises: updatedExercises };
      }
      return block;
    });
    
    updateWorkoutRequest({ blocks: updatedBlocks });
  };

  const addExerciseToBlock = (blockIndex: number, exercise: Exercise) => {
    if (!state.workoutRequest?.blocks) return;
    
    const updatedBlocks = state.workoutRequest.blocks.map((block, bIndex) => {
      if (bIndex === blockIndex) {
        const updatedExercises = [...block.exercises, exercise];
        return { ...block, exercises: updatedExercises };
      }
      return block;
    });
    
    updateWorkoutRequest({ blocks: updatedBlocks });
  };

  const removeExerciseFromBlock = (blockIndex: number, exerciseIndex: number) => {
    if (!state.workoutRequest?.blocks) return;
    
    const updatedBlocks = state.workoutRequest.blocks.map((block, bIndex) => {
      if (bIndex === blockIndex) {
        const updatedExercises = block.exercises.filter((_, eIndex) => eIndex !== exerciseIndex);
        return { ...block, exercises: updatedExercises };
      }
      return block;
    });
    
    updateWorkoutRequest({ blocks: updatedBlocks });
  };

  const reorderExercisesInBlock = (blockIndex: number, fromIndex: number, toIndex: number) => {
    if (!state.workoutRequest?.blocks) return;
    
    const updatedBlocks = state.workoutRequest.blocks.map((block, bIndex) => {
      if (bIndex === blockIndex) {
        const updatedExercises = [...block.exercises];
        const [movedExercise] = updatedExercises.splice(fromIndex, 1);
        updatedExercises.splice(toIndex, 0, movedExercise);
        
        // Update order property for all exercises
        const reorderedWithOrder = updatedExercises.map((exercise, index) => ({
          ...exercise,
          order: index
        }));
        
        return { ...block, exercises: reorderedWithOrder };
      }
      return block;
    });
    
    updateWorkoutRequest({ blocks: updatedBlocks });
  };

  const contextValue: WorkoutContextType = {
    state,
    dispatch,
    updateWorkoutRequest,
    setWorkoutRequest,
    setLoading,
    setSaving,
    setEditMode,
    setIsOwner,
    setHasUnsavedChanges,
    setError,
    resetState,
    updateExerciseInBlock,
    updateExerciseInBlockPartial,
    addExerciseToBlock,
    removeExerciseFromBlock,
    reorderExercisesInBlock,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

// Hook to use the context
export const useWorkoutContext = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider');
  }
  return context;
};

// Utility functions for data transformation
export const workoutUtils = {
  // Transform WorkoutResponse to WorkoutRequest
  responseToRequest: (response: WorkoutResponse, userId: string): WorkoutRequest => {
    return {
      name: response.name || '',
      description: response.description || '',
      category: response.category || [],
      difficulty: response.difficulty || WorkoutDifficulty.BEGINNER,
      duration: response.duration || 0,
      blocks: response.blocks || [],
      accessType: response.accessType || ProfileAccess.Public,
      createdBy: userId,
      startDate: response.startDate ? new Date(response.startDate) : new Date(),
      endDate: response.endDate ? new Date(response.endDate) : new Date(),
    };
  },

  // Create default WorkoutRequest for new workouts
  createDefaultRequest: (userId: string, duration: number = 0): WorkoutRequest => {
    return {
      name: 'New Workout',
      description: '',
      category: [],
      difficulty: WorkoutDifficulty.BEGINNER,
      duration,
      blocks: [],
      accessType: ProfileAccess.Public,
      createdBy: userId,
      startDate: new Date(),
      endDate: new Date(),
    };
  },

  // Validate WorkoutRequest
  validateRequest: (request: WorkoutRequest): string[] => {
    const errors: string[] = [];
    
    if (!request.name.trim()) {
      errors.push('Workout name is required');
    }
    
    if (request.duration && request.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }
    
    if (!request.createdBy) {
      errors.push('Created by user ID is required');
    }
    
    return errors;
  },

  // Convert muscleGroups to category array (for API)
  muscleGroupsToCategory: (muscleGroups: MuscleGroup[]): string[] => {
    return muscleGroups.map(mg => mg.name);
  },

  // Convert category array to muscleGroups (from API)
  categoryToMuscleGroups: (category: string[]): MuscleGroup[] => {
    return category.map(name => ({ name, percentage: 0 }));
  },

  // Create default exercise
  createDefaultExercise: (order: number = 0): Exercise => {
    return {
      name: 'New Exercise',
      targetReps: 10,
      targetDurationSec: 0,
      targetWeight: 0,
      targetDistance: 0,
      notes: '',
      order,
      measurement: {
        measurementType: MeasurementType.REPS,
        measurementUnit: MeasurementUnit.POUND,
      } as Measurement,
    };
  },

  // Find block and exercise indices by IDs (if you need to work with IDs instead of indices)
  findBlockAndExerciseIndices: (blocks: Block[], blockId: string, exerciseId: string) => {
    const blockIndex = blocks.findIndex(block => (block as any).id === blockId);
    if (blockIndex === -1) return { blockIndex: -1, exerciseIndex: -1 };
    
    const exerciseIndex = blocks[blockIndex].exercises.findIndex(exercise => (exercise as any).id === exerciseId);
    return { blockIndex, exerciseIndex };
  },
};
