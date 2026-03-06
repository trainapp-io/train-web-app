import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const makeDate = (year: number, month: number, day: number) =>
  new Date(year, month, day);

const defaultProps = {
  currentMonth: makeDate(2025, 0, 1), // January 2025
  selectedDate: makeDate(2025, 0, 15),
  availabilityDates: new Set<string>(['2025-01-10', '2025-01-20']),
  onDateSelect: vi.fn(),
  onMonthChange: vi.fn(),
};

describe('Calendar', () => {
  it('renders the current month name and year', () => {
    render(<Calendar {...defaultProps} />);
    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });

  it('renders all day-of-week headers', () => {
    render(<Calendar {...defaultProps} />);
    DAY_NAMES.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('renders all days in January (1–31)', () => {
    render(<Calendar {...defaultProps} />);
    for (let d = 1; d <= 31; d++) {
      expect(screen.getByText(String(d))).toBeInTheDocument();
    }
  });

  it('calls onDateSelect with the correct date when a day is clicked', () => {
    const onDateSelect = vi.fn();
    render(<Calendar {...defaultProps} onDateSelect={onDateSelect} />);
    fireEvent.click(screen.getByText('10'));
    expect(onDateSelect).toHaveBeenCalledTimes(1);
    const called = onDateSelect.mock.calls[0][0] as Date;
    expect(called.getDate()).toBe(10);
    expect(called.getMonth()).toBe(0);
    expect(called.getFullYear()).toBe(2025);
  });

  it('calls onMonthChange("prev") when prev button is clicked', () => {
    const onMonthChange = vi.fn();
    render(<Calendar {...defaultProps} onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByText('‹'));
    expect(onMonthChange).toHaveBeenCalledWith('prev');
  });

  it('calls onMonthChange("next") when next button is clicked', () => {
    const onMonthChange = vi.fn();
    render(<Calendar {...defaultProps} onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByText('›'));
    expect(onMonthChange).toHaveBeenCalledWith('next');
  });

  it('marks the selected date with "selected" class', () => {
    render(<Calendar {...defaultProps} />);
    // Jan 15 is selected
    const day15 = screen.getByText('15');
    expect(day15).toHaveClass('selected');
  });

  it('marks days with availability with "has-availability" class', () => {
    render(<Calendar {...defaultProps} />);
    expect(screen.getByText('10')).toHaveClass('has-availability');
    expect(screen.getByText('20')).toHaveClass('has-availability');
  });

  it('marks days without availability with "no-availability" class', () => {
    render(<Calendar {...defaultProps} />);
    expect(screen.getByText('5')).toHaveClass('no-availability');
  });

  it('renders a different month correctly', () => {
    render(
      <Calendar
        {...defaultProps}
        currentMonth={makeDate(2025, 5, 1)} // June 2025
      />
    );
    expect(screen.getByText('June 2025')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // June has 30 days
    expect(screen.queryByText('31')).not.toBeInTheDocument();
  });

  it('renders all 12 months correctly by name', () => {
    MONTH_NAMES.forEach((name, i) => {
      const { unmount } = render(
        <Calendar
          {...defaultProps}
          currentMonth={makeDate(2025, i, 1)}
        />
      );
      expect(screen.getByText(`${name} 2025`)).toBeInTheDocument();
      unmount();
    });
  });
});
