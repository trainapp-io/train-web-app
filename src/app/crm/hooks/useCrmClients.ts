import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '../../../services/queryService';
import { crmService } from '../services/crmService';
import type {
  Client,
  ClientListResponse,
  CreateClientRequest,
  UpdateClientRequest,
  CrmApiError,
  WorkoutHistoryEntry,
  ProgramSummary,
  AppointmentSummary,
} from '../types/crm.types';
import type { AxiosError } from 'axios';

export function useClientList() {
  return useQuery<ClientListResponse, AxiosError>({
    queryKey: ['crm', 'clients'],
    queryFn: () => crmService.listClients(),
  });
}

export function useClient(clientId: string) {
  return useApiQuery<Client>(['crm', 'client', clientId], `/crm/clients/${clientId}`);
}

export function useClientAppointments(clientId: string) {
  return useQuery<AppointmentSummary[], AxiosError>({
    queryKey: ['crm', 'appointments', clientId],
    queryFn: () => crmService.getClientAppointments(clientId),
  });
}

export function useClientWorkoutHistory(clientId: string) {
  return useQuery<WorkoutHistoryEntry[], AxiosError>({
    queryKey: ['crm', 'workout-history', clientId],
    queryFn: () => crmService.getClientWorkoutHistory(clientId),
  });
}

export function useClientPrograms(clientId: string) {
  return useQuery<ProgramSummary[], AxiosError>({
    queryKey: ['crm', 'programs', clientId],
    queryFn: () => crmService.getClientPrograms(clientId),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation<Client, AxiosError<CrmApiError>, CreateClientRequest>({
    mutationFn: (data) => crmService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation<Client, AxiosError<CrmApiError>, { clientId: string; data: UpdateClientRequest }>({
    mutationFn: ({ clientId, data }) => crmService.updateClient(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'client', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'profile', variables.clientId] });
    },
  });
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<CrmApiError>, string>({
    mutationFn: (clientId) => crmService.deactivateClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
    },
  });
}
