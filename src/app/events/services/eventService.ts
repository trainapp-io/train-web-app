import api from "../../../services/apiClient";
import { Event, SuccessResponse } from "../../../types/api.types";
import {
  Alert,
  CursorPaginationResponse,
  UserEventResponse,
  EventRequest,
  EventResponse,
} from "@trainapp-io/train-core";
/**
 * Service for event management operations
 */
export const eventService = {
  /**
   * Create a new event
   * @param eventData - Event data
   * @returns Promise with the created event
   */
  async createEvent(eventData: EventRequest): Promise<Event> {
    try {
      const response = await api.post<Event>("/event", eventData);
      return response.data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  /**
   * Create a new event
   * @param eventData - Event data
   * @returns Promise with the created event
   */
  async createEventLegacy(eventData: {
    title: string;
    description: string;
    location?: string;
    startTime: string;
    endTime: string;
    groupId?: string;
    imagePath?: string;
    tags?: string[];
    alerts?: Alert[];
    admin?: string[];
  }): Promise<Event> {
    try {
      const response = await api.post<Event>("/event", eventData);
      return response.data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  /**
   * Get user events with cursor-based pagination
   * @param userId - User ID to get events for
   * @param limit - Number of events to return (max 50)
   * @param cursor - Cursor for pagination (event ID to start after)
   * @returns Promise with paginated events response
   */
  async getUserEvents(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<CursorPaginationResponse<UserEventResponse>> {
    try {
      const params = new URLSearchParams();
      params.append("limit", Math.min(limit, 50).toString());
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await api.get<
        CursorPaginationResponse<UserEventResponse>
      >(`/event/user/${userId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error getting user events:", error);
      throw error;
    }
  },

  /**
   * Get event by ID
   * @param eventId - Event ID
   * @returns Promise with event
   */
  async getEventById(eventId: string): Promise<Event> {
    try {
      const response = await api.get<Event>(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting event by ID:", error);
      throw error;
    }
  },

  /**
   * Update event
   * @param eventId - Event ID
   * @param eventData - Event data to update
   * @returns Promise with success response
   */
  async updateEvent(
    eventId: string,
    eventData: {
      title?: string;
      description?: string;
      location?: string;
      startDate?: string;
      endDate?: string;
      isVirtual?: boolean;
      virtualMeetingLink?: string;
      maxParticipants?: number;
      eventPicture?: string;
      tags?: string[];
    }
  ): Promise<SuccessResponse> {
    try {
      const response = await api.put<SuccessResponse>(
        `/events/${eventId}`,
        eventData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  /**
   * Update user event status
   * @param eventId - Event ID
   * @param status - Event status
   * @returns Promise with success response
   */
  async updateUserEventStatus(
    eventId: string,
    status: "ATTENDING" | "INTERESTED" | "NOT_ATTENDING"
  ): Promise<SuccessResponse> {
    try {
      const response = await api.put<SuccessResponse>(
        `/events/${eventId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user event status:", error);
      throw error;
    }
  },

  /**
   * Delete event
   * @param eventId - Event ID
   * @returns Promise with success response
   */
  async deleteEvent(eventId: string): Promise<SuccessResponse> {
    try {
      const response = await api.delete<SuccessResponse>(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  /**
   * Delete user event association
   * @param eventId - Event ID
   * @returns Promise with success response
   */
  async deleteUserEventAssociation(eventId: string): Promise<SuccessResponse> {
    try {
      const response = await api.delete<SuccessResponse>(
        `/events/${eventId}/user-event`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting user event association:", error);
      throw error;
    }
  },

  /**
   * Remove user from event
   * @param eventId - Event ID
   * @param userId - User ID
   * @returns Promise with success response
   */
  async removeUserFromEvent(
    eventId: string,
    userId: string
  ): Promise<SuccessResponse> {
    try {
      const response = await api.delete<SuccessResponse>(
        `/events/${eventId}/users/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing user from event:", error);
      throw error;
    }
  },

  /**
   * Get all events
   * @param page - Page number (optional)
   * @param limit - Number of events per page (optional)
   * @returns Promise with events array
   */
  async getEvents(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<EventResponse[]> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get<{
        data: Array<{ event: EventResponse; status: number }>;
      }>(`/event/user/${userId}`);
      return response.data.data.map((item) => item.event) || [];
    } catch (error) {
      console.error("Error getting events:", error);
      throw error;
    }
  },
};

export default eventService;
