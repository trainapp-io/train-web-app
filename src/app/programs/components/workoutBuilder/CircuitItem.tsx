import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuX, LuPlus } from 'react-icons/lu';
import ExerciseItem from './ExerciseItem';
import { Block, BlockType, WorkoutRequest, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

interface Props {
  block: Block;
  blockNumber: number;
  editMode: boolean;
  logMode?: boolean;
  workout: WorkoutRequest;
  onUpdateBlock: (updated: Block) => void;
  onRemoveBlock: () => void;
  onSetHasUnsavedChanges: (hasChanges: boolean) => void;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<any>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
  /** Index of the active exercise within this block (-1 = none active in this block) */
  activeExerciseIndex?: number;
  onSelectExercise?: (exerciseIndex: number) => void;
}

const CircuitItem: React.FC<Props> = ({
  block,
  blockNumber,
  editMode,
  logMode = false,
  workout,
  onUpdateBlock,
  onRemoveBlock,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  activeExerciseIndex = -1,
  onSelectExercise,
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

  const addSupersetAfter = (index: number) => {
    const updated = [...block.exercises];
    updated[index] = { ...updated[index], hasSuperset: true };
    updated.splice(index + 1, 0, {
      name: '',
      rest: 0,
      targetReps: 10,
      targetDurationSec: 0,
      targetWeight: 0,
      targetDistance: 0,
      measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
      notes: '',
      order: 0,
      sets: 3,
      hasSuperset: false,
    });
    onUpdateBlock({ ...block, exercises: updated.map((ex, i) => ({ ...ex, order: i })) });
  };

  const removeSupersetExercise = (index: number) => {
    const updated = block.exercises
      .map((ex, i) => i === index - 1 ? { ...ex, hasSuperset: false } : ex)
      .filter((_, i) => i !== index)
      .map((ex, i) => ({ ...ex, order: i }));
    onUpdateBlock({ ...block, exercises: updated });
  };

  const blockIndex = workout.blocks?.findIndex((b) => b.order === block.order) ?? 0;
  const restSeconds = (block as any).rest || 0;

  return (
    <div className="block-card">
      {/* ── Block header — single row ── */}
      {block.type !== BlockType.SINGLE && (<div className="block-card__header">
        <span className="block-card__num">#{blockNumber}</span>

        {editMode ? (
          <>
            <input
              className="block-card__name-input"
              type="text"
              value={block.name}
              onChange={(e) => onUpdateBlock({ ...block, name: e.target.value })}
              placeholder="Block name…"
              aria-label="Block name"
            />

            <span className="block-card__divider" aria-hidden="true" />

            <div className="ex-m">
              <input
                className="ex-m__input"
                type="number"
                min={1}
                value={block.targetSets}
                onChange={(e) => onUpdateBlock({ ...block, targetSets: parseInt(e.target.value) || 1 })}
                aria-label="Target sets"
              />
              <span className="ex-m__label">sets</span>
            </div>

            <span className="ex-m__sep">·</span>

            <div className="ex-m">
              <input
                className="ex-m__input"
                type="number"
                min={0}
                value={restSeconds || ''}
                onChange={(e) => onUpdateBlock({ ...block, rest: parseInt(e.target.value) || 0 } as any)}
                placeholder="0"
                aria-label="Rest seconds"
              />
              <span className="ex-m__label">s rest</span>
            </div>

            {!logMode && (
              <button className="ex-card__remove" onClick={onRemoveBlock} aria-label="Remove block">
                <LuX size={15} />
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="block-card__name">{block.name}</h3>
            <div className="block-card__pills">
              <span className="block-pill block-pill--sets">{block.targetSets} sets</span>
              {restSeconds > 0 && (
                <span className="block-pill block-pill--rest">{restSeconds}s rest</span>
              )}
            </div>
          </>
        )}
      </div>)}

      {/* ── Exercises ── */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
          <div className="block-card__exercises">
            {block.exercises.length === 0 && editMode && (
              <p className="block-card__empty">No exercises yet — add one below.</p>
            )}
            {block.exercises.map((exercise, exerciseIndex) => {
              const isSuperset = exerciseIndex > 0 && block.exercises[exerciseIndex - 1].hasSuperset;
              const isSinglePrimary = block.type === BlockType.SINGLE && exerciseIndex === 0;

              const item = (
                <ExerciseItem
                  key={exercise.order}
                  exercise={exercise}
                  editMode={editMode}
                  logMode={logMode}
                  blockIndex={blockIndex}
                  exerciseIndex={exerciseIndex}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={
                    isSinglePrimary && !isSuperset
                      ? () => onRemoveBlock()
                      : isSuperset
                      ? () => removeSupersetExercise(exerciseIndex)
                      : removeExerciseFromBlock
                  }
                  isActive={logMode ? activeExerciseIndex === exerciseIndex : undefined}
                  onSelect={logMode ? () => onSelectExercise?.(exerciseIndex) : undefined}
                  onAddSuperset={editMode && !isSuperset ? () => addSupersetAfter(exerciseIndex) : undefined}
                />
              );

              return isSuperset
                ? <div key={exercise.order} className="ex-superset-wrapper">{item}</div>
                : item;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Add exercise (circuit/other blocks) ── */}
      {editMode && !logMode && block.type !== BlockType.SINGLE && (
        <button className="block-card__add-ex" onClick={addExercise}>
          <LuPlus aria-hidden="true" /> Add Exercise
        </button>
      )}
    </div>
  );
};

export default CircuitItem;
