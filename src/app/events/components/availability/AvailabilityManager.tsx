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
  const [userId, setUserId] = useState<string>('');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

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
      setUserId(user.userId);
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

  const handleShareAvailability = async () => {
    const shareUrl = `${window.location.origin}/share/availability/${userId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert(`Share this link:\n${shareUrl}`);
    }
  };

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

  const slotsForSelectedDate = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.startDate);
      const slotYear = slotDate.getUTCFullYear();
      const slotMonth = slotDate.getUTCMonth();
      const slotDay = slotDate.getUTCDate();
      return slotDay === selectedDate.getDate() &&
             slotMonth === selectedDate.getMonth() &&
             slotYear === selectedDate.getFullYear();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [slots, selectedDate]);

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="availability-manager">
        <p style={{ color: 'var(--text-secondary)' }}>Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="availability-manager">
      <div className="availability-manager-header">
        <button
          className={`btn-share-availability ${showCopiedMessage ? 'copied' : ''}`}
          onClick={handleShareAvailability}
          title="Copy shareable link"
        >
          {showCopiedMessage ? '✓ Link copied' : '↗ Share link'}
        </button>
        <button className="btn-create-availability" onClick={handleCreateSlot}>
          + New slot
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

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

      <div className="availability-content">
        <Calendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          availabilityDates={availabilityDates}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
        />

        <div className="availability-sidebar">
          <div>
            <div className="selected-date-heading">Selected day</div>
            <div className="selected-date-label">{formatSelectedDate()}</div>
          </div>

          {slotsForSelectedDate.length === 0 ? (
            <div className="empty-day-state">No slots on this day</div>
          ) : (
            <div className="time-slots-list">
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
    </div>
  );
};

export default AvailabilityManager;
