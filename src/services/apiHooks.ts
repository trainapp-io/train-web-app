import {
  useApiQuery,
  useApiMutation,
  useDynamicApiQuery,
  useDynamicApiMutation
} from './queryService';
import {
  UserProfileRequest,
  UserProfileResponse,
  CreateGroupRequest,
  GroupResponse,
  EventRequest,
  EventResponse,
  SearchProfilesResponse,
  CertificationResponse,
  CustomSectionRequest,
  CustomSectionResponse,
  WorkoutLogRequest,
  WorkoutLogResponse
} from '@trainapp-io/train-core';
import { tokenService } from './tokenService';

/**
 * Get the current user's ID from token service
 */
function getCurrentUserId(): string {
  const userData = tokenService.getUser();
  if (!userData) {
    throw new Error('User not authenticated');
  }
  
  try {
    const parsedData = JSON.parse(userData);
    return parsedData.userId;
  } catch (error) {
    throw new Error('Invalid user data');
  }
}

// USER PROFILE API HOOKS

/**
 * Hook to fetch user profile by ID
 */
export function useUserProfile(userId: string, options?: any) {
  return useApiQuery<UserProfileResponse>(
    ['userProfile', userId],
    `/api/user-profile/${userId}`,
    undefined,
    options
  );
}

/**
 * Hook to fetch the current user's profile
 */
export function useCurrentUserProfile(options?: any) {
  return useDynamicApiQuery<void, UserProfileResponse>(
    ['userProfile', 'current'],
    () => `/api/user-profile/${getCurrentUserId()}`,
    undefined,
    options
  );
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  return useDynamicApiMutation<string, UserProfileRequest, UserProfileResponse>(
    'PUT',
    (userId) => `/api/user-profile/${userId}`,
    {
      onSuccess: () => {
        // Invalidate user profile queries to trigger refetch
        // This would require access to the queryClient
        // queryClient.invalidateQueries(['userProfile']);
      }
    }
  );
}

// GROUP API HOOKS

/**
 * Hook to fetch user's groups
 */
export function useUserGroups(options?: any) {
  return useApiQuery<{ groups: GroupResponse[], userId: string }>(
    ['userGroups'],
    '/api/groups/user',
    undefined,
    options
  );
}

/**
 * Hook to fetch a specific group
 */
export function useGroup(groupId: string, options?: any) {
  return useApiQuery<GroupResponse>(
    ['group', groupId],
    `/api/groups/${groupId}`,
    undefined,
    options
  );
}

/**
 * Hook to create a new group
 */
export function useCreateGroup() {
  return useApiMutation<CreateGroupRequest, GroupResponse>(
    'POST',
    '/api/groups',
    {
      onSuccess: () => {
        // Invalidate groups queries to trigger refetch
        // queryClient.invalidateQueries(['userGroups']);
      }
    }
  );
}

/**
 * Hook to update a group
 */
export function useUpdateGroup() {
  return useDynamicApiMutation<string, CreateGroupRequest, GroupResponse>(
    'PUT',
    (groupId) => `/api/groups/${groupId}`,
    {
      onSuccess: () => {
        // Invalidate relevant queries
        // queryClient.invalidateQueries(['userGroups']);
        // queryClient.invalidateQueries(['group']);
      }
    }
  );
}

/**
 * Hook to delete a group
 */
export function useDeleteGroup() {
  return useDynamicApiMutation<string, {}, {}>(
    'DELETE',
    (groupId) => `/api/groups/${groupId}`,
    {
      onSuccess: () => {
        // Invalidate groups queries to trigger refetch
        // queryClient.invalidateQueries(['userGroups']);
      }
    }
  );
}

// EVENT API HOOKS

/**
 * Hook to fetch user's events
 */
export function useUserEvents(
  statusFilter: 'ATTENDING' | 'INTERESTED' | 'CREATED' | 'ALL' = 'ALL',
  timeframeFilter: 'PAST' | 'UPCOMING' | 'ALL' = 'UPCOMING',
  page: number = 1,
  limit: number = 10,
  options?: any
) {
  return useApiQuery<{ events: EventResponse[], pagination: any }>(
    ['userEvents', statusFilter, timeframeFilter, page, limit],
    '/api/events/user',
    { statusFilter, timeframeFilter, page, limit },
    options
  );
}

/**
 * Hook to fetch a specific event
 */
export function useEvent(eventId: string, options?: any) {
  return useApiQuery<EventResponse>(
    ['event', eventId],
    `/api/events/${eventId}`,
    undefined,
    options
  );
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  return useApiMutation<EventRequest, EventResponse>(
    'POST',
    '/api/events',
    {
      onSuccess: () => {
        // Invalidate events queries to trigger refetch
        // queryClient.invalidateQueries(['userEvents']);
      }
    }
  );
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
  return useDynamicApiMutation<string, EventRequest, EventResponse>(
    'PUT',
    (eventId) => `/api/events/${eventId}`,
    {
      onSuccess: () => {
        // Invalidate relevant queries
        // queryClient.invalidateQueries(['userEvents']);
        // queryClient.invalidateQueries(['event']);
      }
    }
  );
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
  return useDynamicApiMutation<string, {}, {}>(
    'DELETE',
    (eventId) => `/api/events/${eventId}`,
    {
      onSuccess: () => {
        // Invalidate events queries to trigger refetch
        // queryClient.invalidateQueries(['userEvents']);
      }
    }
  );
}

