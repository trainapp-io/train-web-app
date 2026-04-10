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
  activeExerciseIndex?: number;
  onSelectExercise?: (exerciseIndex: number) => void;
  onSetCompleted?: (restSeconds: number) => void;
}

function getGroupLabel(count: number): { label: string; color: string; bg: string } {
  if (count === 2) return { label: 'Superset', color: '#1d4ed8', bg: '#eff6ff' };
  if (count === 3) return { label: 'Tri-set', color: '#6d28d9', bg: '#faf5ff' };
  return { label: 'Circuit', color: '#6d28d9', bg: '#faf5ff' };
}

const CircuitItem: React.FC<Props> = ({
  block,
  blockNumber: _blockNumber,
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
  onSetCompleted,
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
          setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
        },
      ],
    });
  };

  const blockIndex = workout.blocks?.findIndex((b) => b.order === block.order) ?? 0;
  const restSeconds = (block as any).rest || 0;
  const isSingle = block.type === BlockType.SINGLE;

  // ── SINGLE block: render ExerciseItem directly, no group card ──
  if (isSingle) {
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
          <div className="block-card block-card--single">
            {block.exercises.map((exercise, exerciseIndex) => (
              <ExerciseItem
                key={exercise.order}
                exercise={exercise}
                editMode={editMode}
                logMode={logMode}
                blockIndex={blockIndex}
                exerciseIndex={exerciseIndex}
                updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                removeExerciseFromBlock={
                  exerciseIndex === 0
                    ? () => onRemoveBlock()
                    : removeExerciseFromBlock
                }
                isActive={logMode ? activeExerciseIndex === exerciseIndex : undefined}
                onSelect={logMode ? () => onSelectExercise?.(exerciseIndex) : undefined}
                onSetCompleted={onSetCompleted}
                setColumnLabel="Set"
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // ── Circuit / Superset / Tri-set: grouped card ──
  const { label, color, bg } = getGroupLabel(block.exercises.length);

  return (
    <div className="block-card block-card--group">
      {/* Group header */}
      <div className="block-card__header" style={{ background: bg, borderBottom: `1px solid ${color}22` }}>
        <span className="block-card__badge" style={{ background: color }}>
          {label}
        </span>

        {editMode ? (
          <>
            <input
              className="block-card__name-input"
              type="text"
              value={block.name}
              onChange={(e) => onUpdateBlock({ ...block, name: e.target.value })}
              placeholder="Group name…"
              aria-label="Block name"
              style={{ color }}
            />

            <div className="ex-m" style={{ marginLeft: 'auto' }}>
              <input
                className="ex-m__input"
                type="number" min={1}
                value={block.targetSets}
                onChange={(e) => onUpdateBlock({ ...block, targetSets: parseInt(e.target.value) || 1 })}
                aria-label="Rounds"
              />
              <span className="ex-m__label">rounds</span>
            </div>

            <div className="ex-m" style={{ marginLeft: 8 }}>
              <input
                className="ex-m__input"
                type="number" min={0}
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
            <h3 className="block-card__name" style={{ color }}>{block.name}</h3>
            <div className="block-card__pills">
              <span className="block-pill block-pill--sets">{block.targetSets} rounds</span>
              {restSeconds > 0 && (
                <span className="block-pill block-pill--rest">{restSeconds}s rest</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Exercises */}
      <div className="block-card__exercises" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
            {block.exercises.map((exercise, exerciseIndex) => (
              <React.Fragment key={exercise.order}>
                {exerciseIndex > 0 && (
                  <div className="block-card__connector" aria-hidden="true">
                    <div className="block-card__connector-line" style={{ borderColor: color }} />
                    <span className="block-card__connector-label">then</span>
                  </div>
                )}
                <ExerciseItem
                  exercise={exercise}
                  editMode={editMode}
                  logMode={logMode}
                  blockIndex={blockIndex}
                  exerciseIndex={exerciseIndex}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                  isActive={logMode ? activeExerciseIndex === exerciseIndex : undefined}
                  onSelect={logMode ? () => onSelectExercise?.(exerciseIndex) : undefined}
                  onSetCompleted={onSetCompleted}
                  setColumnLabel="Rnd"
                />
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add exercise inside group */}
      {editMode && !logMode && (
        <div style={{ padding: '6px 12px 12px' }}>
          <button className="block-card__add-ex" onClick={addExercise} style={{ borderColor: `${color}55`, color }}>
            <LuPlus aria-hidden="true" /> Add Exercise
          </button>
        </div>
      )}
    </div>
  );
};

export default CircuitItem;
