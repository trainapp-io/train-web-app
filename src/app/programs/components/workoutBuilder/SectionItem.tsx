import React from 'react';
import { LuX, LuPlus, LuGripVertical } from 'react-icons/lu';
import { Block, BlockType, Exercise, MeasurementType, MeasurementUnit, Section, WorkoutRequest } from '@trainapp-io/train-core';
import CircuitItem from './CircuitItem';

interface Props {
  section: Section;
  editMode: boolean;
  workout: WorkoutRequest;
  onUpdate: (updated: Section) => void;
  onRemove: () => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
}

function createEmptyExercise(order: number): Exercise {
  return {
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
  };
}

const SectionItem: React.FC<Props> = ({
  section,
  editMode,
  workout,
  onUpdate,
  onRemove,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
}) => {
  const addExerciseToSection = () => {
    const newBlock: Block = {
      type: BlockType.SINGLE,
      name: `Exercise ${section.blocks.length + 1}`,
      targetSets: 3,
      rest: 0,
      exercises: [createEmptyExercise(0)],
      order: section.blocks.length,
    };
    onUpdate({ ...section, blocks: [...section.blocks, newBlock] });
  };

  const handleUpdateBlock = (updated: Block) => {
    onUpdate({
      ...section,
      blocks: section.blocks.map((b) => b.order === updated.order ? updated : b),
    });
    onSetHasUnsavedChanges(true);
  };

  const handleRemoveBlock = (block: Block) => {
    onUpdate({
      ...section,
      blocks: section.blocks.filter((b) => b.order !== block.order),
    });
    onSetHasUnsavedChanges(true);
  };

  // Build a workout shell so CircuitItem can resolve blockIndex within the section
  const sectionWorkoutShell: WorkoutRequest = {
    ...workout,
    blocks: section.blocks,
  };

  return (
    <div
      className="section-card"
      style={{
        border: '1.5px solid #e5e7eb',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {/* Section header */}
      <div
        className="section-card__header"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: '#f3f4f6',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {editMode && (
          <span style={{ color: '#d1d5db', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
            <LuGripVertical size={14} />
          </span>
        )}
        <span
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            padding: '2px 8px', borderRadius: 5,
            background: '#e0f2fe', color: '#075985',
            textTransform: 'uppercase' as const, flexShrink: 0,
          }}
        >
          SECTION
        </span>
        {editMode ? (
          <input
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, color: '#111827',
              outline: 'none', minWidth: 0,
            }}
            value={section.name}
            onChange={(e) => {
              onUpdate({ ...section, name: e.target.value });
              onSetHasUnsavedChanges(true);
            }}
            placeholder="Section name…"
            aria-label="Section name"
          />
        ) : (
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>
            {section.name || 'Untitled Section'}
          </span>
        )}
        {editMode && (
          <button
            onClick={onRemove}
            aria-label="Remove section"
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
          >
            <LuX size={14} />
          </button>
        )}
      </div>

      {/* Section body */}
      <div style={{ padding: '8px 12px 4px' }}>
        {section.blocks.map((block, idx) => (
          <CircuitItem
            key={block.order}
            block={block}
            blockNumber={idx + 1}
            editMode={editMode}
            workout={sectionWorkoutShell}
            onUpdateBlock={handleUpdateBlock}
            onRemoveBlock={() => handleRemoveBlock(block)}
            onSetHasUnsavedChanges={onSetHasUnsavedChanges}
            updateExerciseInBlockPartial={updateExerciseInBlockPartial}
            removeExerciseFromBlock={removeExerciseFromBlock}
          />
        ))}

        {editMode && (
          <button
            onClick={addExerciseToSection}
            type="button"
            aria-label="Add Exercise to Section"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              width: '100%', padding: '7px 10px',
              fontSize: 12, fontWeight: 600, color: '#075985',
              background: 'none', border: '1px dashed #bae6fd',
              borderRadius: 8, cursor: 'pointer', marginBottom: 8,
              justifyContent: 'center',
            }}
          >
            <LuPlus size={13} aria-hidden="true" /> Add Exercise to Section
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionItem;
