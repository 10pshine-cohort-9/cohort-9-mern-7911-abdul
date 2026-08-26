import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api, type NoteItem, type UserResponse } from '../utils/api';
import { useToast } from './Toast';
import { NoteEditor } from './NoteEditor';
import DOMPurify from 'dompurify';

interface DashboardProps {
  user: UserResponse;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinned, setFilterPinned] = useState<boolean | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotes({
        search: searchQuery || undefined,
        isPinned: filterPinned,
      });
      if (res.success && res.notes) {
        setNotes(res.notes);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notes';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, searchQuery, filterPinned]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filterPinned, fetchNotes]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      if (note.tags) {
        note.tags.forEach((tag) => {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag) {
            counts[cleanTag] = (counts[cleanTag] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [notes]);

  const allTags = useMemo(() => {
    return Object.keys(tagCounts).sort((a, b) => a.localeCompare(b));
  }, [tagCounts]);

  const displayedNotes = useMemo(() => {
    let filtered = notes;
    if (selectedTag) {
      filtered = notes.filter(
        (note) =>
          note.tags &&
          note.tags.some((t) => t.trim().toLowerCase() === selectedTag.toLowerCase())
      );
    }
    return filtered;
  }, [notes, selectedTag]);

  const handleLogoutClick = async () => {
    try {
      await api.logout();
      showToast('Logged out successfully', 'success');
      onLogout();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to logout';
      showToast(message, 'error');
      onLogout();
    }
  };

  const handleCreateNote = async (title: string, content: string, tags: string[], isPinned: boolean) => {
    try {
      const res = await api.createNote({ title, content, tags, isPinned });
      if (!res.success) {
        throw new Error(res.message || 'Failed to create note');
      }
      showToast('Note created successfully', 'success');
      fetchNotes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleUpdateNote = async (title: string, content: string, tags: string[], isPinned: boolean) => {
    if (!editingNote) return;
    try {
      const res = await api.updateNote(editingNote._id, { title, content, tags, isPinned });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update note');
      }
      showToast('Note updated successfully', 'success');
      fetchNotes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    try {
      const res = await api.updateNote(note._id, { isPinned: !note.isPinned });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update pin state');
      }
      showToast(note.isPinned ? 'Note unpinned' : 'Note pinned', 'success');
      fetchNotes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update pin state';
      showToast(message, 'error');
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await api.deleteNote(id);
      if (res.success) {
        showToast('Note deleted successfully', 'success');
        fetchNotes();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      showToast(message, 'error');
    }
  };

  const handleExportClick = async () => {
    try {
      showToast('Preparing notes export...', 'info');
      await api.exportNotes();
      showToast('Notes backup downloaded successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export notes';
      showToast(message, 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      let rawNotes: unknown[] = [];
      if (Array.isArray(data)) {
        rawNotes = data;
      } else if (data && typeof data === 'object' && Array.isArray((data as any).notes)) {
        rawNotes = (data as any).notes;
      } else {
        throw new Error('Format must be a JSON array of notes, or { notes: [...] }');
      }

      if (rawNotes.length === 0) {
        showToast('No notes found in the import file.', 'info');
        e.target.value = '';
        return;
      }

      const validatedNotes = rawNotes.filter((item): item is { title: string; content: string; tags?: string[]; isPinned?: boolean } => {
        return (
          item !== null &&
          typeof item === 'object' &&
          'title' in item &&
          typeof (item as any).title === 'string' &&
          (item as any).title.trim().length > 0 &&
          'content' in item &&
          typeof (item as any).content === 'string' &&
          (item as any).content.trim().length > 0
        );
      });

      if (validatedNotes.length === 0) {
        showToast('No valid notes found in the import file.', 'error');
        e.target.value = '';
        return;
      }

      const res = await api.importNotes(validatedNotes);
      if (res.success) {
        showToast(res.message || 'Notes imported successfully', 'success');
        fetchNotes();
      } else {
        showToast(res.message || 'Failed to import notes', 'error');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse import file';
      showToast(message, 'error');
    }
    e.target.value = '';
  };

  const openCreateEditor = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (note: NoteItem) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (nameStr: string) => {
    return nameStr
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="app-container">
      {/* Top Header Bar */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">
            <span>📝</span> Notes Hub
          </div>
          <div className="brand-subtitle">Workspace</div>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportClick}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            📤 Export
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleImportClick}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            📥 Import
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            style={{ display: 'none' }}
            aria-label="Import backup file"
          />

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateEditor}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            ➕ New Note
          </button>

          {/* User initials drop-down toggle */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="user-profile-trigger"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              aria-label="Toggle user details dropdown"
            >
              <div className="avatar">{getInitials(user.name)}</div>
            </button>

            {isDropdownOpen && (
              <div
                className="auth-card"
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: '0',
                  width: '280px',
                  zIndex: 100,
                  padding: '20px',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                  }}
                >
                  👤 User Details
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                    marginBottom: '16px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div>Name: <b>{user.name}</b></div>
                  <div>Email: <b>{user.email}</b></div>
                  <div>Registered: <b>{formatDate(user.createdAt)}</b></div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogoutClick}
                  style={{ width: '100%', padding: '8px 16px', fontSize: '13px' }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content Workspace */}
      <main style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Search & Tabs Controls Card */}
        <section className="controls-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '280px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', fontSize: '16px', color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="text"
                className="form-input"
                placeholder="Search notes by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '16px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px', backgroundColor: 'var(--bg-surface)' }}>
              <button
                type="button"
                onClick={() => setFilterPinned(undefined)}
                className="btn"
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: filterPinned === undefined ? 'var(--bg-card)' : 'transparent',
                  color: filterPinned === undefined ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: filterPinned === undefined ? 'var(--shadow-sm)' : 'none',
                  borderRadius: 'calc(var(--radius-md) - 4px)'
                }}
              >
                All Notes
              </button>
              <button
                type="button"
                onClick={() => setFilterPinned(true)}
                className="btn"
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: filterPinned === true ? 'var(--bg-card)' : 'transparent',
                  color: filterPinned === true ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: filterPinned === true ? 'var(--shadow-sm)' : 'none',
                  borderRadius: 'calc(var(--radius-md) - 4px)'
                }}
              >
                Pinned 📌
              </button>
            </div>
          </div>

          {/* Tags Filtering Section */}
          {allTags.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                🏷️ Filter Tags:
              </span>

              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="tag-badge"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedTag === null ? 'var(--accent)' : 'var(--bg-surface)',
                  color: selectedTag === null ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
              >
                All Tags
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className="tag-badge"
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedTag === tag ? 'var(--accent)' : 'var(--accent-bg)',
                    color: selectedTag === tag ? 'var(--text-on-accent)' : 'var(--accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>#{tag}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>({tagCounts[tag]})</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Note List workspace */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              🗒️ {selectedTag ? `#${selectedTag} Notes` : filterPinned ? 'Pinned Notes' : 'My Notes'}
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                ({displayedNotes.length} shown)
              </span>
            </h2>
          </div>

          {isLoading && notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading notes...</div>
          ) : displayedNotes.length === 0 ? (
            <div className="empty-state" style={{ margin: '20px auto', width: '100%' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗒️</div>
              <h3>No notes found</h3>
              <p>Try clearing your search query or tag filters.</p>
              {(searchQuery || selectedTag || filterPinned !== undefined) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                    setFilterPinned(undefined);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="notes-grid">
              {displayedNotes.map((note) => (
                <div key={note._id} className="note-card" style={{ position: 'relative' }}>
                  {/* Stretched accessibility button to make entire card clickable */}
                  <button
                    type="button"
                    onClick={() => openEditEditor(note)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'none',
                      border: 'none',
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 1,
                      borderRadius: 'var(--radius-md)'
                    }}
                    aria-label={`Open note: ${note.title}`}
                  />

                  {/* Card Header with Title and Pin option */}
                  <div className="note-card-header">
                    <h4 className="note-card-title">{note.title}</h4>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={(e) => handleTogglePin(e, note)}
                      style={{
                        fontSize: '16px',
                        opacity: note.isPinned ? 1 : 0.2,
                        transition: 'opacity var(--transition-fast)',
                        position: 'relative',
                        zIndex: 2
                      }}
                      title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      📌
                    </button>
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="card-tags">
                      {note.tags.map((tag) => (
                        <span key={tag} className="tag-badge">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* HTML note body */}
                  <div
                    className="note-card-body rich-text-body"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
                  />

                  {/* Footer with edit/delete actions */}
                  <div className="note-card-footer">
                    <span className="note-date">Updated {formatDate(note.updatedAt)}</span>
                    <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 2 }}>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEditor(note);
                        }}
                        style={{ fontSize: '13px' }}
                      >
                        Edit
                      </button>
                      <span style={{ color: 'var(--border)' }}>|</span>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={(e) => handleDeleteNote(e, note._id)}
                        style={{ fontSize: '13px', color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Editor Modal component */}
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={editingNote ? handleUpdateNote : handleCreateNote}
        note={editingNote}
      />
    </div>
  );
};

