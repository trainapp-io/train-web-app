import api from "../../../services/apiClient";
import {
  CreateAvailabilityRequest,
  AvailabilitySlotResponse,
  BookingRequest,
  BookingResponse,
} from "../types/availability.types";

import { AvailabilityResponse } from "@trainapp-io/train-core";

class AvailabilityService {
  private baseUrl = "/availability";

  // Availability Slot Management
  // Backend expects an array of availability objects
  async createAvailabilitySlot(
    request: CreateAvailabilityRequest
  ): Promise<AvailabilitySlotResponse> {
    const response = await api.post<AvailabilitySlotResponse[]>(this.baseUrl, [
      request,
    ]);
    return response.data[0]; // Return first item since we're creating one
  }

  async getMyAvailabilitySlots(
    userId: string
  ): Promise<AvailabilitySlotResponse[]> {
    const response = await api.get<AvailabilitySlotResponse[]>(
      `${this.baseUrl}/${userId}`
    );
    return response.data;
  }

  async getUserAvailability(userId: string): Promise<AvailabilityResponse[]> {
    const response = await api.get<AvailabilityResponse[]>(
      `${this.baseUrl}/${userId}`
    );
    return response.data;
  }

  async getPublicUserAvailability(userId: string): Promise<AvailabilityResponse[]> {
    const response = await api.get<AvailabilityResponse[]>(
      `${this.baseUrl}/public/${userId}`
    );
    return response.data;
  }

  async getAvailabilitySlot(slotId: string): Promise<AvailabilitySlotResponse> {
    const response = await api.get<AvailabilitySlotResponse>(
      `${this.baseUrl}/${slotId}`
    );
    return response.data;
  }

  async updateAvailabilitySlot(
    slotId: string,
    request: Partial<CreateAvailabilityRequest>
  ): Promise<AvailabilitySlotResponse> {
    const response = await api.put<AvailabilitySlotResponse>(
      `${this.baseUrl}/${slotId}`,
      request
    );
    return response.data;
  }

  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${slotId}`);
  }

  async toggleAvailabilitySlot(
    slotId: string,
    slotStatus: "available" | "cancelled"
  ): Promise<AvailabilitySlotResponse> {
    const response = await api.patch<AvailabilitySlotResponse>(
      `${this.baseUrl}/${slotId}/toggle`,
      { slotStatus }
    );
    return response.data;
  }

  // Booking Management
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    // Transform the request to match the new API structure
    const appointmentRequest = {
      hostId: request.hostId,
      availabilityId: request.availabilitySlotId,
      requestedAt: request.startTime,
      ...(request.requesterId && { requesterId: request.requesterId }),
      ...(request.guestName && { guestName: request.guestName }),
      ...(request.guestPhone && { guestPhone: request.guestPhone }),
      ...(request.notes && { notes: request.notes })
    };
    
    const response = await api.post<BookingResponse>("/appointment/book", appointmentRequest);
    return response.data;
  }

  async getMyBookings(): Promise<BookingResponse[]> {
    const response = await api.get<BookingResponse[]>("/bookings/my-bookings");
    return response.data;
  }

  async getBookingsForMySlots(): Promise<BookingResponse[]> {
    const response = await api.get<BookingResponse[]>(
      "/bookings/my-slots-bookings"
    );
    return response.data;
  }

  async getBooking(bookingId: string): Promise<BookingResponse> {
    const response = await api.get<BookingResponse>(`/bookings/${bookingId}`);
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<BookingResponse> {
    const response = await api.patch<BookingResponse>(
      `/bookings/${bookingId}/cancel`
    );
    return response.data;
  }

  async confirmBooking(bookingId: string): Promise<BookingResponse> {
    const response = await api.patch<BookingResponse>(
      `/bookings/${bookingId}/confirm`
    );
    return response.data;
  }

  // Get available time slots for a specific availability slot
  async getAvailableTimeSlots(
    slotId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Date[]> {
    const response = await api.get<Date[]>(
      `${this.baseUrl}/${slotId}/available-times`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      }
    );
    return response.data;
  }
}

export const availabilityService = new AvailabilityService();
