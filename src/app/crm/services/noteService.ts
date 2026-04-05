import api from '../../../services/apiClient';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/crm.types';

export const noteService = {
  async listNotes(clientId: string): Promise<Note[]> {
    const response = await api.get<Note[]>(`/crm/clients/${clientId}/notes`);
    return response.data;
  },

  async createNote(clientId: string, data: CreateNoteRequest): Promise<Note> {
    const response = await api.post<Note>(`/crm/clients/${clientId}/notes`, data);
    return response.data;
  },

  async updateNote(clientId: string, noteId: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await api.patch<Note>(`/crm/clients/${clientId}/notes/${noteId}`, data);
    return response.data;
  },

  async deleteNote(clientId: string, noteId: string): Promise<void> {
    await api.delete(`/crm/clients/${clientId}/notes/${noteId}`);
  },
};

export default noteService;
