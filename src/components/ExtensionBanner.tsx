'use client';

import { useState, useEffect } from 'react';
import { useTutorial } from '@/lib/tutorial-context';

// TODO: Replace with real Chrome Web Store URL when extension is published
const EXTENSION_URL = 'https://chromewebstore.google.com/detail/applyd';

const DISMISSED_KEY = 'applyd_extension_banner_dismissed';
const INSTALLED_KEY = 'applyd_extension_installed';

export default function ExtensionBanner() {
  const { isActive } = useTutorial();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash
  const [extensionActive, setExtensionActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    setExtensionActive(localStorage.getItem(INSTALLED_KEY) === 'true');
  }, []);

  // Listen for extension presence signal
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'APPLYD_EXTENSION_ACTIVE') {
        setExtensionActive(true);
        localStorage.setItem(INSTALLED_KEY, 'true');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  // Hide while the tour is running; show the moment it ends (skip or complete)
  if (!mounted || dismissed || extensionActive || isActive) return null;

  return (
    <div
      role="banner"
      aria-label="Install the Applyd browser extension"
      style={{
        background: 'var(--accent-blue)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 16px',
        flexWrap: 'wrap',
      }}
    >
      <span>
        Log applications 10x faster — install the free Applyd extension
      </span>
      <a
        href={EXTENSION_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          height: 26,
          padding: '0 12px',
          borderRadius: 5,
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        Install now
      </a>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss extension banner"
        style={{
          marginLeft: 4,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
