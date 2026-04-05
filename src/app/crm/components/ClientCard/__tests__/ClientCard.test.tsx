import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientCard from '../ClientCard';
import type { Client } from '../../../types/crm.types';

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: null,
  dateOfBirth: null,
  status: 'active',
  notes: null,
  platformUserId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ClientCard', () => {
  it('renders client full name', () => {
    render(<ClientCard client={makeClient()} onClick={vi.fn()} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders client email when present', () => {
    render(<ClientCard client={makeClient()} onClick={vi.fn()} />);
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('does not render email when absent', () => {
    render(<ClientCard client={makeClient({ email: null })} onClick={vi.fn()} />);
    expect(screen.queryByText('@')).not.toBeInTheDocument();
  });

  it('calls onClick with clientId when clicked', () => {
    const onClick = vi.fn();
    render(<ClientCard client={makeClient({ id: 'abc123' })} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('abc123');
  });

  it('renders status badge for active status', () => {
    render(<ClientCard client={makeClient({ status: 'active' })} onClick={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders status badge for pending status', () => {
    render(<ClientCard client={makeClient({ status: 'pending' })} onClick={vi.fn()} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders status badge for inactive status', () => {
    render(<ClientCard client={makeClient({ status: 'inactive' })} onClick={vi.fn()} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
