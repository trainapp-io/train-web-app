import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '../../../services/queryService';
import { noteService } from '../services/noteService';
import type { Note, CreateNoteRequest, UpdateNoteRequest, CrmApiError } from '../types/crm.types';
import type { AxiosError } from 'axios';

export function useNotes(clientId: string) {
  return useApiQuery<Note[]>(['crm', 'notes', clientId], `/crm/clients/${clientId}/notes`);
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation<Note, AxiosError<CrmApiError>, { clientId: string; data: CreateNoteRequest }>({
    mutationFn: ({ clientId, data }) => noteService.createNote(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'notes', variables.clientId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation<
    Note,
    AxiosError<CrmApiError>,
    { clientId: string; noteId: string; data: UpdateNoteRequest }
  >({
    mutationFn: ({ clientId, noteId, data }) => noteService.updateNote(clientId, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'notes', variables.clientId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<CrmApiError>, { clientId: string; noteId: string }>({
    mutationFn: ({ clientId, noteId }) => noteService.deleteNote(clientId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'notes', variables.clientId] });
    },
  });
}
