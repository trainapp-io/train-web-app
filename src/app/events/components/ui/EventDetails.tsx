import React from 'react';
import { EventResponse } from '@trainapp-io/train-core';
import './EventManager.css';

interface EventDetailsProps {
  event: EventResponse;
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack }) => {
  const startDate = new Date(event.startTime as unknown as string);
  const endDate = event.endTime ? new Date(event.endTime as unknown as string) : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  return (
    <div className="event-details">
      <button className="back-button" onClick={onBack}>
        &larr; Back to Events
      </button>
      
      <div className="event-details-header">
        <h2>{event.title}</h2>
      </div>
      
      <div className="event-details-content">
        <div className="event-details-section">
          <h3>Date & Time</h3>
          <p>
            {formatDate(startDate)} at {formatTime(startDate)}
            {endDate && ` - ${formatTime(endDate)}`}
          </p>
        </div>
        
        {event.location && (
          <div className="event-details-section">
            <h3>Location</h3>
            <p>{event.location}</p>
          </div>
        )}
        
        {event.description && (
          <div className="event-details-section">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>
        )}
        
        {event.admin && event.admin.length > 0 && (
          <div className="event-details-section">
            <h3>Organizers</h3>
            <ul>
              {event.admin.map((admin, index) => (
                <li key={index}>{admin}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
