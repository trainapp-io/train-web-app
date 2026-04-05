import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientForm from '../ClientForm';

const defaultProps = {
  open: true,
  isSaving: false,
  fieldErrors: {},
  onSubmit: vi.fn(),
  onClose: vi.fn(),
};

describe('ClientForm', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ClientForm {...defaultProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders first name and last name fields', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it('renders optional fields', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('displays field errors inline', () => {
    render(
      <ClientForm
        {...defaultProps}
        fieldErrors={{ firstName: 'First name is required', email: 'Invalid email' }}
      />
    );
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('submit button is disabled when required fields empty', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('submit button is disabled while isSaving', () => {
    render(
      <ClientForm
        {...defaultProps}
        isSaving
        initialValues={{ firstName: 'Jane', lastName: 'Doe' }}
      />
    );
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ClientForm {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('populates fields from initialValues', () => {
    render(
      <ClientForm
        {...defaultProps}
        initialValues={{ firstName: 'John', lastName: 'Smith', email: 'john@test.com' }}
      />
    );
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
  });
});
