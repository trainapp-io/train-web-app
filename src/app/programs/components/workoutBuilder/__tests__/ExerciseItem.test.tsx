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

function makeLogProps(exerciseOverrides: Record<string, any> = {}, propOverrides: Record<string, any> = {}) {
  const updateFn = vi.fn();
  return {
    exercise: makeExercise({
      setLogs: [
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: false },
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: false },
      ],
      ...exerciseOverrides,
    }),
    editMode: true,
    logMode: true,
    blockIndex: 0,
    exerciseIndex: 0,
    updateExerciseInBlockPartial: updateFn,
    removeExerciseFromBlock: vi.fn(),
    ...propOverrides,
  };
}

describe('ExerciseItem log mode', () => {
  it('renders one row per setLog entry when active', () => {
    render(<ExerciseItem {...makeLogProps()} isActive={true} />);
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3); // header + 2 data rows
  });

  it('checking a set calls updateExerciseInBlockPartial with isCompleted: true for that set', () => {
    const props = makeLogProps({}, { isActive: true });
    render(<ExerciseItem {...props} />);
    const checkBtns = screen.getAllByRole('button', { name: /mark complete/i });
    fireEvent.click(checkBtns[0]);
    const call = props.updateExerciseInBlockPartial.mock.calls[0][2];
    expect(call.setLogs[0].isCompleted).toBe(true);
    expect(call.setLogs[1].isCompleted).toBe(false);
  });

  it('calls onSetCompleted with the rest seconds when a set is checked', () => {
    const onSetCompleted = vi.fn();
    const props = makeLogProps({}, { onSetCompleted, isActive: true });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getAllByRole('button', { name: /mark complete/i })[0]);
    expect(onSetCompleted).toHaveBeenCalledWith(60);
  });

  it('"Add Set" adds a set when active', () => {
    const props = makeLogProps({}, { isActive: true });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/\+ add set/i));
    const call = props.updateExerciseInBlockPartial.mock.calls[0][2];
    expect(call.setLogs).toHaveLength(3);
  });

  it('renders upcoming state when not active and no sets completed', () => {
    const props = makeLogProps();
    render(<ExerciseItem {...props} />);
    expect(screen.getByText(/jump to →/i)).toBeInTheDocument();
  });

  it('renders done state when all sets are completed', () => {
    const props = makeLogProps({
      setLogs: [
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: true },
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: true },
      ],
    });
    render(<ExerciseItem {...props} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders in-progress state when some sets are completed', () => {
    const props = makeLogProps({
      setLogs: [
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: true },
        { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: false },
      ],
    });
    render(<ExerciseItem {...props} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });
});

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
