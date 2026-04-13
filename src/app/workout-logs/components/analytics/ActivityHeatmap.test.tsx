import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityHeatmap from './ActivityHeatmap';
import type { ActivityDay } from '@trainapp-io/train-core';

// April 2026: starts on Wednesday (day 2), 30 days
const april2026 = new Date(2026, 3, 1); // month is 0-indexed

describe('ActivityHeatmap', () => {
  it('renders 7 day-of-week labels', () => {
    const { container } = render(
      <ActivityHeatmap activityByDay={[]} month={april2026} />
    );
    const labels = container.querySelectorAll('.wla-heatmap-day-label');
    expect(labels.length).toBe(7);
  });

  it('renders padding cells + 30 day cells for April 2026', () => {
    // April 1 is Wednesday (0=Sun,1=Mon,2=Tue,3=Wed) → 3 padding cells
    const { container } = render(
      <ActivityHeatmap activityByDay={[]} month={april2026} />
    );
    const dayCells = container.querySelectorAll('.wla-heatmap-day:not(.wla-heatmap-day-label)');
    // 3 padding + 30 days = 33 cells
    expect(dayCells.length).toBe(33);
  });

  it('applies intensity-1 to a day with 1 workout', () => {
    const activity: ActivityDay[] = [{ date: '2026-04-05', count: 1 }];
    const { container } = render(
      <ActivityHeatmap activityByDay={activity} month={april2026} />
    );
    expect(container.querySelector('[data-intensity="1"]')).not.toBeNull();
  });

  it('applies intensity-2 to a day with 3 workouts', () => {
    const activity: ActivityDay[] = [{ date: '2026-04-10', count: 3 }];
    const { container } = render(
      <ActivityHeatmap activityByDay={activity} month={april2026} />
    );
    expect(container.querySelector('[data-intensity="2"]')).not.toBeNull();
  });
});
