'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  onOpen: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, onOpen, onDelete, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside mousedown or Escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Use capture so it fires before any onClick that might re-open
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so menu stays within viewport
  const MENU_W = 160;
  const MENU_H = 82; // approximate height (2 items)
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.min(x, vw - MENU_W - 8);
  const top = Math.min(y, vh - MENU_H - 8);

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        minWidth: MENU_W,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-emphasis)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        padding: '4px 0',
      }}
    >
      {/* Open */}
      <button
        onMouseDown={e => { e.stopPropagation(); onOpen(); onClose(); }}
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
          fontSize: 13,
          color: 'var(--brand-navy)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-gray)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-gray)', margin: '2px 0' }} />

      {/* Delete */}
      <button
        onMouseDown={e => { e.stopPropagation(); onDelete(); onClose(); }}
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
          fontSize: 13,
          color: 'var(--error-text)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        Delete
      </button>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(menu, document.body);
}
