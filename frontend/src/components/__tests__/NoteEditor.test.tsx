import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteEditor } from '../NoteEditor';
import { type NoteItem } from '../../utils/api';

jest.mock('../QuillEditor', () => ({
  QuillEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="quill-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('NoteEditor Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const mockNote: NoteItem = {
    _id: 'note-123',
    title: 'Original Title',
    content: '<p>Original content</p>',
    tags: ['work', 'important'],
    isPinned: true,
    userId: 'user-1',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <NoteEditor isOpen={false} onClose={mockOnClose} onSave={mockOnSave} note={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders in Create mode with empty fields', () => {
    render(
      <NoteEditor isOpen={true} onClose={mockOnClose} onSave={mockOnSave} note={null} />
    );

    expect(screen.getByRole('heading', { name: /Create New Note/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Note Title/i)).toHaveValue('');
    expect(screen.getByTestId('quill-textarea')).toHaveValue('');
    expect(screen.queryByText(/#work/i)).not.toBeInTheDocument();
  });

  test('renders in Edit mode with populated fields', () => {
    render(
      <NoteEditor isOpen={true} onClose={mockOnClose} onSave={mockOnSave} note={mockNote} />
    );

    expect(screen.getByRole('heading', { name: /Edit Note/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Note Title/i)).toHaveValue('Original Title');
    expect(screen.getByTestId('quill-textarea')).toHaveValue('<p>Original content</p>');
    expect(screen.getByText(/#work/i)).toBeInTheDocument();
    expect(screen.getByText(/#important/i)).toBeInTheDocument();
  });

  test('allows adding and removing tags', () => {
    render(
      <NoteEditor isOpen={true} onClose={mockOnClose} onSave={mockOnSave} note={null} />
    );

    const tagInput = screen.getByLabelText(/Tags/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    // Add tag 'newtag'
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/#newtag/i)).toBeInTheDocument();

    // Remove the tag
    const removeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(removeButton);

    expect(screen.queryByText(/#newtag/i)).not.toBeInTheDocument();
  });

  test('calls onSave on form submission with valid fields', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    render(
      <NoteEditor isOpen={true} onClose={mockOnClose} onSave={mockOnSave} note={null} />
    );

    fireEvent.change(screen.getByLabelText(/Note Title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByTestId('quill-textarea'), { target: { value: '<p>Some content</p>' } });

    // Pin the note
    const pinButton = screen.getByTitle('Pin note');
    fireEvent.click(pinButton);

    const saveButton = screen.getByRole('button', { name: /Save Note/i });
    fireEvent.click(saveButton);

    try {
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Test Title', '<p>Some content</p>', [], true);
        expect(mockOnClose).toHaveBeenCalled();
      });
    } catch (error) {
      throw new Error(`Note save submission waitFor assertion failed: ${error instanceof Error ? error.message : error}`);
    }
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(
      <NoteEditor isOpen={true} onClose={mockOnClose} onSave={mockOnSave} note={null} />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
