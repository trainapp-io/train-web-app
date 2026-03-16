import api from '../../../services/apiClient';
import type {
  Payment,
  RecordPaymentRequest,
  UpdatePaymentRequest,
  RefundPaymentRequest,
} from '../types/crm.types';

export const paymentService = {
  async listPayments(clientId: string): Promise<Payment[]> {
    const response = await api.get<Payment[]>(`/crm/clients/${clientId}/payments`);
    return response.data;
  },

  async recordPayment(clientId: string, data: RecordPaymentRequest): Promise<Payment> {
    const response = await api.post<Payment>(`/crm/clients/${clientId}/payments`, data);
    return response.data;
  },

  async updatePayment(
    clientId: string,
    paymentId: string,
    data: UpdatePaymentRequest
  ): Promise<Payment> {
    const response = await api.patch<Payment>(
      `/crm/clients/${clientId}/payments/${paymentId}`,
      data
    );
    return response.data;
  },

  async refundPayment(
    clientId: string,
    paymentId: string,
    data?: RefundPaymentRequest
  ): Promise<void> {
    await api.post(`/crm/clients/${clientId}/payments/${paymentId}/refund`, data ?? {});
  },
};

export default paymentService;
