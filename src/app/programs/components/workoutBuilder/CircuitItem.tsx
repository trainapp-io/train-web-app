// WorkoutView/components/CircuitItem.tsx
import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import ExerciseItem from './ExerciseItem';
import TimePicker from './TimePicker';
import { Block, WorkoutRequest, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';


interface Props {
  block: Block;
  editMode: boolean;
  workout: WorkoutRequest;
  onUpdateBlock: (updated: Block) => void;
  onRemoveBlock: () => void;
  onSetHasUnsavedChanges: (hasChanges: boolean) => void;
}

const CircuitItem: React.FC<Props> = ({
  block,
  editMode,
  workout,
  onUpdateBlock,
  onRemoveBlock,
  onSetHasUnsavedChanges,
}) => {

  const updateBlock = (updated: Block) => {
    onUpdateBlock(updated);
  };

  const removeBlock = () => {
    onRemoveBlock();
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = block.exercises.findIndex((e) => e.order === active.id);
    const newIndex = block.exercises.findIndex((e) => e.order === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reordered = arrayMove(block.exercises, oldIndex, newIndex);
    
    // Update order property for all exercises after reordering
    const reorderedWithUpdatedOrder = reordered.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    updateBlock({ ...block, exercises: reorderedWithUpdatedOrder });
    onSetHasUnsavedChanges(true);
  };

  return (
    <div className="circuit-block">
      <div className="circuit-header">
        {editMode ? (
          <>
            <div className="circuit-header-right">
              <div className="circuit-sets">
                <label>Sets:</label>
                <input
                  type="number"
                  value={block.targetSets}
                  onChange={(e) => updateBlock({ ...block, targetSets: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="sets-input"
                />
              </div>
              <div className="circuit-rest">
                <label>Rest:</label>
                <TimePicker
                  value={(block as any).rest || 0}
                  onChange={(seconds) => updateBlock({ ...block, rest: seconds } as any)}
                  placeholder="Rest"
                />
              </div>
              <button
                className="remove-circuit-btn"
                onClick={removeBlock}
                title="Remove circuit"
              >
                ✕
              </button>
            </div>
            <div className="circuit-header-left">
              <input
                type="text"
                value={block.name}
                onChange={(e) => updateBlock({ ...block, name: e.target.value })}
                className="circuit-name-input"
                placeholder="Circuit name"
              />
            </div>
          </>
        ) : (
          <>
            <div className="circuit-sets">
              <span className="sets-label">{block.targetSets} sets</span>
            </div>
            {block.rest != null && block.rest > 0 && (
              <div className="circuit-rest">
                <span className="rest-label">{block.rest}s rest</span>
              </div>
            )}
            <h3>{block.name}</h3>
          </>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
          {block.exercises.map((exercise, exerciseIndex) => (
            <ExerciseItem
              key={exercise.order}
              exercise={exercise}
              editMode={editMode}
              blockIndex={workout.blocks?.findIndex(b => b.order === block.order) ?? 0}
              exerciseIndex={exerciseIndex}
            />
          ))}
        </SortableContext>
      </DndContext>

      {editMode && (
        <button
          className="add-exercise-btn"
          onClick={() =>
            updateBlock({
              ...block,
              exercises: [
                ...block.exercises,
                {
                  name: '',
                  rest: 0,
                  targetReps: 10,
                  targetDurationSec: 0,
                  targetWeight: 0,
                  targetDistance: 0,
                  measurement: {
                    measurementType: MeasurementType.REPS,
                    measurementUnit: MeasurementUnit.POUND,
                  },
                  notes: '',
                  order: block.exercises.length,
                  sets: 1,
                  hasSuperset: false,
                },
              ],
            })
          }
        >
          + Add Exercise
        </button>
      )}
    </div>
  );
};

export default CircuitItem;
