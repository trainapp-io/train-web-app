import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteItem from '../NoteItem';
import type { Note } from '../../../types/crm.types';

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'n1',
  clientId: 'c1',
  noteText: 'This is a test note.',
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: null,
  ...overrides,
});

describe('NoteItem', () => {
  it('renders note text', () => {
    render(<NoteItem note={makeNote()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('This is a test note.')).toBeInTheDocument();
  });

  it('renders formatted creation date', () => {
    render(<NoteItem note={makeNote()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // Date should appear in some human-readable form
    expect(screen.getByText(/jun/i)).toBeInTheDocument();
  });

  it('does not show edited indicator when updatedAt is null', () => {
    render(<NoteItem note={makeNote({ updatedAt: null })} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
  });

  it('shows edited indicator when updatedAt is set', () => {
    render(
      <NoteItem
        note={makeNote({ updatedAt: '2024-06-16T10:00:00Z' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });

  it('calls onEdit with note when edit button is clicked', () => {
    const note = makeNote();
    const onEdit = vi.fn();
    render(<NoteItem note={note} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit note/i }));
    expect(onEdit).toHaveBeenCalledWith(note);
  });

  it('calls onDelete with noteId when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<NoteItem note={makeNote({ id: 'n42' })} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete note/i }));
    expect(onDelete).toHaveBeenCalledWith('n42');
  });
});
