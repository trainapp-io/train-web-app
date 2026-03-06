import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { LuDumbbell } from 'react-icons/lu';
import { Exercise, MeasurementType, Unit } from '@trainapp-io/train-core';


interface Props {
  exercise: Exercise;
  editMode: boolean;
  blockIndex: number;
  exerciseIndex: number;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
}

const ExerciseItem: React.FC<Props> = ({ 
  exercise, 
  editMode, 
  blockIndex, 
  exerciseIndex,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [exerciseSuggestions, setExerciseSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) {
    console.error('ExerciseItem: Missing required context methods');
    return null;
  }

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const isRest = exercise.name?.toLowerCase().includes('rest') || false;

  const updateExercise = (blockIdx: number, exerciseIdx: number, updatedExercise: Partial<Exercise>) => {
    updateExerciseInBlockPartial(blockIdx, exerciseIdx, updatedExercise );
    
  };

  const cycleMeasurementType = () => {
    const types = [MeasurementType.REPS, MeasurementType.TIME, MeasurementType.DISTANCE];
    const currentIndex = types.indexOf(measurementType);
    const nextIndex = (currentIndex + 1) % types.length;
    updateExercise(blockIndex, exerciseIndex, { 
      measurement: { 
        ...exercise.measurement,
        measurementType: types[nextIndex] 
      } 
    });
  };

  const cycleWeightUnit = () => {
    // Cycle through weight units: lb -> kg -> lb
    const currentUnit = (exercise as any).weightUnit || Unit.POUND;
    const nextUnit = currentUnit === Unit.POUND ? Unit.KILOGRAM : Unit.POUND;
    updateExercise(blockIndex, exerciseIndex, { weightUnit: nextUnit } as any);
  };

  const getWeightUnitLabel = () => {
    const unit = (exercise as any).weightUnit || Unit.POUND;
    return unit === Unit.KILOGRAM ? 'kg' : 'lb';
  };

  const searchExercises = async (query: string) => {
    if (!query || query.length < 2) {
      setExerciseSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    
    // Skip API call if no key is configured
    if (!apiKey) {
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${query}?limit=10`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExerciseSuggestions(data);
        setShowSuggestions(true);
      } else {
        // Silently fail for 401, 429, etc.
        console.warn(`Exercise API returned ${response.status}`);
        setExerciseSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Don't show suggestions on error
      setExerciseSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleNameChange = (value: string) => {
    updateExercise(blockIndex, exerciseIndex, { name: value });
    
    // Debounce API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      searchExercises(value);
    }, 300);
  };

  const selectExercise = (exerciseName: string) => {
    updateExercise(blockIndex, exerciseIndex, { name: exerciseName });
    setShowSuggestions(false);
    setExerciseSuggestions([]);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div ref={setNodeRef} style={style} className={`exercise-item ${isRest ? 'rest-item' : ''}`} {...attributes}>
      {/* Exercise Header - Same for both modes */}
      <div className="exercise-header">
        {editMode && <span className="drag-handle" {...listeners}>☰</span>}
        <div className="exercise-icon">
          {(exercise as any).gifUrl ? (
            <img src={(exercise as any).gifUrl} alt={exercise.name} />
          ) : (
            <LuDumbbell className="exercise-icon-placeholder" />
          )}
        </div>
        <div className="exercise-header-info">
          {editMode ? (
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="exercise-name-input-inline"
              placeholder={isRest ? "Rest" : "Exercise name"}
            />
          ) : (
            <span className="exercise-name">{exercise.name}</span>
          )}
          {editMode ? (
            <input
              type="number"
              value={(exercise as any).sets || 1}
              min={1}
              onChange={(e) => updateExercise(blockIndex, exerciseIndex, { sets: parseInt(e.target.value) || 1 } as any)}
              className="exercise-set-count-input"
              placeholder="Sets"
            />
          ) : (
            <span className="exercise-set-count">{(exercise as any).sets || 1} Set{((exercise as any).sets || 1) > 1 ? 's' : ''}</span>
          )}
        </div>
        {editMode && (
          <button
            className="remove-exercise-btn-header"
            onClick={() => removeExerciseFromBlock(blockIndex, exerciseIndex)}
            title="Remove exercise"
          >
            ✕
          </button>
        )}
      </div>

      {/* Exercise suggestions dropdown */}
      {editMode && showSuggestions && exerciseSuggestions.length > 0 && (
        <div className="exercise-suggestions">
          {isLoadingSuggestions && <div className="suggestion-loading">Loading...</div>}
          {exerciseSuggestions.map((ex, idx) => (
            <div
              key={idx}
              className="exercise-suggestion-item"
              onClick={() => selectExercise(ex.name)}
            >
              <span className="suggestion-name">{ex.name}</span>
              <span className="suggestion-target">{ex.target}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sets Table - Same layout for both modes */}
      <div className="exercise-sets-container">
        <div className="exercise-sets-header">
          <span>Set</span>
          <span>Rest</span>
          <span 
            className={editMode ? 'clickable-header' : ''}
            onClick={editMode ? cycleMeasurementType : undefined}
            title={editMode ? 'Click to change measurement type' : ''}
          >
            {measurementType === MeasurementType.TIME ? 'Time' : 
             measurementType === MeasurementType.DISTANCE ? 'Distance' : 'Reps'}
          </span>
          <span 
            className={editMode ? 'clickable-header' : ''}
            onClick={editMode ? cycleWeightUnit : undefined}
            title={editMode ? 'Click to change weight unit' : ''}
          >
            {getWeightUnitLabel()}
          </span>
        </div>
        {Array.from({ length: (exercise as any).sets || 1 }).map((_, setIndex) => (
          <div key={setIndex} className="exercise-set-row">
            <span className="exercise-set-value">{setIndex + 1}</span>
            {editMode ? (
              <>
                <input
                  type="number"
                  value={exercise.rest || ''}
                  onChange={(e) => updateExercise(blockIndex, exerciseIndex, { rest: parseInt(e.target.value) || 0 })}
                  className="exercise-set-input"
                  placeholder="0"
                />
                <input
                  type="number"
                  value={exercise.targetReps || ''}
                  min={1}
                  onChange={(e) => updateExercise(blockIndex, exerciseIndex, { targetReps: parseInt(e.target.value) || 0 })}
                  className="exercise-set-input"
                  placeholder="0"
                />
                <input
                  type="number"
                  value={exercise.targetWeight || ''}
                  onChange={(e) => updateExercise(blockIndex, exerciseIndex, { targetWeight: parseInt(e.target.value) || 0 })}
                  className="exercise-set-input"
                  placeholder="0"
                />
              </>
            ) : (
              <>
                <span className="exercise-set-value">{exercise.rest ? `${exercise.rest}s` : '-'}</span>
                <span className="exercise-set-value">
                  {measurementType === MeasurementType.TIME 
                    ? `${exercise.targetReps || 0}s` 
                    : exercise.targetReps || 0}
                </span>
                <span className="exercise-set-value">{exercise.targetWeight || 0}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseItem;
