import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CircuitItem from '../CircuitItem';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null }),
  verticalListSortingStrategy: {},
  arrayMove: vi.fn(),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

function makeExercise(name = 'Push-up', order = 0) {
  return {
    name,
    order,
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    notes: '',
    sets: 3,
    hasSuperset: false,
    measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
    setData: [{ reps: 10, weight: 0, rest: 0 }],
  };
}

function makeBlock(overrides = {}) {
  return {
    type: BlockType.SINGLE,
    name: 'Block 1',
    targetSets: 3,
    rest: 0,
    order: 0,
    exercises: [makeExercise()],
    ...overrides,
  };
}

function makeWorkout(blocks: any[] = []) {
  return { blocks, sections: [] };
}

describe('CircuitItem — SINGLE block Group Exercise button', () => {
  it('passes onGroupExercise to ExerciseItem which promotes block to CIRCUIT', () => {
    const onUpdateBlock = vi.fn();
    const block = makeBlock();
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    const groupBtn = screen.getByRole('button', { name: /group exercise/i });
    fireEvent.click(groupBtn);
    expect(onUpdateBlock).toHaveBeenCalledWith(expect.objectContaining({
      type: BlockType.CIRCUIT,
      exercises: expect.arrayContaining([
        expect.objectContaining({ name: 'Push-up' }),
        expect.objectContaining({ name: '' }),
      ]),
    }));
  });
});

describe('CircuitItem — group block rest unit toggle', () => {
  it('shows s⟳ toggle button in group header', () => {
    const block = makeBlock({
      type: BlockType.CIRCUIT,
      rest: 90,
      exercises: [makeExercise('Push-up', 0), makeExercise('Squat', 1)],
    });
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={vi.fn()}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /s ⟳|min ⟳/i })).toBeInTheDocument();
  });

  it('toggles between seconds and minutes display', () => {
    const block = makeBlock({
      type: BlockType.CIRCUIT,
      rest: 120,
      exercises: [makeExercise('Push-up', 0), makeExercise('Squat', 1)],
    });
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={vi.fn()}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /s ⟳/i });
    expect(toggleBtn).toHaveTextContent('s ⟳');
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /min ⟳/i })).toHaveTextContent('min ⟳');
  });
});
