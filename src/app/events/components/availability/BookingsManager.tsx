import React, { useState, useEffect } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { BookingResponse, BookingStatus } from '../../types/availability.types';
import './BookingsManager.css';

const BookingsManager: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await availabilityService.getBookingsForMySlots();
      setBookings(bookingsData);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await availabilityService.cancelBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Error canceling booking:', err);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await availabilityService.confirmBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      setError('Failed to confirm booking');
      console.error('Error confirming booking:', err);
    }
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'status-confirmed';
      case BookingStatus.PENDING:
        return 'status-pending';
      case BookingStatus.CANCELLED:
        return 'status-cancelled';
      case BookingStatus.COMPLETED:
        return 'status-completed';
      default:
        return '';
    }
  };

  const renderBookingCard = (booking: BookingResponse) => {
    return (
      <div key={booking.id} className="booking-card">
        <div className="booking-header">
          <div className="booking-title">
            <h4>{booking.availabilitySlot?.title || 'Booking'}</h4>
            <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <div className="booking-participant">
            <span>Booked by: {booking.bookedByUserName || 'Unknown'}</span>
          </div>
        </div>

        <div className="booking-details">
          <div className="detail-item">
            <span className="detail-label">Date & Time:</span>
            <span className="detail-value">{formatDateTime(booking.startTime)}</span>
          </div>

          {booking.notes && (
            <div className="detail-item">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{booking.notes}</span>
            </div>
          )}

          {booking.eventId && (
            <div className="detail-item">
              <span className="detail-label">Event Created:</span>
              <span className="detail-value">Yes</span>
            </div>
          )}
        </div>

        <div className="booking-actions">
          {booking.status === BookingStatus.PENDING && (
            <>
              <button
                className="btn-confirm"
                onClick={() => handleConfirmBooking(booking.id!)}
              >
                Confirm
              </button>
              <button
                className="btn-cancel"
                onClick={() => handleCancelBooking(booking.id!)}
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bookings-manager">
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-manager">
      <div className="bookings-header">
        <h2>Bookings on My Slots</h2>
        <p className="bookings-description">
          Manage bookings that clients have made on your availability slots
        </p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="bookings-content">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings yet.</p>
            <p className="empty-state-hint">
              Share your availability slots with clients to start receiving bookings
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => renderBookingCard(booking))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsManager;
