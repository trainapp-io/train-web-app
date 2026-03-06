import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseWorkoutLogHistory = vi.fn();

vi.mock('../../../../services/apiHooks', () => ({
  useWorkoutLogHistory: () => mockUseWorkoutLogHistory(),
}));

import WorkoutLogHistory from '../WorkoutLogHistory';

const makeLog = (id: string, name: string, overrides = {}) => ({
  id,
  workoutSnapshot: { name, description: '' },
  isCompleted: false,
  actualStartDate: new Date('2025-01-15'),
  actualDuration: 3600,
  versionId: 1,
  blockLogs: [],
  ...overrides,
});

describe('WorkoutLogHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseWorkoutLogHistory.mockReturnValue({ isLoading: true, error: null, data: undefined });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText(/loading workout history/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseWorkoutLogHistory.mockReturnValue({ isLoading: false, error: new Error('fail'), data: undefined });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText(/failed to load workout history/i)).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    mockUseWorkoutLogHistory.mockReturnValue({ isLoading: false, error: null, data: [] });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText(/no workouts logged yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log your first workout/i })).toBeInTheDocument();
  });

  it('renders a list of workout logs', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [
        makeLog('1', 'Push Day'),
        makeLog('2', 'Pull Day'),
      ],
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
  });

  it('shows "Log Another Workout" button when logs exist', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('1', 'Push Day')],
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByRole('button', { name: /log another workout/i })).toBeInTheDocument();
  });

  it('navigates to log detail when a log card is clicked', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('log-42', 'Leg Day')],
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    fireEvent.click(screen.getByText('Leg Day'));
    expect(mockNavigate).toHaveBeenCalledWith('/workout-logs/log-42');
  });

  it('navigates to /dashboard when "Log Another Workout" is clicked', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('1', 'Push Day')],
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: /log another workout/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows Completed badge for completed logs', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('1', 'Full Body', { isCompleted: true })],
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('formats duration in hours and minutes', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('1', 'Push Day', { actualDuration: 5400 })], // 1h 30m
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('formats duration in minutes only when under an hour', () => {
    mockUseWorkoutLogHistory.mockReturnValue({
      isLoading: false,
      error: null,
      data: [makeLog('1', 'Push Day', { actualDuration: 2700 })], // 45m
    });
    render(<BrowserRouter><WorkoutLogHistory /></BrowserRouter>);
    expect(screen.getByText('45m')).toBeInTheDocument();
  });
});
