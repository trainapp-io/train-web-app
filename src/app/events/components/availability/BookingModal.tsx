import React, { useState } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilitySlotResponse, BookingRequest } from '../../types/availability.types';
import './BookingModal.css';

interface BookingModalProps {
  slot: AvailabilitySlotResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ slot, onSuccess, onCancel }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingRequest: BookingRequest = {
        availabilitySlotId: slot.id!,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: notes.trim() || undefined,
      };

      await availabilityService.createBooking(bookingRequest);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      console.error('Error creating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onCancel}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book Time Slot</h3>
          <button className="btn-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-content">
          <div className="booking-details">
            <h4>{slot.title}</h4>
            {slot.description && <p className="slot-description">{slot.description}</p>}

            <div className="detail-row">
              <span className="detail-label">Date & Time:</span>
              <span className="detail-value">{formatDateTime(slot.startTime)}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{slot.duration} minutes</span>
            </div>

            {slot.maxBookings && (
              <div className="detail-row">
                <span className="detail-label">Availability:</span>
                <span className="detail-value">
                  {(slot.maxBookings - (slot.currentBookings || 0))} spot(s) remaining
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes or special requests..."
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
