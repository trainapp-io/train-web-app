import React, { useState, useEffect } from 'react';
import { LuX } from 'react-icons/lu';
import Button from '../../../../components/ui/Button';
import './NoteForm.css';

interface NoteFormProps {
  open: boolean;
  title?: string;
  initialText?: string;
  isSaving: boolean;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

const MAX_LENGTH = 5000;

const NoteForm: React.FC<NoteFormProps> = ({
  open,
  title = 'Add Note',
  initialText = '',
  isSaving,
  onSubmit,
  onClose,
}) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const isSubmitDisabled = !text.trim() || text.trim() === initialText.trim() || isSaving;

  return (
    <div className="note-form-overlay" onClick={onClose}>
      <div
        className="note-form-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="note-form-header">
          <h2 className="note-form-title">{title}</h2>
          <button className="note-form-close" onClick={onClose} aria-label="Close dialog">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="note-form-body">
          <div className="note-form-field">
            <textarea
              className="note-form-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your note here…"
              maxLength={MAX_LENGTH}
              rows={6}
              disabled={isSaving}
              aria-label="Note text"
            />
            <span className="note-form-char-count" aria-live="polite">
              {text.length} / {MAX_LENGTH}
            </span>
          </div>

          <div className="note-form-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={isSubmitDisabled}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;
