'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag, TAG_COLORS } from '@/lib/types';
import TagPill from '@/components/TagPill';
import { authFetch } from '@/lib/auth-fetch';

interface TagManagerProps {
  applicationId: string;
  appliedTags: Tag[];
  allTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onAllTagsChange: (tags: Tag[]) => void;
}

export default function TagManager({
  applicationId,
  appliedTags,
  allTags,
  onTagsChange,
  onAllTagsChange,
}: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const appliedIds = new Set(appliedTags.map(t => t.id));

  const filtered = allTags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) && !appliedIds.has(t.id)
  );

  const addTag = async (tag: Tag) => {
    onTagsChange([...appliedTags, tag]);
    await authFetch(`/api/applications/${applicationId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_id: tag.id }),
    });
  };

  const removeTag = async (tag: Tag) => {
    onTagsChange(appliedTags.filter(t => t.id !== tag.id));
    await authFetch(`/api/applications/${applicationId}/tags`, {
      method: 'DELETE',
      body: JSON.stringify({ tag_id: tag.id }),
    });
  };

  const createTag = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const data = await res.json();
      if (res.ok && data.tag) {
        onAllTagsChange([...allTags, data.tag]);
        await addTag(data.tag);
        setNewName('');
        setNewColor(TAG_COLORS[0]);
        setCreating(false);
        setSearch('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Applied tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 28 }}>
        {appliedTags.map(tag => (
          <TagPill key={tag.id} tag={tag} onRemove={() => removeTag(tag)} />
        ))}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 22,
            padding: '0 8px',
            borderRadius: 99,
            border: '1px dashed var(--border-gray)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--muted-text)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-blue)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-gray)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-text)'; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add tag
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 100,
          marginTop: 6,
          width: 240,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {!creating ? (
            <>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-gray)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tags…"
                  style={{
                    width: '100%',
                    height: 28,
                    padding: '0 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border-gray)',
                    background: 'var(--surface-gray)',
                    fontSize: 12,
                    color: 'var(--body-text)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {filtered.length === 0 && !search && (
                  <p style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted-text)' }}>No more tags to add.</p>
                )}
                {filtered.length === 0 && search && (
                  <p style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted-text)' }}>No match — create it below.</p>
                )}
                {filtered.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => { addTag(tag); setSearch(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '7px 12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--brand-navy)' }}>{tag.name}</span>
                  </button>
                ))}
              </div>
              <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-gray)' }}>
                <button
                  onClick={() => { setCreating(true); setNewName(search); setSearch(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--accent-blue)',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Create new tag
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>New tag</p>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="Tag name"
                style={{
                  width: '100%',
                  height: 30,
                  padding: '0 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-gray)',
                  background: 'var(--surface-gray)',
                  fontSize: 12,
                  color: 'var(--body-text)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                {TAG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: c,
                      border: newColor === c ? '2px solid var(--brand-navy)' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      outline: newColor === c ? '2px solid var(--card-bg)' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={createTag}
                  disabled={!newName.trim() || saving}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: (!newName.trim() || saving) ? 0.5 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {saving ? 'Creating…' : 'Create'}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-gray)',
                    background: 'var(--surface-gray)',
                    color: 'var(--muted-text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
