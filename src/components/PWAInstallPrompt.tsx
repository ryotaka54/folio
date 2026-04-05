'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY   = 'applyd_pwa_dismissed_at';
const DISMISSED_COUNT = 'applyd_pwa_dismissed_n';
const INSTALLED_KEY   = 'applyd_pwa_installed';

function detectOS(): 'mac' | 'windows' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  if (/Mac/.test(navigator.userAgent)) return 'mac';
  if (/Win/.test(navigator.userAgent)) return 'windows';
  return 'other';
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Desktop only
    const isDesktop = window.innerWidth > 768 && !window.matchMedia('(pointer: coarse)').matches;
    if (!isDesktop) return;

    // Already installed
    if (localStorage.getItem(INSTALLED_KEY)) return;

    // Max 2 dismissals
    const n = parseInt(localStorage.getItem(DISMISSED_COUNT) ?? '0', 10);
    if (n >= 2) return;

    // 7-day cooldown
    const last = localStorage.getItem(DISMISSED_KEY);
    if (last && (Date.now() - parseInt(last, 10)) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show after 10s whether or not the prompt is available
    const t = setTimeout(() => setVisible(true), 10_000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(t);
    };
  }, []);

  if (!visible) return null;

  const os = detectOS();
  const osLabel = os === 'mac' ? 'Mac' : os === 'windows' ? 'Windows' : 'your computer';

  const dismiss = () => {
    const n = parseInt(localStorage.getItem(DISMISSED_COUNT) ?? '0', 10);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    localStorage.setItem(DISMISSED_COUNT, String(n + 1));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(INSTALLED_KEY, '1');
    setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Applyd as a desktop app"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9000,
        width: 300,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-gray)',
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        animation: 'pwa-slide-up 280ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <style>{`@keyframes pwa-slide-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img src="/icons/icon-96.png" alt="Applyd" width={36} height={36} style={{ borderRadius: 9, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
            Add Applyd to {osLabel}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 1 }}>
            Opens like a native app — no browser needed
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, lineHeight: 1 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7 }}>
        {deferredPrompt ? (
          <button
            onClick={install}
            style={{
              flex: 1, height: 32, background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Install
          </button>
        ) : (
          <Link
            href="/install"
            onClick={dismiss}
            style={{
              flex: 1, height: 32, background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            How to install
          </Link>
        )}
        <button
          onClick={dismiss}
          style={{
            height: 32, padding: '0 12px', background: 'var(--surface-gray)',
            border: '1px solid var(--border-gray)', borderRadius: 8,
            fontSize: 12, color: 'var(--muted-text)', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
