import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkoutAnalytics from '../../pages/WorkoutAnalytics';

const mockUseWorkoutAnalytics = vi.fn();
const mockUseWorkoutLogHistory = vi.fn();
const mockUseExerciseProgress = vi.fn();

vi.mock('../../../../services/apiHooks', () => ({
  useWorkoutAnalytics: (...args: any[]) => mockUseWorkoutAnalytics(...args),
  useWorkoutLogHistory: (...args: any[]) => mockUseWorkoutLogHistory(...args),
  useExerciseProgress: (...args: any[]) => mockUseExerciseProgress(...args),
}));

const mockAnalytics = {
  range: 'week' as const,
  totalWorkouts: 0,
  totalDurationSec: 0,
  totalVolumeLbs: 0,
  currentStreak: 0,
  longestStreak: 0,
  activityByDay: [],
  volumeTrend: [],
  personalRecords: [],
  muscleGroups: [],
  exerciseStats: [],
};

beforeEach(() => {
  mockUseWorkoutLogHistory.mockReturnValue({ data: [] });
  mockUseExerciseProgress.mockReturnValue({ data: undefined, isLoading: false });
});

describe('WorkoutAnalytics (loading state)', () => {
  it('shows loading skeleton when analytics is loading', () => {
    mockUseWorkoutAnalytics.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <MemoryRouter>
        <WorkoutAnalytics />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Loading analytics')).toBeDefined();
  });
});

describe('WorkoutAnalytics (empty state)', () => {
  it('shows empty state when totalWorkouts is 0', () => {
    mockUseWorkoutAnalytics.mockReturnValue({ data: mockAnalytics, isLoading: false });
    render(
      <MemoryRouter>
        <WorkoutAnalytics />
      </MemoryRouter>
    );
    expect(screen.getByText('No workouts yet')).toBeDefined();
  });
});
