import React, { useState } from 'react';
import { eventService } from '../../services/EventService2';
import { EventRequest } from '@trainapp-io/train-core';
import '../../components/ui/EventManager.css';
import Form from '../../../../components/ui/Form';
import TextInput from '../../../../components/ui/TextInput';

interface CreateEventFormProps {
  onCreated?: (e: any) => void;
  onCancel: () => void;
}

export default function CreateEventForm({ onCreated, onCancel }: CreateEventFormProps) {
  const [ev, setEv] = useState<Partial<EventRequest>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [attendeeInput, setAttendeeInput] = useState('');
  const [publicAttendees, setPublicAttendees] = useState<{ name: string; phoneNumber: string }[]>([
    { name: '', phoneNumber: '' },
  ]);
  const [tagsInput, setTagsInput] = useState('');

  const handleChange = (field: keyof EventRequest, value: string) => {
    if (field === 'startTime' || field === 'endTime') {
      setEv((prev) => ({ ...prev, [field]: value }));
    } else {
      setEv((prev) => ({ ...prev, [field]: value } as Partial<EventRequest>));
    }
  };

  const handlePublicAttendeeChange = (
    index: number,
    field: 'name' | 'phoneNumber',
    value: string
  ) => {
    setPublicAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPublicAttendee = () => {
    setPublicAttendees((prev) => [...prev, { name: '', phoneNumber: '' }]);
  };

  const removePublicAttendee = (index: number) => {
    setPublicAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);

    try {
      const attendees = attendeeInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const sanitizedPublicAttendees = publicAttendees
        .map((attendee) => ({
          name: attendee.name.trim(),
          phoneNumber: attendee.phoneNumber.trim(),
        }))
        .filter((attendee) => attendee.name && attendee.phoneNumber);

      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload: EventRequest = {
        ...(ev as EventRequest),
        title: ev.title || '',
        description: ev.description || '',
        location: ev.location,
        startTime: ev.startTime ? new Date(ev.startTime) : new Date(),
        endTime: ev.endTime ? new Date(ev.endTime) : undefined,
        attendees: attendees.length ? attendees : undefined,
        publicAttendees: sanitizedPublicAttendees.length ? sanitizedPublicAttendees : undefined,
        tags: tags.length ? tags : undefined,
      };

      const created = await eventService.createEvent(payload);
      onCreated?.(created);
      setEv({});
      setAttendeeInput('');
      setPublicAttendees([{ name: '', phoneNumber: '' }]);
      setTagsInput('');
    } catch {
      setErr('Could not save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="event-form-container">
      <h3>Create New Event</h3>

      <Form onSubmit={submit} error={err} className="event-form">
        <TextInput
          id="title"
          label="Event Title"
          type="text"
          placeholder="Enter event title"
          value={ev.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Enter event description"
            value={ev.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input
              id="startTime"
              type="datetime-local"
              value={ev.startTime ? ev.startTime.toString().slice(0, 16) : ''}
              onChange={(e) => handleChange('startTime', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <input
              id="endTime"
              type="datetime-local"
              value={ev.endTime ? ev.endTime.toString().slice(0, 16) : ''}
              onChange={(e) => handleChange('endTime', e.target.value)}
            />
          </div>
        </div>

        <TextInput
          id="location"
          label="Location"
          type="text"
          placeholder="Enter event location"
          value={ev.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />

        <div className="form-group">
          <label htmlFor="attendees">Attendee IDs (comma separated)</label>
          <input
            id="attendees"
            type="text"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            placeholder="507f1f77bcf86cd799439012,507f1f77bcf86cd799439013"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="strength, upper-body"
          />
        </div>

        <div className="form-group">
          <label>Public Attendees</label>
          {publicAttendees.map((attendee, index) => (
            <div key={`${attendee.name}-${index}`} className="public-attendee-row">
              <input
                type="text"
                placeholder="Name"
                value={attendee.name}
                onChange={(e) => handlePublicAttendeeChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone"
                value={attendee.phoneNumber}
                onChange={(e) => handlePublicAttendeeChange(index, 'phoneNumber', e.target.value)}
              />
              {publicAttendees.length > 1 && (
                <button type="button" onClick={() => removePublicAttendee(index)}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addPublicAttendee} className="add-public-attendee">
            Add public attendee
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Create Event'}
          </button>
        </div>
      </Form>
    </div>
  );
}
