import React, { useState, useEffect, useMemo } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilitySlotResponse } from '../../types/availability.types';
import { tokenService } from '../../../../services/tokenService';
import AvailabilitySlotForm from './AvailabilitySlotForm';
import { Calendar } from './Calendar';
import { TimeSlotCard } from './TimeSlotCard';
import { AppointmentConfirmDialog } from './AppointmentConfirmDialog';
import './AvailabilityManager.css';
import { AvailabilityResponse } from '@trainapp-io/train-core';

const AvailabilityManager: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlotResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityResponse | null>(null);
  const [showAppointmentConfirm, setShowAppointmentConfirm] = useState(false);
  const [trainerName, setTrainerName] = useState<string>('');

  useEffect(() => {
    fetchMySlots();
  }, []);

  const fetchMySlots = async () => {
    try {
      setLoading(true);
      const userStr = tokenService.getUser();
      if (!userStr) {
        throw new Error('User not authenticated');
      }
      const user = JSON.parse(userStr);
      setTrainerName(user.name || user.email || 'Trainer');
      const data = await availabilityService.getUserAvailability(user.userId);
      setSlots(data);
      setError(null);
    } catch (err) {
      setError('Failed to load availability slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = () => {
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingSlot(null);
    await fetchMySlots();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSlot(null);
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
      // TODO: Implement booking logic here
      console.log('Confirming appointment for slot:', selectedSlot.id);
      alert('Appointment confirmed!');
      setShowAppointmentConfirm(false);
      setSelectedSlot(null);
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
      // Use UTC date to avoid timezone issues
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
      // Compare using UTC dates to avoid timezone issues
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
      <div className="availability-manager">
        <p>Loading availability slots...</p>
      </div>
    );
  }

  return (
    <div className="availability-manager">
      <div className="availability-header">
        <div className="header-spacer"></div>
        <button 
          className="btn-create-availability" 
          onClick={handleCreateSlot}
        >
          + Create Availability
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <AvailabilitySlotForm
            slot={editingSlot}
            selectedDate={selectedDate}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

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

export default AvailabilityManager;
