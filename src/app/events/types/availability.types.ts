// Availability Slot Types
export type SlotStatus = 'requested' | 'accepted' | 'rejected' | 'cancelled' | 'available';

export interface CreateAvailabilityRequest {
  host: string;              // User ID of the host (required)
  attendee?: string;         // User ID of attendee (optional)
  slotDuration: number;      // Duration in minutes (required)
  slotStatus: SlotStatus;    // Status (required)
  startDate: string;         // ISO date string (required)
  startTime: string;         // ISO date-time string (required)
  title: string;             // Title of the slot (required)
  location?: string;         // Location (optional)
  description?: string;      // Description (optional)
  tags?: string[];           // Array of tags (optional)
}

export interface AvailabilitySlotResponse {
  id: string;
  host: string;
  attendee?: string;
  slotDuration: number;
  slotStatus: SlotStatus;
  startDate: string;
  startTime: string;
  title: string;
  location?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Booking Types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface Booking {
  id?: string;
  availabilitySlotId: string;
  bookedByUserId: string;
  bookedByUserName?: string;
  ownerUserId: string;
  ownerUserName?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus;
  notes?: string;
  eventId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}


export interface BookingRequest {
  availabilitySlotId: string;
  hostId: string;
  requesterId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  guestName?: string;
  guestPhone?: string;
}

export interface BookingResponse extends Booking {
  id: string;
  availabilitySlot?: AvailabilitySlotResponse;
}
