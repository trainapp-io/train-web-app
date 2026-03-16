import api from '../../../services/apiClient';
import type {
  Client,
  ClientListResponse,
  ClientProfile,
  CreateClientRequest,
  UpdateClientRequest,
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

  async getClientProfile(clientId: string): Promise<ClientProfile> {
    const response = await api.get<ClientProfile>(`/crm/clients/${clientId}/profile`);
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
