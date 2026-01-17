# Availability & Booking System

## Overview
This feature allows users to:
1. Set their availability slots
2. Share availability with others
3. Book available time slots
4. Manage bookings

## Components

### 1. AvailabilityManager
**Location:** `src/app/events/components/availability/AvailabilityManager.tsx`

Allows users to create, edit, delete, and manage their availability slots.

**Features:**
- Create new availability slots
- Edit existing slots
- Toggle active/inactive status
- Delete slots
- Share slot links
- View booking progress

### 2. AvailabilityCalendar
**Location:** `src/app/events/components/availability/AvailabilityCalendar.tsx`

Displays available time slots for booking.

**Features:**
- View slots grouped by date
- See availability status
- Book available slots
- Filter by user or specific slot

**Usage:**
```tsx
// View all slots for a user
<AvailabilityCalendar userId="user123" />

// View specific slot (from URL params)
// Route: /availability/:slotId
<AvailabilityCalendar />
```

### 3. BookingsManager
**Location:** `src/app/events/components/availability/BookingsManager.tsx`

Manage bookings made by the user and bookings on their slots.

**Features:**
- View bookings in two tabs:
  - My Bookings: Slots you've booked with others
  - Slot Bookings: Bookings others made on your slots
- Confirm/decline pending bookings
- Cancel bookings
- View booking status

### 4. AvailabilityPage
**Location:** `src/app/events/views/AvailabilityPage.tsx`

Main page with tabs for availability management and bookings.

## API Service

**Location:** `src/app/events/services/availabilityService.ts`

### Availability Slot Methods:
- `createAvailabilitySlot(request)` - Create new slot
- `getMyAvailabilitySlots()` - Get user's slots
- `getUserAvailabilitySlots(userId)` - Get slots for specific user
- `getAvailabilitySlot(slotId)` - Get specific slot
- `updateAvailabilitySlot(slotId, request)` - Update slot
- `deleteAvailabilitySlot(slotId)` - Delete slot
- `toggleAvailabilitySlot(slotId, isActive)` - Toggle active status

### Booking Methods:
- `createBooking(request)` - Create new booking
- `getMyBookings()` - Get user's bookings
- `getBookingsForMySlots()` - Get bookings on user's slots
- `getBooking(bookingId)` - Get specific booking
- `cancelBooking(bookingId)` - Cancel booking
- `confirmBooking(bookingId)` - Confirm booking

## Types

**Location:** `src/app/events/types/availability.types.ts`

### Main Types:
- `AvailabilitySlot` - Availability slot data
- `Booking` - Booking data
- `RecurrencePattern` - For recurring slots
- `BookingStatus` - Enum for booking statuses

## Integration

### Add to Navigation
```tsx
import { AvailabilityPage } from './app/events/views/AvailabilityPage';

// In your router
<Route path="/availability" element={<AvailabilityPage />} />
<Route path="/availability/:slotId" element={<AvailabilityCalendar />} />
```

### Share Availability
Users can share their availability slots via:
1. Click "Share" button on slot card
2. Copy the generated link: `{domain}/availability/{slotId}`
3. Share link with others

### Booking Flow
1. User visits shared availability link
2. Views available time slots
3. Clicks on desired slot
4. Fills booking modal with optional notes
5. Confirms booking
6. Booking appears in both users' booking lists
7. Slot owner can confirm/decline the booking
8. Upon confirmation, an event can be created automatically

## Backend Requirements

The backend service should implement these endpoints:

### Availability Endpoints:
- `POST /availability` - Create slot
- `GET /availability/my-slots` - Get user's slots
- `GET /availability/user/:userId` - Get user's slots
- `GET /availability/:slotId` - Get specific slot
- `PUT /availability/:slotId` - Update slot
- `DELETE /availability/:slotId` - Delete slot
- `PATCH /availability/:slotId/toggle` - Toggle active status

### Booking Endpoints:
- `POST /bookings` - Create booking
- `GET /bookings/my-bookings` - Get user's bookings
- `GET /bookings/my-slots-bookings` - Get bookings on user's slots
- `GET /bookings/:bookingId` - Get specific booking
- `PATCH /bookings/:bookingId/cancel` - Cancel booking
- `PATCH /bookings/:bookingId/confirm` - Confirm booking

## Styling

All components have corresponding CSS files for easy customization:
- `AvailabilityManager.css`
- `AvailabilitySlotCard.css`
- `AvailabilitySlotForm.css`
- `AvailabilityCalendar.css`
- `BookingModal.css`
- `BookingsManager.css`
- `AvailabilityPage.css`

## Future Enhancements

Potential improvements:
1. Calendar view with drag-and-drop
2. Email notifications for bookings
3. Integration with Google Calendar
4. Recurring slot templates
5. Booking reminders
6. Video call integration
7. Payment integration for paid slots
8. Analytics dashboard
