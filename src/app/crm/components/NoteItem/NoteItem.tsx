import React from 'react';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import type { Note } from '../../types/crm.types';
import './NoteItem.css';

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete }) => {
  return (
    <div className="note-item">
      <p className="note-item__text">{note.noteText}</p>
      <div className="note-item__footer">
        <span className="note-item__date">
          {formatDate(note.createdAt)}
          {note.updatedAt && <span className="note-item__edited"> (edited)</span>}
        </span>
        <div className="note-item__actions">
          <button
            className="note-item__action-btn"
            onClick={() => onEdit(note)}
            aria-label="Edit note"
          >
            <LuPencil />
          </button>
          <button
            className="note-item__action-btn note-item__action-btn--delete"
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
          >
            <LuTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteItem;
