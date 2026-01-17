import React, { useState, useEffect } from 'react';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilitySlotResponse } from '../../types/availability.types';
import { tokenService } from '../../../../services/tokenService';
import AvailabilitySlotForm from './AvailabilitySlotForm';
import AvailabilitySlotCard from './AvailabilitySlotCard';
import './AvailabilityManager.css';

const AvailabilityManager: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlotResponse | null>(null);

  useEffect(() => {
    fetchMySlots();
  }, []);

  const fetchMySlots = async () => {
    try {
      setLoading(true);
      const userStr = tokenService.getUser();
      if (!userStr) {
        throw new Error('User not authenticated');
      }
      const user = JSON.parse(userStr);
      const data = await availabilityService.getMyAvailabilitySlots(user.userId);
      setSlots(data);
      setError(null);
    } catch (err) {
      setError('Failed to load availability slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = () => {
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleEditSlot = (slot: AvailabilitySlotResponse) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await availabilityService.deleteAvailabilitySlot(slotId);
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (err) {
      setError('Failed to delete slot');
      console.error('Error deleting slot:', err);
    }
  };

  const handleToggleActive = async (slotId: string, isActive: boolean) => {
    try {
      const updated = await availabilityService.toggleAvailabilitySlot(slotId, !isActive);
      setSlots(prev => prev.map(slot => slot.id === slotId ? updated : slot));
    } catch (err) {
      setError('Failed to toggle slot status');
      console.error('Error toggling slot:', err);
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingSlot(null);
    await fetchMySlots();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSlot(null);
  };

  const handleShareSlot = (slotId: string) => {
    const shareUrl = `${window.location.origin}/availability/${slotId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="availability-manager">
        <p>Loading availability slots...</p>
      </div>
    );
  }

  return (
    <div className="availability-manager">
      <div className="availability-header">
        <h2>My Availability</h2>
        <button 
          className="btn-primary" 
          onClick={handleCreateSlot}
        >
          + Create Availability Slot
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <AvailabilitySlotForm
            slot={editingSlot}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <div className="slots-container">
        {slots.length === 0 ? (
          <div className="empty-state">
            <p>No availability slots yet.</p>
            <p>Create your first slot to let others book time with you.</p>
          </div>
        ) : (
          <div className="slots-grid">
            {slots.map(slot => (
              <AvailabilitySlotCard
                key={slot.id}
                slot={slot}
                onEdit={handleEditSlot}
                onDelete={handleDeleteSlot}
                onToggleActive={handleToggleActive}
                onShare={handleShareSlot}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManager;
