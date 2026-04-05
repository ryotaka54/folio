'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'applyd_pwa_dismissed';
const DISMISSED_COUNT_KEY = 'applyd_pwa_dismissed_count';
const INSTALLED_KEY = 'applyd_pwa_installed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Don't show if already running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      // Show welcome toast once on first PWA launch
      if (!localStorage.getItem('applyd_pwa_welcomed')) {
        localStorage.setItem('applyd_pwa_welcomed', '1');
        const event = new CustomEvent('applyd:toast', {
          detail: { message: 'Running as desktop app — you\'re all set.' }
        });
        setTimeout(() => document.dispatchEvent(event), 1500);
      }
      return;
    }

    // Desktop only (no touch, width > 768)
    const isDesktop = window.innerWidth > 768 && !window.matchMedia('(pointer: coarse)').matches;
    if (!isDesktop) return;

    // Max 2 dismissals
    const dismissCount = parseInt(localStorage.getItem(DISMISSED_COUNT_KEY) ?? '0', 10);
    if (dismissCount >= 2) return;

    // Respect 7-day cooldown after dismissal
    const lastDismissed = localStorage.getItem(DISMISSED_KEY);
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Already installed
    if (localStorage.getItem(INSTALLED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s delay
      setTimeout(() => setVisible(true), 30_000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || !visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, '1');
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem(DISMISSED_COUNT_KEY) ?? '0', 10);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    localStorage.setItem(DISMISSED_COUNT_KEY, String(count + 1));
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Applyd"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9000,
        width: 320,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-gray)',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        animation: 'pwa-slide-up 300ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Icon */}
        <img
          src="/icons/icon-96.png"
          alt="Applyd"
          width={40}
          height={40}
          style={{ borderRadius: 10, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 3, letterSpacing: '-0.01em' }}>
            Install Applyd
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted-text)', lineHeight: 1.5 }}>
            Open it like a native app — no browser needed.
          </p>
        </div>
        {/* Close */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, flexShrink: 0, lineHeight: 1 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1, height: 34, background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1D4ED8')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563EB')}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            height: 34, padding: '0 14px', background: 'var(--surface-gray)',
            border: '1px solid var(--border-gray)', borderRadius: 8,
            fontSize: 12, fontWeight: 500, color: 'var(--muted-text)',
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
