import React from 'react';
import { EventResponse } from '@trainapp-io/train-core';
import './EventManager.css';

interface EventCardProps {
  event: EventResponse;
  onEdit?: (event: EventResponse) => void;
  onDelete?: (id: string) => void;
  onClick?: (event: EventResponse) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, onClick }) => {
  const startDate = new Date(event.startTime as unknown as string);
  const endDate = event.endTime ? new Date(event.endTime as unknown as string) : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click when clicking on action buttons
    if ((e.target as HTMLElement).closest('.event-actions')) {
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div 
      className="event-card" 
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="event-card-content">
        <div className="calendar-icon">
          <span className="calendar-icon-month">{startDate.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span className="calendar-icon-day">{startDate.getDate()}</span>
        </div>
        <div className="event-info">
          <h3 className="event-title">{event.title}</h3>
          <div className="event-dates">
            <span>
              {formatDate(startDate)} • {formatTime(startDate)}
              {endDate && ` - ${formatTime(endDate)}`}
            </span>
          </div>
          {event.location && (
            <div className="event-location">
              <span>{event.location}</span>
            </div>
          )}
          <p>{event.description}</p>
        </div>
      </div>
      <div className="event-actions">
        {onEdit && <button onClick={() => onEdit(event)} className="edit-button">Edit</button>}
        {onDelete && <button onClick={() => onDelete(event.id as string)} className="delete-button">Delete</button>}
      </div>
    </div>
  );
};

export default EventCard;
