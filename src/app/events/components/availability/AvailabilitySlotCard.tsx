import React, { useState, useEffect, useRef } from 'react';
import { IoShareOutline, IoTrashOutline, IoEllipsisVertical } from 'react-icons/io5';
import { FaEdit, FaCalendarAlt } from 'react-icons/fa';
import { AvailabilitySlotResponse } from '../../types/availability.types';
import './AvailabilitySlotCard.css';
import { AvailabilityResponse } from '@trainapp-io/train-core';

interface AvailabilitySlotCardProps {
  slot: AvailabilityResponse;
  onEdit: (slot: AvailabilitySlotResponse) => void;
  onDelete: (slotId: string) => void;
  onShare: (slotId: string) => void;
}

const AvailabilitySlotCard: React.FC<AvailabilitySlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
}) => {
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    // Convert AvailabilityResponse to AvailabilitySlotResponse for editing
    const editSlot: AvailabilitySlotResponse = {
      id: slot.id,
      host: (slot as any).host,
      attendee: slot.attendee,
      slotDuration: slot.slotDuration,
      slotStatus: slot.slotStatus as any, // Type conversion for local types
      startDate: new Date(slot.startDate).toISOString(),
      startTime: new Date(slot.startTime).toISOString(),
      title: slot.title || '',
      location: slot.location,
      description: slot.description,
      tags: slot.tags,
    };
    onEdit(editSlot);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    try {
      const shareUrl = `${window.location.origin}/events/availability/${slot.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(slot.id);
  };

  return (
    <div className="availability-slot-card">
      <div className="availability-card-icon">
        <FaCalendarAlt />
      </div>
      <div className="availability-card-content">
        <div className="availability-card-header">
          <div className="availability-card-title-section">
            <h3>{slot.title}</h3>
          </div>
          <div className="availability-card-actions" ref={menuRef}>
            <button 
              className="menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Open menu"
            >
              <IoEllipsisVertical />
            </button>
            {isMenuOpen && (
              <div className="availability-menu-dropdown">
                <button
                  className="menu-item"
                  onClick={handleEdit}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="menu-item"
                  onClick={handleShare}
                >
                  <IoShareOutline /> {shareSuccess ? 'Copied!' : 'Share'}
                </button>
                <button
                  className="menu-item delete"
                  onClick={handleDelete}
                >
                  <IoTrashOutline /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {slot.description && (
          <p className="availability-card-description">{slot.description}</p>
        )}

        <div className="availability-card-meta">
          <span className="availability-duration">{slot.slotDuration} min</span>
          {slot.location && (
            <span className="availability-location">{slot.location}</span>
          )}
          {slot.attendee && (
            <span className="availability-attendee">With attendee</span>
          )}
        </div>

        <div className="availability-card-time">
          <div><strong>Start:</strong> {formatDate(slot.startDate)}</div>
          <div><strong>Time:</strong> {formatTime(slot.startTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySlotCard;
