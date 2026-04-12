import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuPlus } from 'react-icons/lu';
import { WorkoutRequest, Block, BlockType, Exercise, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';
import CircuitItem from './CircuitItem';
import EmptyState from './EmptyState';

interface Props {
  workout: WorkoutRequest;
  editMode: boolean;
  isOwner: boolean;
  /** Called whenever the blocks array changes (add/remove/reorder/update). Parent should call updateWorkoutRequest({ blocks }). */
  onBlocksChange: (blocks: Block[]) => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
  onEditModeStart: () => void;
}

const WorkoutBuilderBlocks: React.FC<Props> = ({
  workout,
  editMode,
  isOwner,
  onBlocksChange,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  onEditModeStart,
}) => {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const blocks = workout.blocks ?? [];

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((c, idx) => idx === active.id || c.order === active.id);
    const newIndex = blocks.findIndex((c, idx) => idx === over.id || c.order === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx })));
  };

  const addCircuit = () => {
    onBlocksChange([
      ...blocks,
      {
        type: BlockType.CIRCUIT,
        name: `Circuit ${blocks.length + 1}`,
        targetSets: 3,
        rest: 0,
        exercises: [],
        order: blocks.length + 1,
      },
    ]);
  };

  const addExercise = () => {
    onBlocksChange([
      ...blocks,
      {
        type: BlockType.SINGLE,
        name: `Exercise ${blocks.length + 1}`,
        targetSets: 3,
        rest: 0,
        exercises: [
          {
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
            setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
          },
        ],
        order: blocks.length + 1,
      },
    ]);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="circuits-container">
        {blocks.length > 0 ? (
          <SortableContext items={blocks.map(c => c.order)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, idx) => (
              <CircuitItem
                key={block.order}
                block={block}
                blockNumber={idx + 1}
                editMode={editMode && isOwner}
                workout={workout}
                onUpdateBlock={(updated) => onBlocksChange(blocks.map(c => c.order === updated.order ? updated : c))}
                onRemoveBlock={() => onBlocksChange(blocks.filter(c => c.order !== block.order))}
                onSetHasUnsavedChanges={onSetHasUnsavedChanges}
                updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                removeExerciseFromBlock={removeExerciseFromBlock}
              />
            ))}
          </SortableContext>
        ) : (
          !editMode && <EmptyState onStart={onEditModeStart} isOwner={isOwner} />
        )}

        {editMode && isOwner && (
          <div className="add-block-row">
            <button className="add-circuit-btn" onClick={addExercise}>
              <LuPlus aria-hidden="true" /> Add Exercise
            </button>
            <button className="add-circuit-btn" onClick={addCircuit}>
              <LuPlus aria-hidden="true" /> Add Circuit
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default WorkoutBuilderBlocks;
