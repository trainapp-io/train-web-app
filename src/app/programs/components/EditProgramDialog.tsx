import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { ProgramRequest, ProfileAccess } from '@trainapp-io/train-core';
import './EditProgramDialog.css';

interface EditProgramDialogProps {
  isOpen: boolean;
  programData: ProgramRequest | null;
  imageUrl?: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (programData: ProgramRequest) => void;
}

const EditProgramDialog: React.FC<EditProgramDialogProps> = ({
  isOpen,
  programData: initialProgramData,
  imageUrl,
  isSaving,
  onClose,
  onSave,
}) => {
  const [programData, setProgramData] = useState<ProgramRequest | null>(initialProgramData);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [typesInput, setTypesInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when props change
  useEffect(() => {
    setProgramData(initialProgramData);
    setImagePreview(imageUrl || '');
    setTypesInput(initialProgramData?.types?.join(', ') || '');
  }, [initialProgramData, imageUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (programData) {
      // Parse types from comma-separated string
      const types = typesInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      onSave({
        ...programData,
        types: types.length > 0 ? types : undefined,
      });
    }
  };

  const handleClose = () => {
    setImagePreview('');
    onClose();
  };

  if (!isOpen || !programData) return null;

  return (
    <div className="edit-program-dialog-overlay" onClick={handleClose}>
      <div className="edit-program-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="edit-program-dialog-header">
          <h2>Edit Program</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="edit-program-dialog-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="program-name">Name *</label>
              <input
                id="program-name"
                type="text"
                value={programData.name || ''}
                onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                placeholder="Program name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="program-description">Description</label>
              <textarea
                id="program-description"
                value={programData.description || ''}
                onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                placeholder="Program description"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="num-weeks">Number of Weeks *</label>
                <input
                  id="num-weeks"
                  type="number"
                  min="1"
                  value={programData.numWeeks}
                  onChange={(e) => setProgramData({ ...programData, numWeeks: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="access-type">Access Type *</label>
                <select
                  id="access-type"
                  value={programData.accessType}
                  onChange={(e) => setProgramData({ ...programData, accessType: parseInt(e.target.value) as ProfileAccess })}
                  required
                >
                  <option value={ProfileAccess.Public}>Public</option>
                  <option value={ProfileAccess.Private}>Private</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="program-types">Types (comma-separated)</label>
              <input
                id="program-types"
                type="text"
                value={typesInput}
                onChange={(e) => setTypesInput(e.target.value)}
                placeholder="e.g., Strength, Cardio, Flexibility"
              />
              {typesInput && (
                <div className="types-preview">
                  {typesInput.split(',').map((type, idx) => {
                    const trimmedType = type.trim();
                    return trimmedType ? (
                      <span key={idx} className="type-tag">{trimmedType}</span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={programData.hasNutritionProgram || false}
                  onChange={(e) => setProgramData({ ...programData, hasNutritionProgram: e.target.checked })}
                />
                <span>Includes Nutrition Program</span>
              </label>
            </div>

            <div className="form-group">
              <label>Program Image</label>
              <div className="image-upload-section">
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Program preview" className="image-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <FaUpload />
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

            <div className="edit-program-dialog-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProgramDialog;

