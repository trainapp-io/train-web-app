import { useState, useEffect } from 'react';
import eventService from '../../services/EventService2';
import { EventResponse } from '@trainapp-io/train-core';
import CreateEventForm from '../forms/CreateEventForm';
import EventCard from './EventCard';
import EventDetails from './EventDetails';

export default function EventManager() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const events = await eventService.getEvents();
        const normalizedEvents: EventResponse[] = events.map((item) =>
          'event' in item ? (item as any).event : (item as EventResponse)
        );
        setEvents(normalizedEvents);
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
        const response = await eventService.deleteEvent(eventId);
        console.log('Delete event response:', response);
      }
      
      // Update UI to remove the deleted event
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setErr(''); // Clear any previous errors
    } catch (error: any) {
      console.error('Error deleting event:', error);
      console.error('Error response:', error.response);
      setErr('Failed to delete event.');
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
            {events.map((event, index) => (
              <EventCard 
                key={event.id || `event-${index}`} 
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
