import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import type {
  Payment,
  PaymentsResponse,
  RecordPaymentRequest,
  UpdatePaymentRequest,
  RefundPaymentRequest,
  CrmApiError,
} from '../types/crm.types';
import type { AxiosError } from 'axios';

export function usePayments(clientId: string) {
  return useQuery<PaymentsResponse, AxiosError>({
    queryKey: ['crm', 'payments', clientId],
    queryFn: () => paymentService.listPayments(clientId),
  });
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
