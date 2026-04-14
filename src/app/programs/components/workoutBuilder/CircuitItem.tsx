import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuX, LuPlus } from 'react-icons/lu';
import ExerciseItem from './ExerciseItem';
import { Block, BlockType, WorkoutRequest, MeasurementType, MeasurementUnit, SetLog } from '@trainapp-io/train-core';

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
  /** Whether this block is the currently focused/expanded block in log mode */
  isBlockActive?: boolean;
  /** Called when user taps a collapsed block to jump to it */
  onJumpTo?: () => void;
}

function getGroupLabel(count: number): { label: string; color: string; bg: string } {
  if (count === 2) return { label: 'Superset', color: '#6d28d9', bg: '#faf5ff' };
  if (count === 3) return { label: 'Tri-set', color: '#9d174d', bg: '#fce7f3' };
  return { label: 'Circuit', color: '#065f46', bg: '#d1fae5' };
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
  onSelectExercise: _onSelectExercise,
  onSetCompleted,
  isBlockActive = true,
  onJumpTo,
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
        createEmptyExercise(block.exercises.length),
      ],
    });
  };

  const createEmptyExercise = (order: number) => ({
    name: '',
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
    notes: '',
    order,
    sets: 3,
    hasSuperset: false,
    setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
  });

  const promoteToGroup = () => {
    onUpdateBlock({
      ...block,
      type: BlockType.CIRCUIT,
      exercises: [
        ...block.exercises,
        createEmptyExercise(block.exercises.length),
      ],
    });
  };

  const blockIndex = workout.blocks?.findIndex((b) => b.order === block.order) ?? 0;
  const restSeconds = (block as any).rest || 0;
  const isSingle = block.type === BlockType.SINGLE;

  const [restUnit, setRestUnit] = useState<'seconds' | 'minutes'>('seconds');

  const displayGroupRest = () => {
    if (!restSeconds) return '';
    return restUnit === 'minutes' ? String(+(restSeconds / 60).toFixed(1)) : String(restSeconds);
  };

  const parseGroupRest = (val: string) => {
    const n = parseFloat(val) || 0;
    return restUnit === 'minutes' ? Math.round(n * 60) : n;
  };

  // ── Group exercise advancement (log mode only) ──
  // For group blocks, CircuitItem owns which exercise is currently active.
  // When you check the current set of exercise N:
  //   - if N+1 exists → advance to it (don't fire rest yet)
  //   - if N is last  → reset to exercise 0 and fire rest (round complete)
  const [groupActiveExIdx, setGroupActiveExIdx] = useState(0);

  // Reset to first exercise whenever this block becomes the active block
  useEffect(() => {
    if (isBlockActive && !isSingle) {
      setGroupActiveExIdx(0);
    }
  }, [isBlockActive, isSingle]);

  // ── Log mode collapsed state for groups ──
  if (logMode && !isSingle && !isBlockActive) {
    const { label, color, bg } = getGroupLabel(block.exercises.length);
    const allExLogs = block.exercises.map((ex) =>
      ((ex as any).setLogs as SetLog[] | undefined) ?? []
    );
    const allCompleted = allExLogs.every((logs) => logs.length > 0 && logs.every((s) => s.isCompleted));
    const someCompleted = allExLogs.some((logs) => logs.some((s) => s.isCompleted));
    const completedRounds = allExLogs.length > 0
      ? Math.min(...allExLogs.map((logs) => logs.filter((s) => s.isCompleted).length))
      : 0;
    const totalRounds = block.targetSets || 1;

    if (allCompleted) {
      return (
        <div className="ex-log-done" onClick={onJumpTo} role="button" tabIndex={0}>
          <div className="ex-log-done__check">✓</div>
          <span
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
              background: bg, color, flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span className="ex-log-done__name">{block.name || label}</span>
          <span className="ex-log-done__summary">{completedRounds} rounds</span>
        </div>
      );
    }

    if (someCompleted) {
      return (
        <div className="ex-log-inprogress" onClick={onJumpTo} role="button" tabIndex={0}>
          <div className="ex-log-inprogress__badge">{completedRounds}/{totalRounds}</div>
          <span
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
              background: bg, color, flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span className="ex-log-inprogress__name">{block.name || label}</span>
          <span className="ex-log-inprogress__status">In progress · tap to resume</span>
        </div>
      );
    }

    return (
      <div className="ex-log-upcoming" onClick={onJumpTo} role="button" tabIndex={0}>
        <div className="ex-log-upcoming__num">
          {block.exercises.length}
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
            background: bg, color, flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span className="ex-log-upcoming__name">{block.name || label}</span>
        <span className="ex-log-upcoming__meta">{totalRounds} rounds</span>
        <span className="ex-log-upcoming__jump">Jump to →</span>
      </div>
    );
  }

  // ── SINGLE block: render ExerciseItem directly ──
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
                isActive={logMode ? (isBlockActive && activeExerciseIndex === exerciseIndex) : undefined}
                onSelect={logMode ? onJumpTo : undefined}
                onSetCompleted={onSetCompleted}
                onGroupExercise={editMode && !logMode ? promoteToGroup : undefined}
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
                value={displayGroupRest()}
                onChange={(e) => {
                  const stored = parseGroupRest(e.target.value);
                  onUpdateBlock({ ...block, rest: stored } as any);
                }}
                placeholder="0"
                aria-label="Rest between rounds"
              />
              <button
                className="ex-rest-unit"
                onClick={() => setRestUnit((u) => u === 'seconds' ? 'minutes' : 'seconds')}
                type="button"
                aria-label={restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
              >
                {restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
              </button>
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
                  isActive={logMode ? (isBlockActive && groupActiveExIdx === exerciseIndex) : undefined}
                  onSelect={logMode ? () => setGroupActiveExIdx(exerciseIndex) : undefined}
                  onSetCompleted={logMode ? (restSecs) => {
                    const nextIdx = exerciseIndex + 1;
                    if (nextIdx < block.exercises.length) {
                      // More exercises in this round — advance, no rest yet
                      setGroupActiveExIdx(nextIdx);
                    } else {
                      // Last exercise in round — reset to first, fire rest
                      setGroupActiveExIdx(0);
                      onSetCompleted?.(restSecs);
                    }
                  } : onSetCompleted}
                  onGroupExercise={editMode && !logMode ? addExercise : undefined}
                  setColumnLabel="Rnd"
                />
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>
      </div>


    </div>
  );
};

export default CircuitItem;
