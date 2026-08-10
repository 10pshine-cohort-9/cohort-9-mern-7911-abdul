import React, { useState, useEffect, useCallback } from 'react';
import { api, type NoteItem, type UserResponse } from '../utils/api';
import { useToast } from './Toast';

interface DashboardProps {
  user: UserResponse;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { showToast } = useToast();

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotes();
      if (res.success && res.notes) {
        setNotes(res.notes);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch notes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleLogoutClick = async () => {
    try {
      await api.logout();
      showToast('Logged out successfully', 'success');
      onLogout();
    } catch (err: any) {
      showToast(err.message || 'Failed to logout', 'error');
      onLogout();
    }
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
      {/* Header */}
      <header className="dashboard-header" style={{ position: 'relative' }}>
        <div className="brand-section">
          <div className="brand-logo">
            <span>📝</span> Notes Hub
          </div>
        </div>

        {/* Profile Dropdown Action */}
        <div style={{ position: 'relative' }}>
          <button
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
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
                👤 User Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <div>Name: <b>{user.name}</b></div>
                <div>Email: <b>{user.email}</b></div>
                <div>Registered: <b>{formatDate(user.createdAt)}</b></div>
              </div>
              <button className="btn btn-danger" onClick={handleLogoutClick} style={{ width: '100%', padding: '8px 16px', fontSize: '13px' }}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main style={{ padding: '32px 40px', flex: 1, backgroundColor: 'var(--bg-app)' }}>
        
        {/* Notes list */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🗒️ My Notes 
            <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ({notes.length} total)
            </span>
          </h2>

          {isLoading && notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state" style={{ margin: '20px 0', maxWidth: 'none' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗒️</div>
              <h3>No notes found</h3>
              <p>No notes found in your library.</p>
            </div>
          ) : (
            <div className="notes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {notes.map((note) => (
                <div key={note._id} className="note-card" style={{ minHeight: '160px' }}>
                  <div className="note-card-header">
                    <h4 className="note-card-title">{note.title}</h4>
                    {note.isPinned && (
                      <span style={{ fontSize: '14px' }} title="Pinned note">
                        📌
                      </span>
                    )}
                  </div>

                  <div className="card-tags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {note.tags && note.tags.map((tag) => (
                      <span key={tag} className="tag-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="note-card-body" style={{ fontSize: '13px', WebkitLineClamp: 5, marginBottom: '12px' }}>
                    {note.content}
                  </div>

                  <div className="note-card-footer">
                    <span className="note-date">{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
