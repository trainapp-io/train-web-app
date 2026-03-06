import React from 'react';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import './TimeSlotCard.css';

interface TimeSlotCardProps {
  slot: AvailabilityResponse;
  onClick?: () => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, onClick }) => {
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  const getEndTime = () => {
    const end = new Date(slot.startTime);
    end.setMinutes(end.getMinutes() + (slot.slotDuration || 30));
    return formatTime(end);
  };

  return (
    <div className="time-slot-card" onClick={onClick}>
      <div className="time-slot-range">
        <span className="time-slot-start">{formatTime(slot.startTime)}</span>
        <span className="time-slot-separator">→</span>
        <span className="time-slot-end">{getEndTime()}</span>
      </div>
      <div className="time-slot-meta">
        {slot.title && <span className="time-slot-title">{slot.title}</span>}
        <span className="time-slot-duration">{slot.slotDuration} min</span>
      </div>
    </div>
  );
};
