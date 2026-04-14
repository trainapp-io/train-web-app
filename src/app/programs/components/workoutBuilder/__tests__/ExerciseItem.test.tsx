import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseItem from '../ExerciseItem';
import { MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

function makeExercise(overrides = {}) {
  return {
    name: 'Squat',
    order: 0,
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    notes: '',
    sets: 3,
    hasSuperset: false,
    measurement: {
      measurementType: MeasurementType.REPS,
      measurementUnit: MeasurementUnit.POUND,
    },
    setData: [{ reps: 10, weight: 100, rest: 60 }],
    ...overrides,
  };
}

describe('ExerciseItem — measurement dropdown', () => {
  it('shows the current measurement type as a chip label', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /reps/i })).toBeInTheDocument();
  });

  it('opens a dropdown listing all 6 measurement types when chip is clicked', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /reps/i }));
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight')).toBeInTheDocument();
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('% Effort')).toBeInTheDocument();
  });

  it('calls update with new measurement type when a dropdown option is selected', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /reps/i }));
    fireEvent.click(screen.getByText('Calories'));
    expect(update).toHaveBeenCalledWith(0, 0, expect.objectContaining({
      measurement: expect.objectContaining({ measurementType: MeasurementType.CALORIES }),
    }));
  });
});

describe('ExerciseItem — column visibility', () => {
  it('shows weight column for REPS', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('columnheader', { name: /lbs/i })).toBeInTheDocument();
  });

  it('hides weight column for BODYWEIGHT', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.BODYWEIGHT, measurementUnit: MeasurementUnit.POUND },
          setData: [{ reps: 10, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
  });

  it('shows CAL column header for CALORIES', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.CALORIES, measurementUnit: MeasurementUnit.CALORIE },
          setData: [{ reps: 50, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /cal/i })).toBeInTheDocument();
  });

  it('shows % column header for PERCENTAGE', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.PERCENTAGE, measurementUnit: MeasurementUnit.PERCENT },
          setData: [{ reps: 70, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /%/i })).toBeInTheDocument();
  });
});

describe('ExerciseItem — Group Exercise button', () => {
  it('renders + Group Exercise button when onGroupExercise prop is provided', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
        onGroupExercise={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /group exercise/i })).toBeInTheDocument();
  });

  it('does not render + Group Exercise button when onGroupExercise is not provided', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /group exercise/i })).not.toBeInTheDocument();
  });

  it('calls onGroupExercise when the button is clicked', () => {
    const update = vi.fn();
    const onGroup = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
        onGroupExercise={onGroup}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /group exercise/i }));
    expect(onGroup).toHaveBeenCalledTimes(1);
  });
});
