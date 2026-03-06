import React, { useState, useRef, useEffect } from 'react';
import { LuX, LuUpload } from 'react-icons/lu';
import { WeekRequest } from '@trainapp-io/train-core';
import Button from '../../../components/ui/Button';
import './EditWeekDialog.css';

interface EditWeekDialogProps {
  isOpen: boolean;
  weekData: WeekRequest | null;
  imageUrl?: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (weekData: WeekRequest) => void;
}

const EditWeekDialog: React.FC<EditWeekDialogProps> = ({
  isOpen,
  weekData: initialWeekData,
  imageUrl,
  isSaving,
  onClose,
  onSave,
}) => {
  const [weekData, setWeekData] = useState<WeekRequest | null>(initialWeekData);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when props change and auto-populate end date
  useEffect(() => {
    if (initialWeekData) {
      // If there's a start date, automatically set end date to 7 days later
      if (initialWeekData.startDate) {
        const startDate = initialWeekData.startDate instanceof Date 
          ? initialWeekData.startDate 
          : new Date(initialWeekData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        setWeekData({
          ...initialWeekData,
          endDate: endDate
        });
      } else {
        setWeekData(initialWeekData);
      }
    }
    setImagePreview(imageUrl || '');
  }, [initialWeekData, imageUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    // setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weekData) {
      onSave(weekData);
    }
  };

  const handleClose = () => {
    // setImageFile(null);
    setImagePreview('');
    onClose();
  };

  if (!isOpen || !weekData) return null;

  return (
    <div className="edit-week-dialog-overlay" onClick={handleClose}>
      <div className="edit-week-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="edit-week-dialog-header">
          <h2>Edit Week</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            <LuX />
          </button>
        </div>

        <div className="edit-week-dialog-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="week-name">Name</label>
              <input
                id="week-name"
                type="text"
                value={weekData.name || ''}
                onChange={(e) => setWeekData({ ...weekData, name: e.target.value })}
                placeholder="Week name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="week-description">Description</label>
              <textarea
                id="week-description"
                value={weekData.description || ''}
                onChange={(e) => setWeekData({ ...weekData, description: e.target.value })}
                placeholder="Week description"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="week-number">Week Number</label>
                <input
                  id="week-number"
                  type="number"
                  min="1"
                  value={weekData.weekNumber}
                  onChange={(e) => setWeekData({ ...weekData, weekNumber: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-date">Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={weekData.startDate instanceof Date ? weekData.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newStartDate = new Date(e.target.value);
                    // Auto-populate end date to 6 days after start date (7 days total, inclusive)
                    const newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newEndDate.getDate() + 6);
                    setWeekData({ 
                      ...weekData, 
                      startDate: newStartDate,
                      endDate: newEndDate
                    });
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end-date">End Date</label>
                <input
                  id="end-date"
                  type="date"
                  value={weekData.endDate instanceof Date ? weekData.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setWeekData({ ...weekData, endDate: new Date(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Week Image</label>
              <div className="image-upload-section">
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Week preview" className="image-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      <LuX />
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <LuUpload />
                    <p>Click to upload image</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                {imagePreview && (
                  <button
                    type="button"
                    className="change-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Image
                  </button>
                )}
              </div>
            </div>

            <div className="edit-week-dialog-actions">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditWeekDialog;
