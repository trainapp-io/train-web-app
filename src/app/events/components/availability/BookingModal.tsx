import React, { useState, useEffect } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { BookingRequest } from '../../types/availability.types';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import { tokenService } from '../../../../services/tokenService';
import Button from '../../../../components/ui/Button';
import './BookingModal.css';

interface BookingModalProps {
  slot: AvailabilityResponse;
  hostId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ slot, hostId, onSuccess, onCancel }) => {
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = tokenService.getAccessToken();
    setIsLoggedIn(!!token);
  }, []);

  const getRequesterId = (): string | undefined => {
    const userString = tokenService.getUser();
    if (!userString) return undefined;
    
    try {
      const user = JSON.parse(userString);
      return user.userId;
    } catch {
      return undefined;
    }
  };

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

    // Validate guest fields if not logged in
    if (!isLoggedIn) {
      if (!guestName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      if (!guestPhone.trim()) {
        setError('Please enter your phone number');
        setLoading(false);
        return;
      }
    }

    try {
      const endTime = new Date(new Date(slot.startTime).getTime() + slot.slotDuration * 60000).toISOString();
      
      const requesterId = getRequesterId();
      
      const bookingRequest: BookingRequest = {
        availabilitySlotId: slot.id!,
        hostId: hostId,
        requesterId: requesterId,
        startTime: typeof slot.startTime === 'string' ? slot.startTime : slot.startTime.toString(),
        endTime: endTime,
        notes: notes.trim() || undefined,
      };

      // Add guest information if not logged in
      if (!isLoggedIn) {
        bookingRequest.guestName = guestName.trim();
        bookingRequest.guestPhone = guestPhone.trim();
      }

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
              <span className="detail-value">{slot.slotDuration} minutes</span>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLoggedIn && (
              <>
                <div className="form-group">
                  <label htmlFor="guestName">Your Name *</label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="guestPhone">Phone Number *</label>
                  <input
                    type="tel"
                    id="guestPhone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </>
            )}
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
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} disabled={loading}>
                Confirm Booking
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
