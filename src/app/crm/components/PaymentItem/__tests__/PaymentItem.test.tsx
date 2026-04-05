import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentItem from '../PaymentItem';
import type { Payment } from '../../../types/crm.types';

const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'p1',
  clientId: 'c1',
  amount: 99.99,
  currency: 'USD',
  paymentMethod: 'card',
  paymentStatus: 'succeeded',
  paymentDate: '2024-06-15T10:00:00Z',
  externalPaymentId: 'pi_123',
  createdAt: '2024-06-15T10:00:00Z',
  isOverdue: false,
  ...overrides,
});

describe('PaymentItem', () => {
  it('renders formatted amount and currency', () => {
    render(<PaymentItem payment={makePayment()} isStripeOnboarded={false} onRefund={vi.fn()} />);
    expect(screen.getByText(/USD 99.99/)).toBeInTheDocument();
  });

  it('renders payment status', () => {
    render(<PaymentItem payment={makePayment()} isStripeOnboarded={false} onRefund={vi.fn()} />);
    expect(screen.getByText('succeeded')).toBeInTheDocument();
  });

  it('renders payment method', () => {
    render(<PaymentItem payment={makePayment()} isStripeOnboarded={false} onRefund={vi.fn()} />);
    expect(screen.getByText('card')).toBeInTheDocument();
  });

  it('shows Overdue badge when isOverdue is true', () => {
    render(
      <PaymentItem payment={makePayment({ isOverdue: true })} isStripeOnboarded={false} onRefund={vi.fn()} />
    );
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not show Overdue badge when isOverdue is false', () => {
    render(
      <PaymentItem payment={makePayment({ isOverdue: false })} isStripeOnboarded={false} onRefund={vi.fn()} />
    );
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('hides Refund button when Stripe not onboarded', () => {
    render(
      <PaymentItem payment={makePayment()} isStripeOnboarded={false} onRefund={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
  });

  it('hides Refund button when no externalPaymentId', () => {
    render(
      <PaymentItem
        payment={makePayment({ externalPaymentId: null })}
        isStripeOnboarded
        onRefund={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
  });

  it('hides Refund button when status is not succeeded', () => {
    render(
      <PaymentItem
        payment={makePayment({ paymentStatus: 'refunded' })}
        isStripeOnboarded
        onRefund={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
  });

  it('shows Refund button when Stripe onboarded and eligible payment', () => {
    render(
      <PaymentItem payment={makePayment()} isStripeOnboarded onRefund={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /refund/i })).toBeInTheDocument();
  });

  it('calls onRefund with paymentId when Refund clicked', () => {
    const onRefund = vi.fn();
    render(
      <PaymentItem payment={makePayment({ id: 'p99' })} isStripeOnboarded onRefund={onRefund} />
    );
    fireEvent.click(screen.getByRole('button', { name: /refund/i }));
    expect(onRefund).toHaveBeenCalledWith('p99');
  });
});
