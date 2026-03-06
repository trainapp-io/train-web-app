import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  const defaultProps = {
    children: 'Click Me'
  };

  it('renders correctly with default props', () => {
    render(<Button {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('button-primary');
    expect(button).not.toBeDisabled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button {...defaultProps} variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('button-secondary');
    
    rerender(<Button {...defaultProps} variant="outline" />);
    expect(screen.getByRole('button')).toHaveClass('button-outline');
    
    rerender(<Button {...defaultProps} variant="link" />);
    expect(screen.getByRole('button')).toHaveClass('button-link');
  });

  it('renders with custom className', () => {
    render(<Button {...defaultProps} className="custom-class" />);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('calls onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(<Button {...defaultProps} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled button correctly', () => {
    render(<Button {...defaultProps} disabled />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders loading state correctly', () => {
    render(<Button {...defaultProps} isLoading />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button-loading');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
    expect(button).not.toHaveTextContent('Click Me');
  });

  it('renders with correct button type', () => {
    const { rerender } = render(<Button {...defaultProps} type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    
    rerender(<Button {...defaultProps} type="reset" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
  });

  it('applies testId correctly', () => {
    const testId = 'submit-button';
    render(<Button {...defaultProps} testId={testId} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getByTestId(testId)).toBe(screen.getByRole('button'));
  });

  it('renders danger variant', () => {
    render(<Button {...defaultProps} variant="danger" />);
    expect(screen.getByRole('button')).toHaveClass('button-danger');
  });

  it('renders block variant with full-width class', () => {
    render(<Button {...defaultProps} block />);
    expect(screen.getByRole('button')).toHaveClass('button-block');
  });

  it('does not apply block class by default', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByRole('button')).not.toHaveClass('button-block');
  });

  it('renders small size', () => {
    render(<Button {...defaultProps} size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('button-sm');
  });

  it('renders large size', () => {
    render(<Button {...defaultProps} size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('button-lg');
  });

  it('does not add size class for default md size', () => {
    render(<Button {...defaultProps} size="md" />);
    expect(screen.getByRole('button')).not.toHaveClass('button-md');
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button {...defaultProps} onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});