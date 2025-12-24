import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ProgramResponse,
  ProgramRequest,
  WeekResponse,
  WeekRequest,
  WorkoutResponse,
  WorkoutRequest,
  Exercise,
  WorkoutDifficulty,
  ProfileAccess,
} from '@trainapp-io/train-core';
import { programService } from '../services/programService';
import { 
  ProgramState, 
  ProgramAction, 
  ProgramContextType,
  programUtils 
} from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ProgramState = {
  // Programs
  programs: [],
  currentProgram: null,
  programsLoading: false,
  programsError: null,
  
  // Weeks
  weeks: [],
  currentWeek: null,
  currentWeekIndex: -1,
  weeksLoading: false,
  weeksSaving: false,
  weeksError: null,
  
  // Workouts
  workouts: [],
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
  workoutLoading: false,
  workoutSaving: false,
  workoutHasUnsavedChanges: false,
  workoutEditMode: false,
  workoutIsOwner: false,
  workoutError: null,
  
};

// ============================================================================
// REDUCER
// ============================================================================

function programReducer(state: ProgramState, action: ProgramAction): ProgramState {
  switch (action.type) {
    // Programs
    case 'SET_PROGRAMS_LOADING':
      return { ...state, programsLoading: action.payload };
    case 'SET_PROGRAMS':
      return { ...state, programs: action.payload, programsLoading: false, programsError: null };
    case 'SET_PROGRAMS_ERROR':
      return { ...state, programsError: action.payload, programsLoading: false };
    case 'SET_CURRENT_PROGRAM':
      return { ...state, currentProgram: action.payload };
    case 'ADD_PROGRAM':
      return { ...state, programs: [...state.programs, action.payload] };
    case 'UPDATE_PROGRAM':
      return {
        ...state,
        programs: state.programs.map(program =>
          program.id === action.payload.id
            ? { ...program, ...action.payload.updates }
            : program
        ),
        currentProgram: state.currentProgram?.id === action.payload.id
          ? { ...state.currentProgram, ...action.payload.updates }
          : state.currentProgram
      };
    case 'REMOVE_PROGRAM':
      return {
        ...state,
        programs: state.programs.filter(program => program.id !== action.payload),
        currentProgram: state.currentProgram?.id === action.payload ? null : state.currentProgram
      };
    
    // Weeks
    case 'SET_WEEKS_LOADING':
      return { ...state, weeksLoading: action.payload };
    case 'SET_WEEKS_SAVING':
      return { ...state, weeksSaving: action.payload };
    case 'SET_WEEKS':
      return { ...state, weeks: action.payload, weeksLoading: false, weeksError: null };
    case 'SET_WEEKS_ERROR':
      return { ...state, weeksError: action.payload, weeksLoading: false };
    case 'SET_CURRENT_WEEK':
      return { ...state, currentWeek: action.payload };
    case 'SET_CURRENT_WEEK_INDEX':
      return { ...state, currentWeekIndex: action.payload };
    case 'UPDATE_WEEK_AT_INDEX':
      return {
        ...state,
        weeks: state.weeks.map((week, idx) =>
          idx === action.payload.index ? action.payload.weekRequest : week
        )
      };
    case 'ADD_WEEK':
      return { ...state, weeks: [...state.weeks, action.payload] };
    case 'REMOVE_WEEK':
      return {
        ...state,
        weeks: state.weeks.filter((_, idx) => idx !== action.payload),
        currentWeekIndex: state.currentWeekIndex === action.payload ? -1 : state.currentWeekIndex
      };
    
    // Workouts
    case 'SET_WORKOUT_LOADING':
      return { ...state, workoutLoading: action.payload };
    case 'SET_WORKOUT_SAVING':
      return { ...state, workoutSaving: action.payload };
    case 'SET_WORKOUT_REQUEST':
      return { ...state, workoutRequest: action.payload, workoutHasUnsavedChanges: false };
    case 'UPDATE_WORKOUT_REQUEST':
      return { 
        ...state, 
        workoutRequest: { ...state.workoutRequest, ...action.payload },
        workoutHasUnsavedChanges: true 
      };
    case 'SET_WORKOUT_EDIT_MODE':
      return { ...state, workoutEditMode: action.payload };
    case 'SET_WORKOUT_IS_OWNER':
      return { ...state, workoutIsOwner: action.payload };
    case 'SET_WORKOUT_HAS_UNSAVED_CHANGES':
      return { ...state, workoutHasUnsavedChanges: action.payload };
    case 'SET_WORKOUT_ERROR':
      return { ...state, workoutError: action.payload };
  
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(programReducer, initialState);

  // ============================================================================
  // PROGRAM MANAGEMENT
  // ============================================================================
  
  const setProgramsLoading = (loading: boolean) => {
    dispatch({ type: 'SET_PROGRAMS_LOADING', payload: loading });
  };

  const setProgramsError = (error: string | null) => {
    dispatch({ type: 'SET_PROGRAMS_ERROR', payload: error });
  };

  const setPrograms = (programs: ProgramResponse[]): void => {
    dispatch({ type: 'SET_PROGRAMS', payload: programs });
  };

  const setCurrentProgram = (program: ProgramResponse | null): void => {
    dispatch({ type: 'SET_CURRENT_PROGRAM', payload: program });
  };

  const createProgram = async (programRequest: ProgramRequest): Promise<ProgramResponse> => {
    try {
      dispatch({ type: 'SET_PROGRAMS_LOADING', payload: true });
      const program = await programService.createProgram(programRequest);
      dispatch({ type: 'ADD_PROGRAM', payload: program });
      return program;
    } catch (error) {
      setProgramsError(error instanceof Error ? error.message : 'Failed to create program');
      throw error;
    } finally {
      dispatch({ type: 'SET_PROGRAMS_LOADING', payload: false });
    }
  };

  const updateProgram = async (programId: string, updates: Partial<ProgramRequest>): Promise<void> => {
    try {
      dispatch({ type: 'SET_PROGRAMS_LOADING', payload: true });
      // Note: This would need to be implemented in the service
      // await programService.updateProgram(programId, updates);
      dispatch({ type: 'UPDATE_PROGRAM', payload: { id: programId, updates } });
    } catch (error) {
      setProgramsError(error instanceof Error ? error.message : 'Failed to update program');
    } finally {
      dispatch({ type: 'SET_PROGRAMS_LOADING', payload: false });
    }
  };

  const deleteProgram = (programId: string): void => {
    dispatch({ type: 'REMOVE_PROGRAM', payload: programId });
  };

  // ============================================================================
  // WEEK MANAGEMENT
  // ============================================================================

  const setWeeksLoading = (loading: boolean) => {
    dispatch({ type: 'SET_WEEKS_LOADING', payload: loading });
  };

  const setWeeksSaving = (saving: boolean) => {
    dispatch({ type: 'SET_WEEKS_SAVING', payload: saving });
  };

  const setWeeksError = (error: string | null) => {
    dispatch({ type: 'SET_WEEKS_ERROR', payload: error });
  };

  const setWeeks = (weeks: WeekRequest[]): void => {
    dispatch({ type: 'SET_WEEKS', payload: weeks });
  };

  const setCurrentWeek = (week: WeekResponse | null): void => {
    dispatch({ type: 'SET_CURRENT_WEEK', payload: week });
  };

  const setCurrentWeekIndex = (index: number): void => {
    dispatch({ type: 'SET_CURRENT_WEEK_INDEX', payload: index });
  };

  const updateWeekAtIndex = (index: number, weekRequest: WeekRequest): void => {
    dispatch({ type: 'UPDATE_WEEK_AT_INDEX', payload: { index, weekRequest } });
  };

  const createWeek = async (_programId: string, _weekRequest: WeekRequest): Promise<WeekResponse> => {
    try {
      dispatch({ type: 'SET_WEEKS_LOADING', payload: true });
      // Note: This would need to be implemented in the service
      // const week = await programService.createWeek(programId, weekRequest);
      // dispatch({ type: 'ADD_WEEK', payload: week });
      // return week;
      throw new Error('Create week not implemented');
    } catch (error) {
      setWeeksError(error instanceof Error ? error.message : 'Failed to create week');
      throw error;
    } finally {
      dispatch({ type: 'SET_WEEKS_LOADING', payload: false });
    }
  };

  const updateWeek = async (programId: string, weekId: string, index: number, weekRequest: WeekRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_WEEKS_SAVING', payload: true });
      await programService.updateWeek(programId, weekId, weekRequest);
      dispatch({ type: 'UPDATE_WEEK_AT_INDEX', payload: { index, weekRequest } });
    } catch (error) {
      setWeeksError(error instanceof Error ? error.message : 'Failed to update week');
      throw error;
    } finally {
      dispatch({ type: 'SET_WEEKS_SAVING', payload: false });
    }
  };

  const deleteWeek = async (programId: string, weekId: string, index: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_WEEKS_LOADING', payload: true });
      await programService.deleteWeek(programId, weekId);
      dispatch({ type: 'REMOVE_WEEK', payload: index });
    } catch (error) {
      setWeeksError(error instanceof Error ? error.message : 'Failed to delete week');
      throw error;
    } finally {
      dispatch({ type: 'SET_WEEKS_LOADING', payload: false });
    }
  };

  // ============================================================================
  // WORKOUT MANAGEMENT
  // ============================================================================

  const setWorkouts = (workouts: WorkoutResponse[]) => {
    dispatch({ type: 'SET_WORKOUTS', payload: workouts });
  };

  const updateWorkoutRequest = (updates: Partial<WorkoutRequest>) => {
    dispatch({ type: 'UPDATE_WORKOUT_REQUEST', payload: updates });
  };

  const setWorkoutRequest = (workoutRequest: WorkoutRequest) => {
    dispatch({ type: 'SET_WORKOUT_REQUEST', payload: workoutRequest });
  };

  const setWorkoutLoading = (loading: boolean) => {
    dispatch({ type: 'SET_WORKOUT_LOADING', payload: loading });
  };

  const setWorkoutSaving = (saving: boolean) => {
    dispatch({ type: 'SET_WORKOUT_SAVING', payload: saving });
  };

  const setWorkoutEditMode = (editMode: boolean) => {
    dispatch({ type: 'SET_WORKOUT_EDIT_MODE', payload: editMode });
  };

  const setWorkoutIsOwner = (isOwner: boolean) => {
    dispatch({ type: 'SET_WORKOUT_IS_OWNER', payload: isOwner });
  };

  const setWorkoutHasUnsavedChanges = (hasChanges: boolean) => {
    dispatch({ type: 'SET_WORKOUT_HAS_UNSAVED_CHANGES', payload: hasChanges });
  };

  const setWorkoutError = (error: string | null) => {
    dispatch({ type: 'SET_WORKOUT_ERROR', payload: error });
  };

  
  // ============================================================================
  // EXERCISE MANAGEMENT (for workout editing)
  // ============================================================================

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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  const clearCurrentProgram = () => {
    dispatch({ type: 'SET_CURRENT_PROGRAM', payload: null });
  };

  const clearCurrentWeek = () => {
    dispatch({ type: 'SET_CURRENT_WEEK', payload: null });
  };

  const clearCurrentWorkout = () => {
    dispatch({ type: 'SET_WORKOUT_REQUEST', payload: initialState.workoutRequest });
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: ProgramContextType = {
    state,
    dispatch,

    
    // Program management
    setProgramsLoading,
    setProgramsError,
    setPrograms,
    setCurrentProgram,
    createProgram,
    updateProgram,
    deleteProgram,
    
    // Week management
    setWeeksLoading,
    setWeeksSaving,
    setWeeksError,
    setWeeks,
    setCurrentWeek,
    setCurrentWeekIndex,
    updateWeekAtIndex,
    createWeek,
    updateWeek,
    deleteWeek,
    
    // Workout management
    setWorkouts,
    updateWorkoutRequest,
    setWorkoutRequest,
    setWorkoutLoading,
    setWorkoutSaving,
    setWorkoutEditMode,
    setWorkoutIsOwner,
    setWorkoutHasUnsavedChanges,
    setWorkoutError,
    
    // Exercise management
    updateExerciseInBlock,
    updateExerciseInBlockPartial,
    addExerciseToBlock,
    removeExerciseFromBlock,
    reorderExercisesInBlock,
    
    // Utility methods
    clearCurrentProgram,
    clearCurrentWeek,
    clearCurrentWorkout,
  };

  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  );
};

// ============================================================================
// HOOK TO USE THE CONTEXT
// ============================================================================

export const useProgramContext = (): ProgramContextType => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgramContext must be used within a ProgramProvider');
  }
  return context;
};

// Re-export utility functions for convenience
export { programUtils };