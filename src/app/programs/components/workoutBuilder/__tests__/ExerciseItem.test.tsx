import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseItem from '../ExerciseItem';
import { MeasurementType } from '@trainapp-io/train-core';

// Mock @dnd-kit/sortable so useSortable returns stubs
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: 'lb' as any };

function makeExercise(overrides: Record<string, any> = {}) {
  return {
    name: 'Bench Press',
    order: 0,
    measurement: baseMeasurement,
    targetReps: 8,
    targetWeight: 135,
    rest: 60,
    sets: 3,
    hasSuperset: false,
    ...overrides,
  };
}

function makeProps(exerciseOverrides: Record<string, any> = {}, propOverrides: Record<string, any> = {}) {
  const updateFn = vi.fn();
  const removeFn = vi.fn();
  return {
    exercise: makeExercise(exerciseOverrides),
    editMode: true,
    logMode: false,
    blockIndex: 0,
    exerciseIndex: 0,
    updateExerciseInBlockPartial: updateFn,
    removeExerciseFromBlock: removeFn,
    ...propOverrides,
  };
}

describe('ExerciseItem create mode', () => {
  it('renders a set row for each set in setData', () => {
    const props = makeProps({
      setData: [
        { reps: 8, weight: 135, rest: 60 },
        { reps: 8, weight: 135, rest: 60 },
        { reps: 6, weight: 145, rest: 90 },
      ],
    });
    render(<ExerciseItem {...props} />);
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(4); // header + 3 data rows
  });

  it('falls back to sets count when setData is absent', () => {
    const props = makeProps({ sets: 2 });
    render(<ExerciseItem {...props} />);
    // 2 set rows + 1 header row
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('clicking Add Set calls updateExerciseInBlockPartial with one more set', () => {
    const props = makeProps({
      setData: [
        { reps: 8, weight: 135, rest: 60 },
        { reps: 8, weight: 135, rest: 60 },
      ],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/add set/i));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ setData: expect.arrayContaining([expect.any(Object)]) })
    );
    const call = props.updateExerciseInBlockPartial.mock.calls[0][2];
    expect(call.setData).toHaveLength(3);
  });

  it('clicking the rest unit chip calls update with toggled restUnit', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60 }],
      restUnit: 'seconds',
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/^s\s*⟳/i));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ restUnit: 'minutes' })
    );
  });

  it('clicking the measurement toggle cycles the measurement type', () => {
    const props = makeProps({ setData: [{ reps: 8 }] });
    render(<ExerciseItem {...props} />);
    // Text is split across elements ("reps " + <span>⟳</span>), so use a custom matcher
    const toggleButtons = screen.getAllByRole('button').filter(
      (btn) => btn.classList.contains('ex-toggle-chip') && btn.textContent?.includes('reps')
    );
    fireEvent.click(toggleButtons[0]);
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ measurement: expect.objectContaining({ measurementType: MeasurementType.TIME }) })
    );
  });

  it('note dialog opens when note icon is clicked', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60, note: '' }],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getAllByLabelText(/note for set/i)[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('saving a note calls update with the note in setData', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60 }],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getAllByLabelText(/note for set/i)[0]);
    fireEvent.change(screen.getByPlaceholderText(/coaching note/i), {
      target: { value: 'Go slow on the way down' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({
        setData: [expect.objectContaining({ note: 'Go slow on the way down' })],
      })
    );
  });
});
