import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../../services/apiClient';
import { crmService } from '../crmService';
import type { Client, ClientListResponse, AppointmentSummary, WorkoutHistoryEntry, ProgramSummary } from '../../types/crm.types';

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

describe('crmService.getClientAppointments', () => {
  it('calls GET /crm/clients/:id/appointments and returns data', async () => {
    const appointments: AppointmentSummary[] = [{ event: { id: 'e1' }, status: 'confirmed' }];
    apiMock.get = vi.fn().mockResolvedValue({ data: appointments });

    const result = await crmService.getClientAppointments('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/appointments');
    expect(result).toEqual(appointments);
  });
});

describe('crmService.getClientWorkoutHistory', () => {
  it('calls GET /crm/clients/:id/workout-history and returns data', async () => {
    const history: WorkoutHistoryEntry[] = [{
      id: 'w1', userId: 'u1', workoutId: 'wk1', versionId: 1,
      workoutSnapshot: { name: 'Leg Day' }, isCompleted: true, actualStartDate: '2024-01-01',
    } as unknown as WorkoutHistoryEntry];
    apiMock.get = vi.fn().mockResolvedValue({ data: history });

    const result = await crmService.getClientWorkoutHistory('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/workout-history');
    expect(result).toEqual(history);
  });
});

describe('crmService.getClientPrograms', () => {
  it('calls GET /crm/clients/:id/programs and returns data', async () => {
    const programs: ProgramSummary[] = [{ id: 'p1', name: 'Strength', status: 'active' }];
    apiMock.get = vi.fn().mockResolvedValue({ data: programs });

    const result = await crmService.getClientPrograms('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/programs');
    expect(result).toEqual(programs);
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
