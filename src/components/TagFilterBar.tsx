'use client';

import { Tag } from '@/lib/types';

interface TagFilterBarProps {
  tags: Tag[];
  activeTags: string[];
  onToggle: (tagId: string) => void;
  onClear: () => void;
}

export default function TagFilterBar({ tags, activeTags, onToggle, onClear }: TagFilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '8px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-text)', letterSpacing: '0.05em', marginRight: 2 }}>TAGS</span>
      {tags.map(tag => {
        const active = activeTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              height: 26,
              padding: '0 10px',
              borderRadius: 99,
              border: `1px solid ${active ? tag.color : tag.color + '55'}`,
              background: active ? `${tag.color}22` : 'transparent',
              color: tag.color,
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.12s',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
            {tag.name}
          </button>
        );
      })}
      {activeTags.length > 0 && (
        <button
          onClick={onClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 26,
            padding: '0 8px',
            borderRadius: 99,
            border: '1px solid var(--border-gray)',
            background: 'transparent',
            color: 'var(--muted-text)',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear
        </button>
      )}
    </div>
  );
}
