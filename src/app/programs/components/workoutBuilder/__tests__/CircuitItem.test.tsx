import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CircuitItem from '../CircuitItem';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

// Mock @dnd-kit/sortable so useSortable returns stubs
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
  SortableContext: ({ children }: any) => <>{children}</>,
  verticalListSortingStrategy: {},
  arrayMove: (arr: any[]) => arr,
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <>{children}</>,
  closestCenter: {},
}));

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

function makeExercise(name: string, order: number) {
  return {
    name, order, measurement: baseMeasurement,
    targetReps: 10, targetWeight: 0, rest: 60, sets: 3, hasSuperset: false,
    setData: [{ reps: 10, weight: 0, rest: 60 }, { reps: 10, weight: 0, rest: 60 }, { reps: 10, weight: 0, rest: 60 }],
  };
}

function makeBlock(exercises: any[], type = BlockType.CIRCUIT) {
  return { type, name: 'Test Block', targetSets: 3, order: 0, exercises };
}

function makeProps(block: any) {
  return {
    block,
    blockNumber: 1,
    editMode: true,
    logMode: false,
    workout: { name: 'Test', blocks: [block] } as any,
    onUpdateBlock: vi.fn(),
    onRemoveBlock: vi.fn(),
    onSetHasUnsavedChanges: vi.fn(),
    updateExerciseInBlockPartial: vi.fn(),
    removeExerciseFromBlock: vi.fn(),
  };
}

describe('CircuitItem badge auto-labeling', () => {
  it('shows "Superset" badge for 2 exercises', () => {
    const block = makeBlock([makeExercise('Curl', 0), makeExercise('Extension', 1)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Superset')).toBeInTheDocument();
  });

  it('shows "Tri-set" badge for 3 exercises', () => {
    const block = makeBlock([makeExercise('A', 0), makeExercise('B', 1), makeExercise('C', 2)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Tri-set')).toBeInTheDocument();
  });

  it('shows "Circuit" badge for 4 or more exercises', () => {
    const block = makeBlock([makeExercise('A', 0), makeExercise('B', 1), makeExercise('C', 2), makeExercise('D', 3)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Circuit')).toBeInTheDocument();
  });

  it('shows "then" connector between exercises', () => {
    const block = makeBlock([makeExercise('Curl', 0), makeExercise('Extension', 1)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText(/then/i)).toBeInTheDocument();
  });
});
