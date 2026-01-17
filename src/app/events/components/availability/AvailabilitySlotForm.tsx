import React, { useState } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { CreateAvailabilityRequest, AvailabilitySlotResponse } from '../../types/availability.types';
import { tokenService } from '../../../../services/tokenService';
import './AvailabilitySlotForm.css';

interface AvailabilitySlotFormProps {
  slot?: AvailabilitySlotResponse | null;
  selectedDate?: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

const AvailabilitySlotForm: React.FC<AvailabilitySlotFormProps> = ({ slot, selectedDate, onSuccess, onCancel }) => {
  // Format the selected date or use today's date
  const getDefaultDate = () => {
    if (slot?.startDate) {
      return slot.startDate;
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().slice(0, 10);
  };

  // Format time to HH:MM format (without date)
  const getDefaultTime = () => {
    if (slot?.startTime) {
      const date = new Date(slot.startTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: slot?.title || '',
    description: slot?.description || '',
    location: slot?.location || '',
    startDate: getDefaultDate(),
    startTime: getDefaultTime(),
    slotDuration: slot?.slotDuration || 30,
    tags: slot?.tags?.join(', ') || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userStr = tokenService.getUser();
      if (!userStr) {
        throw new Error('User not authenticated');
      }
      const user = JSON.parse(userStr);

      const requestData: CreateAvailabilityRequest = {
        host: user.userId,
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        startDate: formData.startDate,
        startTime: `${formData.startDate}T${formData.startTime}:00.000Z`, // Combine date and time
        slotDuration: formData.slotDuration,
        slotStatus: 'available',
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      };

      if (slot?.id) {
        await availabilityService.updateAvailabilitySlot(slot.id, requestData);
      } else {
        await availabilityService.createAvailabilitySlot(requestData);
      }

      onSuccess();
    } catch (err) {
      setError('Failed to save availability slot');
      console.error('Error saving slot:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="availability-slot-form">
      <div className="form-header">
        <h3>{slot ? 'Edit Availability Slot' : 'Create Availability Slot'}</h3>
        <button className="btn-close" onClick={onCancel}>×</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., 30-min Consultation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe what this time slot is for..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Zoom, Office, etc."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time *</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="slotDuration">Duration (minutes) *</label>
          <input
            type="number"
            id="slotDuration"
            name="slotDuration"
            value={formData.slotDuration}
            onChange={handleChange}
            min="15"
            step="15"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., consultation, training, meeting"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : slot ? 'Update Slot' : 'Create Slot'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilitySlotForm;
