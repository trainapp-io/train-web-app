import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../../services/apiClient';
import { paymentService } from '../paymentService';
import type { Payment } from '../../types/crm.types';

vi.mock('../../../../services/apiClient');

const mockPayment: Payment = {
  id: 'p1',
  clientId: 'c1',
  amount: 50,
  currency: 'USD',
  paymentMethod: 'card',
  paymentStatus: 'succeeded',
  paymentDate: '2024-01-01T00:00:00Z',
  externalPaymentId: 'pi_abc',
  createdAt: '2024-01-01T00:00:00Z',
  isOverdue: false,
};

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('paymentService.listPayments', () => {
  it('calls GET /crm/clients/:id/payments and returns array', async () => {
    apiMock.get = vi.fn().mockResolvedValue({ data: [mockPayment] });

    const result = await paymentService.listPayments('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/payments');
    expect(result).toEqual([mockPayment]);
  });
});

describe('paymentService.recordPayment', () => {
  it('calls POST /crm/clients/:id/payments and returns payment', async () => {
    apiMock.post = vi.fn().mockResolvedValue({ data: mockPayment });

    const payload = { amount: 50, currency: 'USD', paymentMethod: 'card' };
    const result = await paymentService.recordPayment('c1', payload);

    expect(apiMock.post).toHaveBeenCalledWith('/crm/clients/c1/payments', payload);
    expect(result).toEqual(mockPayment);
  });
});

describe('paymentService.updatePayment', () => {
  it('calls PATCH /crm/clients/:id/payments/:paymentId and returns updated payment', async () => {
    const updated = { ...mockPayment, amount: 75 };
    apiMock.patch = vi.fn().mockResolvedValue({ data: updated });

    const result = await paymentService.updatePayment('c1', 'p1', { amount: 75 });

    expect(apiMock.patch).toHaveBeenCalledWith('/crm/clients/c1/payments/p1', { amount: 75 });
    expect(result).toEqual(updated);
  });
});

describe('paymentService.refundPayment', () => {
  it('calls POST /crm/clients/:id/payments/:paymentId/refund', async () => {
    apiMock.post = vi.fn().mockResolvedValue({});

    await paymentService.refundPayment('c1', 'p1');

    expect(apiMock.post).toHaveBeenCalledWith('/crm/clients/c1/payments/p1/refund', {});
  });
});
