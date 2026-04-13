import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value="42" label="Workouts" />);
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Workouts')).toBeDefined();
  });

  it('applies default class when no variant given', () => {
    const { container } = render(<StatCard value="5d" label="Streak" />);
    const card = container.querySelector('.wla-stat-card');
    expect(card).not.toBeNull();
    expect(card!.classList.contains('wla-stat-card--primary')).toBe(false);
  });

  it('applies primary variant class', () => {
    const { container } = render(<StatCard value="5d" label="Streak" variant="primary" />);
    expect(container.querySelector('.wla-stat-card--primary')).not.toBeNull();
  });

  it('applies pr variant class', () => {
    const { container } = render(<StatCard value="225 lbs" label="Bench Press" variant="pr" />);
    expect(container.querySelector('.wla-stat-card--pr')).not.toBeNull();
  });
});
