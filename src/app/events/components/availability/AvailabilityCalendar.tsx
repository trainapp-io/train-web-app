import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import BookingModal from './BookingModal.tsx';
import './AvailabilityCalendar.css';

interface AvailabilityCalendarProps {
  userId?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ userId: propUserId }) => {
  const { userId: paramUserId, slotId } = useParams<{ userId?: string; slotId?: string }>();
  const userId = propUserId || paramUserId;

  const [slots, setSlots] = useState<AvailabilityResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [userId, slotId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      
      if (slotId) {
        // Fetch specific slot
        const slot = await availabilityService.getAvailabilitySlot(slotId);
        setSlots([slot as any]);
        setSelectedSlot(slot as any);
      } else if (userId) {
        // Fetch all slots for user
        const data = await availabilityService.getUserAvailability(userId);
        setSlots(data);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load availability');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: AvailabilityResponse) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    fetchAvailability();
  };

  const handleBookingCancel = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const groupSlotsByDate = () => {
    const grouped: { [key: string]: AvailabilityResponse[] } = {};
    
    slots.forEach(slot => {
      const dateKey = new Date(slot.startTime).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });

    return Object.entries(grouped).sort(([dateA], [dateB]) => 
      new Date(dateA).getTime() - new Date(dateB).getTime()
    );
  };

  const isSlotAvailable = () => {
    // All slots are available for now
    return true;
  };

  if (loading) {
    return (
      <div className="availability-calendar">
        <p>Loading availability...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="availability-calendar">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate();

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <h2>Available Time Slots</h2>
        {slotId && selectedSlot && (
          <div className="slot-info">
            <h3>{selectedSlot.title}</h3>
            {selectedSlot.description && <p>{selectedSlot.description}</p>}
          </div>
        )}
      </div>

      {groupedSlots.length === 0 ? (
        <div className="empty-state">
          <p>No available time slots at the moment.</p>
        </div>
      ) : (
        <div className="calendar-content">
          {groupedSlots.map(([date, dateSlots]) => (
            <div key={date} className="date-group">
              <div className="date-header">
                <h3>{formatDate(date)}</h3>
              </div>
              <div className="slots-list">
                {dateSlots.map(slot => {
                  const available = isSlotAvailable();
                  return (
                    <div
                      key={slot.id}
                      className={`slot-item ${!available ? 'fully-booked' : ''}`}
                      onClick={() => available && handleSlotClick(slot)}
                    >
                      <div className="slot-time">
                        <span className="time-start">{formatTime(slot.startTime)}</span>
                        <span className="time-separator">-</span>
                        <span className="time-end">{formatTime(new Date(new Date(slot.startTime).getTime() + slot.slotDuration * 60000))}</span>
                      </div>
                      <div className="slot-info-inline">
                        {!slotId && <span className="slot-title">{slot.title}</span>}
                        <span className="slot-duration">{slot.slotDuration} min</span>
                      </div>
                      {!available && (
                        <div className="fully-booked-badge">Fully Booked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookingModal && selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onSuccess={handleBookingSuccess}
          onCancel={handleBookingCancel}
        />
      )}
    </div>
  );
};

export default AvailabilityCalendar;
