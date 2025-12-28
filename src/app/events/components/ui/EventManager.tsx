import { useState, useEffect } from 'react';
import eventService from '../../services/EventService2';
import { EventResponse } from '@trainapp-io/train-core';
import CreateEventForm from '../forms/CreateEventForm';
import EventCard from './EventCard';
import EventDetails from './EventDetails';
import { authService } from '../../../access/services/authService';

export default function EventManager() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const events = await eventService.getEvents(user?.userId);
        setEvents(events);
      } catch {
        setErr('Could not load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = (event: EventResponse) => {
    setEvents(prev => [...prev, event]);
    setShowCreateForm(false); // Hide form after successful creation
  };

  const handleToggleForm = (show: boolean) => {
    setShowCreateForm(show);
    // Clear selected event when showing form
    if (show) {
      setSelectedEvent(null);
    }
  };

  const handleSelectEvent = (event: EventResponse) => {
    setSelectedEvent(event);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return; // User canceled the deletion
    }
    
    try {
      const eventToDelete = events.find(event => event.id === eventId);
      if (eventToDelete) {
        await eventService.deleteEvent(eventId);
      }
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      setErr('Failed to delete event.');
      console.error('Error deleting event:', error);
    }
  };

  // Render event details if an event is selected
  if (selectedEvent) {
    return (
      <div className="event-manager">
        <EventDetails 
          event={selectedEvent} 
          onBack={handleBackToEvents} 
        />
      </div>
    );
  }

  return (
    <div className="event-manager">
      {loading && <p>Loading…</p>}
      {err && <p className="error">{err}</p>}
      
      {showCreateForm ? (
        <CreateEventForm 
          onCreated={handleCreateEvent} 
          onCancel={() => handleToggleForm(false)}
        />
      ) : (
        <>
          <button 
            className="create-event-button" 
            onClick={() => handleToggleForm(true)}
          >
            + Create New Event
          </button>
          <div className="events-list">
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={handleSelectEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
