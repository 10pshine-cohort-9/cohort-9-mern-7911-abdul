import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { api, type NoteItem } from '../../utils/api';
import { ToastProvider } from '../Toast';

jest.mock('../../utils/api', () => ({
  api: {
    getNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockShowToast = jest.fn();
jest.mock('../Toast', () => {
  const original = jest.requireActual('../Toast');
  return {
    ...original,
    useToast: () => ({
      showToast: mockShowToast,
    }),
  };
});

jest.mock('../NoteEditor', () => ({
  NoteEditor: ({ isOpen, onClose, onSave }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-note-editor">
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave('New Note Title', '<p>New Note Content</p>', ['work'], false)}>Save Note</button>
      </div>
    );
  },
}));

describe('Dashboard Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Abdul Hanan',
    email: 'abdul@example.com',
    createdAt: '2026-08-18T00:00:00Z',
  };

  const mockNotes: NoteItem[] = [
    {
      _id: '1',
      title: 'First Note',
      content: '<p>Content of first note</p>',
      tags: ['work'],
      isPinned: false,
      userId: 'user-1',
      createdAt: '2026-08-18T00:00:00Z',
      updatedAt: '2026-08-18T00:00:00Z',
    },
    {
      _id: '2',
      title: 'Pinned Note',
      content: '<p>Content of pinned note</p>',
      tags: ['personal'],
      isPinned: true,
      userId: 'user-1',
      createdAt: '2026-08-18T00:00:00Z',
      updatedAt: '2026-08-18T00:00:00Z',
    },
  ];

  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays notes on load', async () => {
    (api.getNotes as jest.Mock).mockResolvedValueOnce({
      success: true,
      notes: mockNotes,
    });

    render(
      <ToastProvider>
        <Dashboard user={mockUser} onLogout={mockOnLogout} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(api.getNotes).toHaveBeenCalled();
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Pinned Note')).toBeInTheDocument();
    });
  });

  test('opens creation editor when clicking New Note button', async () => {
    (api.getNotes as jest.Mock).mockResolvedValue({
      success: true,
      notes: [],
    });

    render(
      <ToastProvider>
        <Dashboard user={mockUser} onLogout={mockOnLogout} />
      </ToastProvider>
    );

    const newNoteBtn = screen.getByRole('button', { name: /New Note/i });
    fireEvent.click(newNoteBtn);

    expect(screen.getByTestId('mock-note-editor')).toBeInTheDocument();
  });

  test('submits note creation correctly', async () => {
    (api.getNotes as jest.Mock).mockResolvedValue({
      success: true,
      notes: [],
    });
    (api.createNote as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    render(
      <ToastProvider>
        <Dashboard user={mockUser} onLogout={mockOnLogout} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /New Note/i }));

    const saveBtn = screen.getByRole('button', { name: /Save Note/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.createNote).toHaveBeenCalledWith({
        title: 'New Note Title',
        content: '<p>New Note Content</p>',
        tags: ['work'],
        isPinned: false,
      });
      expect(mockShowToast).toHaveBeenCalledWith('Note created successfully', 'success');
    });
  });

  test('deletes a note after confirmation', async () => {
    (api.getNotes as jest.Mock).mockResolvedValue({
      success: true,
      notes: mockNotes,
    });
    (api.deleteNote as jest.Mock).mockResolvedValueOnce({
      success: true,
    });
    jest.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(
      <ToastProvider>
        <Dashboard user={mockUser} onLogout={mockOnLogout} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const deleteBtn = screen.getAllByRole('button', { name: /Delete/i })[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteNote).toHaveBeenCalledWith('1');
      expect(mockShowToast).toHaveBeenCalledWith('Note deleted successfully', 'success');
    });
  });
});
