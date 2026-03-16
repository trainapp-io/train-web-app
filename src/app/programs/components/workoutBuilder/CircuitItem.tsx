import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuX, LuPlus } from 'react-icons/lu';
import ExerciseItem from './ExerciseItem';
import TimePicker from './TimePicker';
import { Block, WorkoutRequest, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

interface Props {
  block: Block;
  blockNumber: number;
  editMode: boolean;
  workout: WorkoutRequest;
  onUpdateBlock: (updated: Block) => void;
  onRemoveBlock: () => void;
  onSetHasUnsavedChanges: (hasChanges: boolean) => void;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<any>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
}

const CircuitItem: React.FC<Props> = ({
  block,
  blockNumber,
  editMode,
  workout,
  onUpdateBlock,
  onRemoveBlock,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = block.exercises.findIndex((e) => e.order === active.id);
    const newIndex = block.exercises.findIndex((e) => e.order === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(block.exercises, oldIndex, newIndex).map((ex, i) => ({ ...ex, order: i }));
    onUpdateBlock({ ...block, exercises: reordered });
    onSetHasUnsavedChanges(true);
  };

  const addExercise = () => {
    onUpdateBlock({
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
          measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
          notes: '',
          order: block.exercises.length,
          sets: 3,
          hasSuperset: false,
        },
      ],
    });
  };

  const blockIndex = workout.blocks?.findIndex((b) => b.order === block.order) ?? 0;
  const restSeconds = (block as any).rest || 0;

  return (
    <div className="block-card">
      {/* ── Block header ── */}
      <div className={`block-card__header ${editMode ? 'block-card__header--edit' : ''}`}>
        {editMode ? (
          <>
            <span className="block-card__num">#{blockNumber}</span>
            <input
              className="block-card__name-input"
              type="text"
              value={block.name}
              onChange={(e) => onUpdateBlock({ ...block, name: e.target.value })}
              placeholder="Block name"
              aria-label="Block name"
            />
            <div className="block-card__controls">
              <div className="block-ctrl">
                <span className="block-ctrl__label">Sets</span>
                <input
                  className="block-ctrl__input"
                  type="number"
                  min={1}
                  value={block.targetSets}
                  onChange={(e) => onUpdateBlock({ ...block, targetSets: parseInt(e.target.value) || 1 })}
                  aria-label="Target sets"
                />
              </div>
              <div className="block-ctrl">
                <span className="block-ctrl__label">Rest</span>
                <TimePicker
                  value={restSeconds}
                  onChange={(s) => onUpdateBlock({ ...block, rest: s } as any)}
                  placeholder="0"
                />
              </div>
              <button className="block-card__remove" onClick={onRemoveBlock} aria-label="Remove block">
                <LuX />
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="block-card__num">#{blockNumber}</span>
            <h3 className="block-card__name">{block.name}</h3>
            <div className="block-card__pills">
              <span className="block-pill block-pill--sets">{block.targetSets} sets</span>
              {restSeconds > 0 && (
                <span className="block-pill block-pill--rest">{restSeconds}s rest</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Exercises ── */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
          <div className="block-card__exercises">
            {block.exercises.length === 0 && editMode && (
              <p className="block-card__empty">No exercises yet — add one below.</p>
            )}
            {block.exercises.map((exercise, exerciseIndex) => (
              <ExerciseItem
                key={exercise.order}
                exercise={exercise}
                editMode={editMode}
                blockIndex={blockIndex}
                exerciseIndex={exerciseIndex}
                updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                removeExerciseFromBlock={removeExerciseFromBlock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Add exercise ── */}
      {editMode && (
        <button className="block-card__add-ex" onClick={addExercise}>
          <LuPlus aria-hidden="true" /> Add Exercise
        </button>
      )}
    </div>
  );
};

export default CircuitItem;
