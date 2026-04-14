import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionItem from '../SectionItem';
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

function makeSection(name = 'W/U (400)') {
  return {
    name,
    order: 0,
    blocks: [],
  };
}

function makeWorkout() {
  return { blocks: [], sections: [] };
}

describe('SectionItem', () => {
  it('renders SECTION badge', () => {
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByText('SECTION')).toBeInTheDocument();
  });

  it('renders the section name in an editable input', () => {
    render(
      <SectionItem
        section={makeSection('Main Set')}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('Main Set')).toBeInTheDocument();
  });

  it('calls onUpdate when name is changed', () => {
    const onUpdate = vi.fn();
    render(
      <SectionItem
        section={makeSection('Main Set')}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.change(screen.getByDisplayValue('Main Set'), { target: { value: 'Cool Down' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cool Down' }));
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={onRemove}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove section/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders + Add Exercise to Section button in edit mode', () => {
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add exercise to section/i })).toBeInTheDocument();
  });

  it('adds a new SINGLE block when + Add Exercise to Section is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add exercise to section/i }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      blocks: expect.arrayContaining([
        expect.objectContaining({ type: BlockType.SINGLE }),
      ]),
    }));
  });
});
