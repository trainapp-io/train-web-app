import { BaseApiService, QueryParams } from "../../../services/BaseApiService";
import { SuccessResponse } from "../../../types/api.types";
import {
  EventRequest,
  EventResponse,
  UserEventRequest,
  UserEventResponse,
  CursorPaginationResponse,
} from "@trainapp-io/train-core";

/**
 * Service for event management operations
 */
class EventService extends BaseApiService<
  EventResponse,
  EventRequest,
  EventRequest
> {
  constructor() {
    super("/event", "event");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  /**
   * Create a new event for the current user
   * POST /event
   */
  async createEvent(eventData: EventRequest): Promise<EventResponse> {
    return this.create(eventData);
  }

  /**
   * Create a new event for a specific group
   * POST /event/{groupId}
   */
  async createGroupEvent(
    groupId: string,
    eventData: EventRequest
  ): Promise<EventResponse> {
    return this.post<EventResponse>(`/event/${groupId}`, eventData);
  }

  /**
   * Get user events with cursor-based pagination
   * GET /event/user/{userId}
   */
  async getUserEvents(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<CursorPaginationResponse<UserEventResponse>> {
    const params: QueryParams = {
      limit: Math.min(limit, 50),
      ...(cursor && { cursor }),
    };

    return this.get<CursorPaginationResponse<UserEventResponse>>(
      `/event/user/${userId}`,
      params
    );
  }

  async getEvents(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<EventResponse[]> {
    const params: QueryParams = {
      limit: Math.min(limit, 50),
      ...(cursor && { cursor }),
    };

    const response = await this.get<
      CursorPaginationResponse<UserEventResponse>
    >(`/event/user/${userId}`, params);
    return response.data.map((item) => item.event) || [];
  }

  /**
   * Get a specific event by ID
   * GET /event/user/event/{eventId}
   */
  async getUserEventById(eventId: string): Promise<EventResponse> {
    return this.get<EventResponse>(`/event/user/event/${eventId}`);
  }

  /**
   * Update an event (owner only)
   * PUT /event/{eventId}
   */
  async updateEvent(
    eventId: string,
    eventData: EventRequest
  ): Promise<EventResponse> {
    return this.put<EventResponse>(`/event/${eventId}`, eventData);
  }

  /**
   * Update a user's status for an event
   * PUT /event/user/status
   */
  async updateUserEventStatus(
    userEventData: UserEventRequest
  ): Promise<SuccessResponse> {
    return this.put<SuccessResponse>(`/event/user/status`, userEventData);
  }

  /**
   * Delete an event (owner only)
   * DELETE /event/{eventId}
   */
  async deleteEvent(
    eventId: string
  ): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/event/user/event/${eventId}`);
  }

  /**
   * Delete a user's association with an event
   * DELETE /event/user/event/{eventId}
   */
  async deleteUserEvent(eventId: string): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/event/user/event/${eventId}`);
  }

  /**
   * Remove a user from an event (owner only)
   * DELETE /event/{eventId}/user/{userId}
   */
  async removeUserFromEvent(
    eventId: string,
    userId: string
  ): Promise<SuccessResponse> {
    return this.delete<SuccessResponse>(`/event/${eventId}/user/${userId}`);
  }

  /**
   * Get all events for a specific group
   * GET /event/group/{groupId}
   */
  async getGroupEvents(groupId: string): Promise<EventResponse[]> {
    return this.get<EventResponse[]>(`/event/group/${groupId}`);
  }
}

// Export singleton instance
export const eventService = new EventService();
export default eventService;
