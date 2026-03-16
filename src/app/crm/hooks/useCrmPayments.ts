import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '../../../services/queryService';
import { paymentService } from '../services/paymentService';
import type {
  Payment,
  RecordPaymentRequest,
  UpdatePaymentRequest,
  RefundPaymentRequest,
  CrmApiError,
} from '../types/crm.types';
import type { AxiosError } from 'axios';

export function usePayments(clientId: string) {
  return useApiQuery<Payment[]>(['crm', 'payments', clientId], `/crm/clients/${clientId}/payments`);
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation<
    Payment,
    AxiosError<CrmApiError>,
    { clientId: string; data: RecordPaymentRequest }
  >({
    mutationFn: ({ clientId, data }) => paymentService.recordPayment(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'payments', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'profile', variables.clientId] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation<
    Payment,
    AxiosError<CrmApiError>,
    { clientId: string; paymentId: string; data: UpdatePaymentRequest }
  >({
    mutationFn: ({ clientId, paymentId, data }) =>
      paymentService.updatePayment(clientId, paymentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'payments', variables.clientId] });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AxiosError<CrmApiError>,
    { clientId: string; paymentId: string; data?: RefundPaymentRequest }
  >({
    mutationFn: ({ clientId, paymentId, data }) =>
      paymentService.refundPayment(clientId, paymentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'payments', variables.clientId] });
    },
  });
}
