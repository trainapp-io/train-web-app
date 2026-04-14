import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuPlus } from 'react-icons/lu';
import { WorkoutRequest, Block, Section, BlockType, Exercise, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';
import CircuitItem from './CircuitItem';
import SectionItem from './SectionItem';
import EmptyState from './EmptyState';

interface Props {
  workout: WorkoutRequest;
  editMode: boolean;
  isOwner: boolean;
  onBlocksChange: (blocks: Block[]) => void;
  onSectionsChange?: (sections: Section[]) => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
  onEditModeStart: () => void;
}

type OrderedItem =
  | { kind: 'block'; item: Block }
  | { kind: 'section'; item: Section };

function mergeByOrder(blocks: Block[], sections: Section[]): OrderedItem[] {
  const result: OrderedItem[] = [
    ...blocks.map((b): OrderedItem => ({ kind: 'block', item: b })),
    ...sections.map((s): OrderedItem => ({ kind: 'section', item: s })),
  ];
  return result.sort((a, b) => a.item.order - b.item.order);
}

const WorkoutBuilderBlocks: React.FC<Props> = ({
  workout,
  editMode,
  isOwner,
  onBlocksChange,
  onSectionsChange,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  onEditModeStart,
}) => {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const blocks = workout.blocks ?? [];
  const sections = workout.sections ?? [];
  const orderedItems = mergeByOrder(blocks, sections);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((c) => c.order === active.id);
    const newIndex = blocks.findIndex((c) => c.order === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx })));
  };

  const addExercise = () => {
    const maxOrder = Math.max(-1, ...blocks.map((b) => b.order), ...sections.map((s) => s.order));
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
        order: maxOrder + 1,
      },
    ]);
  };

  const addSection = () => {
    if (!onSectionsChange) return;
    const maxOrder = Math.max(-1, ...blocks.map((b) => b.order), ...sections.map((s) => s.order));
    onSectionsChange([
      ...sections,
      {
        name: '',
        blocks: [],
        order: maxOrder + 1,
      },
    ]);
  };

  const isEmpty = orderedItems.length === 0;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="circuits-container">
        {!isEmpty ? (
          <SortableContext
            items={orderedItems.map((oi) => oi.item.order)}
            strategy={verticalListSortingStrategy}
          >
            {orderedItems.map((oi) => {
              if (oi.kind === 'section') {
                const section = oi.item as Section;
                // Provide section-scoped exercise callbacks so CircuitItem resolves
                // blockIndex against section.blocks, not the top-level workout.blocks.
                const updateExerciseInSection = (
                  blockIndex: number,
                  exerciseIndex: number,
                  updates: Partial<Exercise>
                ) => {
                  const updatedBlocks = section.blocks.map((b, bIdx) => {
                    if (bIdx !== blockIndex) return b;
                    const updatedExercises = b.exercises.map((ex, eIdx) =>
                      eIdx === exerciseIndex ? { ...ex, ...updates } : ex
                    );
                    return { ...b, exercises: updatedExercises };
                  });
                  onSectionsChange?.(
                    sections.map((s) =>
                      s.order === section.order ? { ...s, blocks: updatedBlocks } : s
                    )
                  );
                };

                const removeExerciseFromSection = (
                  blockIndex: number,
                  exerciseIndex: number
                ) => {
                  const updatedBlocks = section.blocks.map((b, bIdx) => {
                    if (bIdx !== blockIndex) return b;
                    return { ...b, exercises: b.exercises.filter((_, eIdx) => eIdx !== exerciseIndex) };
                  });
                  onSectionsChange?.(
                    sections.map((s) =>
                      s.order === section.order ? { ...s, blocks: updatedBlocks } : s
                    )
                  );
                };

                return (
                  <SectionItem
                    key={`section-${section.order}`}
                    section={section}
                    editMode={editMode && isOwner}
                    workout={workout}
                    onUpdate={(updated) =>
                      onSectionsChange?.(sections.map((s) => s.order === updated.order ? updated : s))
                    }
                    onRemove={() =>
                      onSectionsChange?.(sections.filter((s) => s.order !== section.order))
                    }
                    onSetHasUnsavedChanges={onSetHasUnsavedChanges}
                    updateExerciseInBlockPartial={updateExerciseInSection}
                    removeExerciseFromBlock={removeExerciseFromSection}
                  />
                );
              }
              const block = oi.item as Block;
              return (
                <CircuitItem
                  key={`block-${block.order}`}
                  block={block}
                  blockNumber={orderedItems.indexOf(oi) + 1}
                  editMode={editMode && isOwner}
                  workout={workout}
                  onUpdateBlock={(updated) => onBlocksChange(blocks.map((c) => c.order === updated.order ? updated : c))}
                  onRemoveBlock={() => onBlocksChange(blocks.filter((c) => c.order !== block.order))}
                  onSetHasUnsavedChanges={onSetHasUnsavedChanges}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                />
              );
            })}
          </SortableContext>
        ) : (
          !editMode && <EmptyState onStart={onEditModeStart} isOwner={isOwner} />
        )}

        {editMode && isOwner && (
          <div className="add-block-row">
            <button className="add-circuit-btn" onClick={addExercise}>
              <LuPlus aria-hidden="true" /> Add Exercise
            </button>
            <button className="add-circuit-btn" onClick={addSection}>
              <LuPlus aria-hidden="true" /> Add Section
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default WorkoutBuilderBlocks;
