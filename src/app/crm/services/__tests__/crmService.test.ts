import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../../services/apiClient';
import { crmService } from '../crmService';
import type { Client, ClientListResponse, ClientProfile } from '../../types/crm.types';

vi.mock('../../../../services/apiClient');

const mockClient: Client = {
  id: 'c1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: null,
  dateOfBirth: null,
  status: 'active',
  notes: null,
  platformUserId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('crmService.listClients', () => {
  it('calls GET /crm/clients and returns data', async () => {
    const listResponse: ClientListResponse = { active: [mockClient], pending: [] };
    apiMock.get = vi.fn().mockResolvedValue({ data: listResponse });

    const result = await crmService.listClients();

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients');
    expect(result).toEqual(listResponse);
  });
});

describe('crmService.getClient', () => {
  it('calls GET /crm/clients/:id and returns data', async () => {
    apiMock.get = vi.fn().mockResolvedValue({ data: mockClient });

    const result = await crmService.getClient('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1');
    expect(result).toEqual(mockClient);
  });
});

describe('crmService.getClientProfile', () => {
  it('calls GET /crm/clients/:id/profile and returns data', async () => {
    const profile = { client: mockClient } as unknown as ClientProfile;
    apiMock.get = vi.fn().mockResolvedValue({ data: profile });

    const result = await crmService.getClientProfile('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/profile');
    expect(result).toEqual(profile);
  });
});

describe('crmService.createClient', () => {
  it('calls POST /crm/clients with data and returns new client', async () => {
    apiMock.post = vi.fn().mockResolvedValue({ data: mockClient });

    const payload = { firstName: 'Jane', lastName: 'Doe' };
    const result = await crmService.createClient(payload);

    expect(apiMock.post).toHaveBeenCalledWith('/crm/clients', payload);
    expect(result).toEqual(mockClient);
  });
});

describe('crmService.updateClient', () => {
  it('calls PATCH /crm/clients/:id with data and returns updated client', async () => {
    const updated = { ...mockClient, firstName: 'Janet' };
    apiMock.patch = vi.fn().mockResolvedValue({ data: updated });

    const result = await crmService.updateClient('c1', { firstName: 'Janet' });

    expect(apiMock.patch).toHaveBeenCalledWith('/crm/clients/c1', { firstName: 'Janet' });
    expect(result).toEqual(updated);
  });
});

describe('crmService.deactivateClient', () => {
  it('calls DELETE /crm/clients/:id', async () => {
    apiMock.delete = vi.fn().mockResolvedValue({});

    await crmService.deactivateClient('c1');

    expect(apiMock.delete).toHaveBeenCalledWith('/crm/clients/c1');
  });
});
