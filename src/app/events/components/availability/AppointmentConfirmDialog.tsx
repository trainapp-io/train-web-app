import React from 'react';
import { AvailabilityResponse } from '@trainapp-io/train-core';
import './AppointmentConfirmDialog.css';

interface AppointmentConfirmDialogProps {
  slot: AvailabilityResponse;
  trainerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AppointmentConfirmDialog: React.FC<AppointmentConfirmDialogProps> = ({
  slot,
  trainerName,
  onConfirm,
  onCancel,
}) => {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  return (
    <div className="appointment-confirm-dialog">
      <div className="dialog-header">
        <h2>Confirm Appointment</h2>
      </div>

      <div className="dialog-content">
        <div className="appointment-detail">
          <span className="detail-label">Trainer</span>
          <span className="detail-value">{trainerName}</span>
        </div>

        <div className="appointment-detail">
          <span className="detail-label">Date</span>
          <span className="detail-value">{formatDate(slot.startDate)}</span>
        </div>

        <div className="appointment-detail">
          <span className="detail-label">Time</span>
          <span className="detail-value">{formatTime(slot.startTime)}</span>
        </div>

        <div className="appointment-detail">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{slot.slotDuration} minutes</span>
        </div>

        {slot.location && (
          <div className="appointment-detail">
            <span className="detail-label">Location</span>
            <span className="detail-value">{slot.location}</span>
          </div>
        )}

        {slot.description && (
          <div className="appointment-detail">
            <span className="detail-label">Description</span>
            <span className="detail-value">{slot.description}</span>
          </div>
        )}

        {slot.tags && slot.tags.length > 0 && (
          <div className="appointment-detail">
            <span className="detail-label">Tags</span>
            <div className="tags-container">
              {slot.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dialog-actions">
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-confirm" onClick={onConfirm}>
          Confirm Appointment
        </button>
      </div>
    </div>
  );
};
