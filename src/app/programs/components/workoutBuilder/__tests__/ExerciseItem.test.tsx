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

describe('ExerciseItem — hybrid toggle placement', () => {
  it('does NOT render a lbs/kg chip in the card header', () => {
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
    // The header should not contain a lbs toggle chip (it moves to column header)
    expect(screen.queryByRole('button', { name: /toggle weight unit/i })).not.toBeInTheDocument();
  });

  it('renders a clickable LBS column header that cycles weight unit', () => {
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
    const lbsHeader = screen.getByRole('button', { name: /toggle lbs\/kg/i });
    expect(lbsHeader).toBeInTheDocument();
    fireEvent.click(lbsHeader);
    expect(update).toHaveBeenCalledWith(0, 0, expect.objectContaining({ weightUnit: expect.any(String) }));
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

describe('ExerciseItem — REST column default + row override', () => {
  it('renders a clickable REST column header that shows the current unit', () => {
    render(
      <ExerciseItem
        exercise={makeExercise({ restUnit: 'seconds' })}
        editMode={true}
        blockIndex={0} exerciseIndex={0}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /^toggle rest unit$/i })).toHaveTextContent(/REST \(s\)/i);
  });

  it('clicking REST header calls update with toggled restUnit', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({ restUnit: 'seconds' })}
        editMode={true}
        blockIndex={0} exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^toggle rest unit$/i }));
    expect(update).toHaveBeenCalledWith(0, 0, expect.objectContaining({ restUnit: 'minutes' }));
  });

  it('shows an amber override badge when a row has its own restUnit', () => {
    render(
      <ExerciseItem
        exercise={makeExercise({
          restUnit: 'minutes',
          setData: [{ reps: 8, weight: 100, rest: 90, restUnit: 'seconds' }],
        })}
        editMode={true}
        blockIndex={0} exerciseIndex={0}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /toggle rest unit for this set/i })).toHaveClass('ex-rest-unit-btn--override');
  });

  it('shows no amber badge when a row has no restUnit override', () => {
    render(
      <ExerciseItem
        exercise={makeExercise({ restUnit: 'seconds', setData: [{ reps: 8, weight: 100, rest: 90 }] })}
        editMode={true}
        blockIndex={0} exerciseIndex={0}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /toggle rest unit for this set/i }))
      .not.toHaveClass('ex-rest-unit-btn--override');
  });
});
