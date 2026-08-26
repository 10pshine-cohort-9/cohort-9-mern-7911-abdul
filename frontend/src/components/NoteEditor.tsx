import React, { useState, useEffect } from 'react';
import { type NoteItem } from '../utils/api';
import { QuillEditor } from './QuillEditor';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, tags: string[], isPinned: boolean) => Promise<void>;
  note: NoteItem | null;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ isOpen, onClose, onSave, note }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setIsPinned(note.isPinned || false);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setIsPinned(false);
    }
    setTagInput('');
  }, [note, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const strippedContent = content.replace(/<[^>]*>/g, '').trim();
    if (!strippedContent) return;

    setIsSaving(true);
    try {
      await onSave(title.trim(), content, tags, isPinned);
      onClose();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      {/* Invisible full-screen close button for keyboard/click accessibility */}
      <button 
        type="button" 
        onClick={onClose} 
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
          cursor: 'default',
          zIndex: 0 
        }} 
        aria-label="Close modal"
        disabled={isSaving}
      />
      <div className="modal-content auth-card" style={{ position: 'relative', maxWidth: '640px', width: '90%', padding: '32px', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            {note ? '✏️ Edit Note' : '➕ Create New Note'}
          </h2>

          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`btn-text`}
            style={{
              fontSize: '20px',
              opacity: isPinned ? 1 : 0.4,
              transition: 'opacity var(--transition-fast)',
              padding: '4px'
            }}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            📌
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="note-title-input">
              Note Title
            </label>
            <input
              id="note-title-input"
              type="text"
              className="form-input"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              required
              autoFocus
            />
          </div>

          {/* Quill Rich Text Editor */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Content
            </label>
            <div className="rich-editor-wrapper">
              <QuillEditor
                value={content}
                onChange={setContent}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="note-tag-input">
              Tags (comma/enter to add)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: tags.length > 0 ? '12px' : 0 }}>
              <input
                id="note-tag-input"
                type="text"
                className="form-input"
                placeholder="e.g. personal, ideas, recipes"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddTag}
                disabled={isSaving || !tagInput.trim()}
                style={{ padding: '0 16px' }}
              >
                Add
              </button>
            </div>

            {/* Display tags */}
            {tags.length > 0 && (
              <div className="card-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 0 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="tag-badge"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSaving}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit',
                        fontSize: '11px',
                        padding: 0,
                        fontWeight: 'bold',
                        opacity: 0.6
                      }}
                      title={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || !title.trim() || !content.replace(/<[^>]*>/g, '').trim()}
            >
              {isSaving ? 'Saving...' : 'Save Note'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
