import React from 'react';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import './TimeSlotCard.css';

interface TimeSlotCardProps {
  slot: AvailabilityResponse;
  onClick?: () => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, onClick }) => {
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  return (
    <div className="time-slot-card" onClick={onClick}>
      <div className="time-slot-time">{formatTime(slot.startTime)}</div>
    </div>
  );
};
