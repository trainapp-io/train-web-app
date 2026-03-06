import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentConfirmDialog } from '../AppointmentConfirmDialog';
import { AvailabilityResponse } from '@trainapp-io/train-core';

const mockSlot: AvailabilityResponse = {
  id: 'slot-1',
  title: 'Training Session',
  description: 'One-on-one training',
  startDate: '2025-06-15',
  startTime: '2025-06-15T10:00:00.000Z',
  slotDuration: 60,
  location: 'Gym Floor A',
  tags: ['strength', 'cardio'],
} as unknown as AvailabilityResponse;

const defaultProps = {
  slot: mockSlot,
  trainerName: 'John Coach',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('AppointmentConfirmDialog', () => {
  it('renders trainer name', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByText('John Coach')).toBeInTheDocument();
  });

  it('renders slot duration', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
  });

  it('renders slot location', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Gym Floor A')).toBeInTheDocument();
  });

  it('renders slot description', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByText('One-on-one training')).toBeInTheDocument();
  });

  it('renders slot tags', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('cardio')).toBeInTheDocument();
  });

  it('renders Cancel and Confirm buttons', () => {
    render(<AppointmentConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Appointment' })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<AppointmentConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm Appointment is clicked', () => {
    const onConfirm = vi.fn();
    render(<AppointmentConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Appointment' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not render location section when location is absent', () => {
    const slotWithoutLocation = { ...mockSlot, location: undefined };
    render(<AppointmentConfirmDialog {...defaultProps} slot={slotWithoutLocation as unknown as AvailabilityResponse} />);
    expect(screen.queryByText('Gym Floor A')).not.toBeInTheDocument();
  });

  it('does not render tags section when tags are absent', () => {
    const slotWithoutTags = { ...mockSlot, tags: undefined };
    render(<AppointmentConfirmDialog {...defaultProps} slot={slotWithoutTags as unknown as AvailabilityResponse} />);
    expect(screen.queryByText('strength')).not.toBeInTheDocument();
  });
});
