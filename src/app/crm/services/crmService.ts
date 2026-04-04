import api from '../../../services/apiClient';
import type {
  Client,
  ClientListResponse,
  CreateClientRequest,
  UpdateClientRequest,
  WorkoutHistoryEntry,
  ProgramSummary,
  AppointmentSummary,
} from '../types/crm.types';

export const crmService = {
  async listClients(): Promise<ClientListResponse> {
    const response = await api.get<ClientListResponse>('/crm/clients');
    return response.data;
  },

  async getClient(clientId: string): Promise<Client> {
    const response = await api.get<Client>(`/crm/clients/${clientId}`);
    return response.data;
  },

  async getClientAppointments(clientId: string): Promise<AppointmentSummary[]> {
    const response = await api.get<AppointmentSummary[]>(`/crm/clients/${clientId}/appointments`);
    return response.data;
  },

  async getClientWorkoutHistory(clientId: string): Promise<WorkoutHistoryEntry[]> {
    const response = await api.get<WorkoutHistoryEntry[]>(`/crm/clients/${clientId}/workout-history`);
    return response.data;
  },

  async getClientPrograms(clientId: string): Promise<ProgramSummary[]> {
    const response = await api.get<ProgramSummary[]>(`/crm/clients/${clientId}/programs`);
    return response.data;
  },

  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await api.post<Client>('/crm/clients', data);
    return response.data;
  },

  async updateClient(clientId: string, data: UpdateClientRequest): Promise<Client> {
    const response = await api.patch<Client>(`/crm/clients/${clientId}`, data);
    return response.data;
  },

  async deactivateClient(clientId: string): Promise<void> {
    await api.delete(`/crm/clients/${clientId}`);
  },
};

export default crmService;
