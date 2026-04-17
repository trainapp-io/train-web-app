// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WorkoutLogForm from '../WorkoutLogForm';
import { MeasurementType, MeasurementUnit, BlockType, ProfileAccess } from '@trainapp-io/train-core';

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

// Mock CircuitItem to avoid deep render tree
// Path is 4 levels up from __tests__/ to reach src/app/
vi.mock('../../../../programs/components/workoutBuilder/CircuitItem', () => ({
  default: ({ block }: any) => <div data-testid="circuit-item">{block?.name}</div>,
}));

// Mock sub-components
vi.mock('../WorkoutLogHeader', () => ({
  default: ({ workoutSnapshot }: any) => <div data-testid="wl-header">{workoutSnapshot?.name}</div>,
}));
vi.mock('../CompletionFooter', () => ({
  default: () => <div data-testid="wl-footer" />,
}));

// Use vi.hoisted to create a stable snapshot object that is available when
// vi.mock factory functions run (which are hoisted before module-level code).
// If we create a new object inside useWorkoutLogContext() on every call,
// workoutSnapshot changes on every render and creates an infinite re-render loop
// via useEffect([workoutSnapshot]) in WorkoutLogForm.
const { stableSnapshot } = vi.hoisted(() => {
  return {
    stableSnapshot: {
      name: 'Test Workout',
      blockSnapshot: [
        {
          type: 'SINGLE',
          order: 0,
          exerciseSnapshot: [
            {
              name: 'fly',
              order: 0,
              sets: 1,
              measurement: {
                measurementType: 'DISTANCE',
                measurementUnit: 'METER',
              },
              setData: [{ distance: 25, rest: 0 }],
            },
          ],
        },
      ],
      sectionSnapshot: [{ name: 'Main (400)', order: 0, blockOrders: [0] }],
    },
  };
});

// Mock the context — WorkoutLogForm reads workoutSnapshot from WorkoutLogContext
vi.mock('../../../contexts/WorkoutLogContext', () => ({
  useWorkoutLogContext: () => ({
    workoutSnapshot: stableSnapshot,
    versionId: 1,
  }),
}));

describe('WorkoutLogForm — section cards', () => {
  it('renders a section card with the section name', () => {
    render(
      <MemoryRouter>
        <WorkoutLogForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Main (400)')).toBeInTheDocument();
    expect(screen.getByText('Main (400)').closest('.wl-section-card')).toBeInTheDocument();
  });

  it('shows exercise count in section card header', () => {
    render(
      <MemoryRouter>
        <WorkoutLogForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    );
    // 0 of 1 exercises completed initially
    expect(screen.getAllByText(/0\s*\/\s*1/).length).toBeGreaterThan(0);
  });
});
