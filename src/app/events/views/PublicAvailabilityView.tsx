import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { availabilityService } from '../services/availabilityService';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import { Calendar } from '../components/availability/Calendar';
import { TimeSlotCard } from '../components/availability/TimeSlotCard';
import { AppointmentConfirmDialog } from '../components/availability/AppointmentConfirmDialog';
import './PublicAvailabilityView.css';

const PublicAvailabilityView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [slots, setSlots] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityResponse | null>(null);
  const [showAppointmentConfirm, setShowAppointmentConfirm] = useState(false);
  const [trainerName, setTrainerName] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetchPublicAvailability();
    }
  }, [userId]);

  const fetchPublicAvailability = async () => {
    try {
      setLoading(true);
      const data = await availabilityService.getUserAvailability(userId!);
      setSlots(data);
      
      // Extract trainer name from first slot if available
      if (data.length > 0) {
        setTrainerName('Trainer'); // You can enhance this to fetch user profile
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load availability');
      console.error('Error fetching public availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (slot: AvailabilityResponse) => {
    setSelectedSlot(slot);
    setShowAppointmentConfirm(true);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedSlot) return;
    
    try {
      // TODO: Implement public booking logic here
      console.log('Confirming appointment for slot:', selectedSlot.id);
      alert('Appointment confirmed! You will receive a confirmation email.');
      setShowAppointmentConfirm(false);
      setSelectedSlot(null);
      await fetchPublicAvailability();
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setError('Failed to confirm appointment. Please try again.');
    }
  };

  const handleCancelAppointment = () => {
    setShowAppointmentConfirm(false);
    setSelectedSlot(null);
  };

  // Get availability dates for calendar
  const availabilityDates = useMemo(() => {
    const dates = new Set<string>();
    slots.forEach(slot => {
      const date = new Date(slot.startDate);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      dates.add(`${year}-${month}-${day}`);
    });
    return dates;
  }, [slots]);

  // Get slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.startDate);
      const slotYear = slotDate.getUTCFullYear();
      const slotMonth = slotDate.getUTCMonth();
      const slotDay = slotDate.getUTCDate();
      
      return slotDay === selectedDate.getDate() &&
             slotMonth === selectedDate.getMonth() &&
             slotYear === selectedDate.getFullYear();
    }).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [slots, selectedDate]);

  const formatSelectedDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[selectedDate.getDay()]} ${months[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="public-availability-view">
        <div className="loading-container">
          <p>Loading availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-availability-view">
        <div className="error-container">
          <h2>Unable to Load Availability</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-availability-view">
      <div className="public-header">
        <h1>Book a Session</h1>
        <p>Select a date and time that works for you</p>
      </div>

      {showAppointmentConfirm && selectedSlot && (
        <div className="form-overlay">
          <AppointmentConfirmDialog
            slot={selectedSlot}
            trainerName={trainerName}
            onConfirm={handleConfirmAppointment}
            onCancel={handleCancelAppointment}
          />
        </div>
      )}

      <Calendar
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        availabilityDates={availabilityDates}
        onDateSelect={handleDateSelect}
        onMonthChange={handleMonthChange}
      />

      <div className="selected-date-section">
        <h3 className="selected-date-title">{formatSelectedDate()}</h3>
        
        {slotsForSelectedDate.length === 0 ? (
          <div className="empty-day-state">
            <p>No availability for this day</p>
            <p className="empty-hint">Please select another date</p>
          </div>
        ) : (
          <div className="time-slots-grid">
            {slotsForSelectedDate.map(slot => (
              <TimeSlotCard
                key={slot.id}
                slot={slot}
                onClick={() => handleTimeSlotClick(slot)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicAvailabilityView;
