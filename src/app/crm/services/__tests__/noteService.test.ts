import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../../services/apiClient';
import { noteService } from '../noteService';
import type { Note } from '../../types/crm.types';

vi.mock('../../../../services/apiClient');

const mockNote: Note = {
  id: 'n1',
  clientId: 'c1',
  noteText: 'Test note',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: null,
};

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('noteService.listNotes', () => {
  it('calls GET /crm/clients/:id/notes and returns array', async () => {
    apiMock.get = vi.fn().mockResolvedValue({ data: [mockNote] });

    const result = await noteService.listNotes('c1');

    expect(apiMock.get).toHaveBeenCalledWith('/crm/clients/c1/notes');
    expect(result).toEqual([mockNote]);
  });
});

describe('noteService.createNote', () => {
  it('calls POST /crm/clients/:id/notes and returns note', async () => {
    apiMock.post = vi.fn().mockResolvedValue({ data: mockNote });

    const result = await noteService.createNote('c1', { noteText: 'Test note' });

    expect(apiMock.post).toHaveBeenCalledWith('/crm/clients/c1/notes', { noteText: 'Test note' });
    expect(result).toEqual(mockNote);
  });
});

describe('noteService.updateNote', () => {
  it('calls PATCH /crm/clients/:id/notes/:noteId and returns updated note', async () => {
    const updated = { ...mockNote, noteText: 'Updated' };
    apiMock.patch = vi.fn().mockResolvedValue({ data: updated });

    const result = await noteService.updateNote('c1', 'n1', { noteText: 'Updated' });

    expect(apiMock.patch).toHaveBeenCalledWith('/crm/clients/c1/notes/n1', { noteText: 'Updated' });
    expect(result).toEqual(updated);
  });
});

describe('noteService.deleteNote', () => {
  it('calls DELETE /crm/clients/:id/notes/:noteId', async () => {
    apiMock.delete = vi.fn().mockResolvedValue({});

    await noteService.deleteNote('c1', 'n1');

    expect(apiMock.delete).toHaveBeenCalledWith('/crm/clients/c1/notes/n1');
  });
});
