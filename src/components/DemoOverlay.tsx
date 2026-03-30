'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { subscribe, activate, togglePause, restart, type DemoState } from '@/lib/demoSequence';

const INITIAL_STATE: DemoState = {
  active: false,
  paused: false,
  cursorX: 0,
  cursorY: 0,
  cursorVisible: false,
  showEndSlate: false,
};

export default function DemoOverlay() {
  const [mounted, setMounted] = useState(false);
  const [demo, setDemo] = useState<DemoState>(INITIAL_STATE);

  useEffect(() => {
    setMounted(true);
    return subscribe(setDemo);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.shiftKey) return;
    if (e.key === 'D') { e.preventDefault(); activate(); }
    else if (e.key === 'S') { e.preventDefault(); togglePause(); }
    else if (e.key === 'R') { e.preventDefault(); restart(); }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!mounted || !demo.active) return null;

  return createPortal(
    <>
      {/* Animated cursor dot */}
      {demo.cursorVisible && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#3B82F6',
            pointerEvents: 'none',
            zIndex: 99999,
            transform: `translate(${demo.cursorX - 6}px, ${demo.cursorY - 6}px)`,
            transition: 'transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.25)',
          }}
        />
      )}


      {/* End slate */}
      {demo.showEndSlate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 99997,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-geist, system-ui, sans-serif)',
            }}
          >
            Applyd
          </div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: 14,
              fontFamily: 'var(--font-geist, system-ui, sans-serif)',
            }}
          >
            Track every application
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
