import React from 'react';
import { AvailabilitySlotResponse } from '../../types/availability.types';
import './AvailabilitySlotCard.css';

interface AvailabilitySlotCardProps {
  slot: AvailabilitySlotResponse;
  onEdit: (slot: AvailabilitySlotResponse) => void;
  onDelete: (slotId: string) => void;
  onToggleActive: (slotId: string, isActive: boolean) => void;
  onShare: (slotId: string) => void;
}

const AvailabilitySlotCard: React.FC<AvailabilitySlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
  onToggleActive,
  onShare,
}) => {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatRecurrence = () => {
    if (!slot.isRecurring || !slot.recurrencePattern) return null;

    const { frequency, interval, daysOfWeek } = slot.recurrencePattern;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let text = `Every ${interval > 1 ? interval : ''} ${frequency}`;
    
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const days = daysOfWeek.map(d => dayNames[d]).join(', ');
      text += ` on ${days}`;
    }

    return text;
  };

  const bookingProgress = slot.maxBookings 
    ? `${slot.currentBookings || 0} / ${slot.maxBookings} booked`
    : `${slot.currentBookings || 0} bookings`;

  return (
    <div className={`availability-slot-card ${!slot.isActive ? 'inactive' : ''}`}>
      <div className="card-header">
        <div className="card-title">
          <h3>{slot.title}</h3>
          <span className={`status-badge ${slot.isActive ? 'active' : 'inactive'}`}>
            {slot.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="card-actions">
          <button
            className="btn-icon"
            onClick={() => onShare(slot.id!)}
            title="Share"
          >
            🔗
          </button>
          <button
            className="btn-icon"
            onClick={() => onEdit(slot)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(slot.id!)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {slot.description && (
        <p className="card-description">{slot.description}</p>
      )}

      <div className="card-details">
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{slot.duration} minutes</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Time:</span>
          <span className="detail-value">
            {formatDate(slot.startTime)} - {formatDate(slot.endTime)}
          </span>
        </div>

        {slot.isRecurring && (
          <div className="detail-item">
            <span className="detail-label">Recurrence:</span>
            <span className="detail-value">{formatRecurrence()}</span>
          </div>
        )}

        <div className="detail-item">
          <span className="detail-label">Bookings:</span>
          <span className="detail-value">{bookingProgress}</span>
        </div>
      </div>

      <div className="card-footer">
        <button
          className={`btn-toggle ${slot.isActive ? 'btn-deactivate' : 'btn-activate'}`}
          onClick={() => onToggleActive(slot.id!, slot.isActive)}
        >
          {slot.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
};

export default AvailabilitySlotCard;
