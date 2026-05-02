'use client';

import { Tag } from '@/lib/types';

interface TagPillProps {
  tag: Tag;
  onRemove?: () => void;
  small?: boolean;
}

export default function TagPill({ tag, onRemove, small }: TagPillProps) {
  const size = small ? { fontSize: 10, padding: '1px 6px' } : { fontSize: 11, padding: '2px 8px' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 99,
        fontWeight: 500,
        lineHeight: 1,
        background: `${tag.color}22`,
        border: `1px solid ${tag.color}55`,
        color: tag.color,
        whiteSpace: 'nowrap',
        ...size,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${tag.name}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: tag.color,
            padding: 0,
            opacity: 0.7,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </span>
  );
}