// SEARCH API HOOKS

/**
 * Hook to search profiles and groups
 */
export function useSearchProfilesAndGroups(
  searchQuery: string,
  page: number = 1,
  limit: number = 10,
  options?: any
) {
  return useApiQuery<SearchProfilesResponse>(
    ['search', 'profilesAndGroups', searchQuery, page, limit],
    `/api/search/profiles-and-groups/${encodeURIComponent(searchQuery)}`,
    { page, limit },
    {
      enabled: searchQuery.trim().length >= 2,
      ...options
    }
  );
}

/**
 * Hook to search certifications
 */
export function useCertificationSearch(
  params: {
    searchTerm: string;
    page: number;
    pageSize: number;
    enabled?: boolean;
  }
) {
  return useApiQuery<CertificationResponse>(
    ['search', 'certifications', params.searchTerm, params.page, params.pageSize],
    `/api/search/certifications/${encodeURIComponent(params.searchTerm)}`,
    { page: params.page, limit: params.pageSize },
    {
      enabled: (params.enabled !== undefined ? params.enabled : true) && 
               params.searchTerm.trim().length >= 2,
    }
  );
}

// CUSTOM SECTION API HOOKS

/**
 * Hook to add a custom section to user profile
 */
export function useAddCustomSection() {
  return useDynamicApiMutation<string, CustomSectionRequest, CustomSectionResponse>(
    'POST',
    (userId) => `/api/user-profile/${userId}/custom-section`,
    {
      onSuccess: () => {
        // Invalidate user profile queries to trigger refetch
        // queryClient.invalidateQueries(['userProfile']);
      }
    }
  );
}

/**
 * Hook to update a custom section
 */
export function useUpdateCustomSection() {
  return useDynamicApiMutation<
    { userId: string; sectionId: string }, 
    CustomSectionRequest, 
    CustomSectionResponse
  >(
    'PUT',
    (params) => `/api/user-profile/${params.userId}/custom-section/${params.sectionId}`,
    {
      onSuccess: () => {
        // Invalidate user profile queries to trigger refetch
        // queryClient.invalidateQueries(['userProfile']);
      }
    }
  );
}

/**
 * Hook to delete a custom section
 */
export function useDeleteCustomSection() {
  return useDynamicApiMutation<
    { userId: string; sectionId: string }, 
    {}, 
    {}
  >(
    'DELETE',
    (params) => `/api/user-profile/${params.userId}/custom-section/${params.sectionId}`,
    {
      onSuccess: () => {
        // Invalidate user profile queries to trigger refetch
        // queryClient.invalidateQueries(['userProfile']);
      }
    }
  );
}

// WORKOUT LOG API HOOKS

/**
 * Hook to create a new workout log
 */
export function useCreateWorkoutLog() {
  return useApiMutation<WorkoutLogRequest, WorkoutLogResponse>(
    'POST',
    '/workout-logs',
    {
      onSuccess: () => {
        // Invalidate workout log queries to trigger refetch
        // queryClient.invalidateQueries(['workoutLogs']);
      }
    }
  );
}

/**
 * Hook to fetch workout log history for a user
 */
export function useWorkoutLogHistory(options?: any) {
  return useApiQuery<WorkoutLogResponse[]>(
    ['workoutLogs', 'history'],
    '/workout-logs',
    undefined,
    options
  );
}

/**
 * Hook to fetch a specific workout log
 */
export function useWorkoutLog(logId: string, options?: any) {
  return useApiQuery<WorkoutLogResponse>(
    ['workoutLog', logId],
    `/workout-logs/${logId}`,
    undefined,
    options
  );
}

/**
 * Hook to update a workout log
 */
export function useUpdateWorkoutLog() {
  return useDynamicApiMutation<string, WorkoutLogRequest, { success: boolean }>(
    'PUT',
    (logId) => `/workout-logs/${logId}`,
    {
      onSuccess: () => {
        // Invalidate relevant queries
        // queryClient.invalidateQueries(['workoutLogs']);
        // queryClient.invalidateQueries(['workoutLog']);
      }
    }
  );
}

/**
 * Hook to delete a workout log
 */
export function useDeleteWorkoutLog() {
  return useDynamicApiMutation<string, {}, { success: boolean }>(
    'DELETE',
    (logId) => `/workout-logs/${logId}`,
    {
      onSuccess: () => {
        // Invalidate workout log queries to trigger refetch
        // queryClient.invalidateQueries(['workoutLogs']);
      }
    }
  );
}
