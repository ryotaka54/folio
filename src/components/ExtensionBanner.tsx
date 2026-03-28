'use client';

import { useExtensionStatus } from '@/lib/extension-status-context';
import { useAuth } from '@/lib/auth-context';
import { useTutorial } from '@/lib/tutorial-context';

const EXTENSION_URL = 'https://chromewebstore.google.com/detail/applyd';

export default function ExtensionBanner() {
  const { isInstalled, isDismissed, mounted, markDismissed, isBannerEligible } = useExtensionStatus();
  const { user } = useAuth();
  const { isActive } = useTutorial();

  const show = mounted && !isInstalled && !isDismissed && isBannerEligible(user?.created_at) && !isActive;

  if (!show) return null;

  const handleInstall = () => {
    window.open(EXTENSION_URL, '_blank', 'noopener,noreferrer');
    markDismissed();
  };

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
        justifyContent: 'space-between',
        gap: 8,
        padding: '0 12px',
        maxHeight: 44,
        height: 44,
        animation: 'ext-banner-slide-in 300ms ease both',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Left icon */}
      <span style={{ fontSize: 15, flexShrink: 0 }}>⚡</span>

      {/* Center message */}
      <span style={{ flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span className="hidden sm:inline">
          Log applications instantly from any job board — get the free Applyd extension
        </span>
        <span className="sm:hidden">
          Log apps in one click — get the extension
        </span>
      </span>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            height: 26,
            padding: '0 10px',
            borderRadius: 5,
            background: '#fff',
            border: 'none',
            color: 'var(--accent-blue)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Install
        </button>
        <button
          onClick={markDismissed}
          aria-label="Dismiss extension banner"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
