'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

type OS = 'mac' | 'windows' | 'other';
type Browser = 'chrome' | 'edge' | 'safari' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Mac/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'windows';
  return 'other';
}

function detectBrowser(): Browser {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'safari';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

// ── Step illustrations ─────────────────────────────────────────────────────────

function AddressBarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="4" rx="1"/>
      <path d="M12 12v6M9 15l3 3 3-3"/>
      <rect x="2" y="9" width="20" height="12" rx="1"/>
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Platform-specific steps ────────────────────────────────────────────────────

const STEPS: Record<string, { icon: React.ReactNode; title: string; desc: string }[]> = {
  chrome_mac: [
    { icon: <AddressBarIcon />, title: 'Look for the install icon', desc: 'In your Chrome address bar, click the install icon (⊕ or a computer icon with a down arrow) on the right side.' },
    { icon: <InstallIcon />,   title: 'Click "Install Applyd"', desc: 'A dialog will appear. Click "Install" — Applyd will download and open immediately as its own app window.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>, title: 'Find it in your Dock', desc: 'Applyd appears in your Mac Dock. Right-click → Options → Keep in Dock to pin it permanently.' },
  ],
  edge_windows: [
    { icon: <AddressBarIcon />, title: 'Look for the install icon', desc: 'In your Edge address bar, click the app install icon (a + inside a box) on the right side of the bar.' },
    { icon: <InstallIcon />,   title: 'Click "Install"', desc: 'Edge will show a clean install dialog. Click Install — Applyd opens as a standalone desktop app with no browser chrome.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, title: 'Pin to your Taskbar', desc: 'Right-click the Applyd icon in your taskbar → "Pin to taskbar" so it\'s always one click away.' },
  ],
  chrome_windows: [
    { icon: <AddressBarIcon />, title: 'Look for the install icon', desc: 'In your Chrome address bar, find the install icon (computer with a down arrow) on the right side.' },
    { icon: <InstallIcon />,   title: 'Click "Install Applyd"', desc: 'Chrome shows an install dialog. Click Install and Applyd opens as its own window — no browser needed.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, title: 'Pin to your Taskbar', desc: 'Right-click the Applyd icon in your taskbar → "Pin to taskbar" for instant access.' },
  ],
  default: [
    { icon: <AddressBarIcon />, title: 'Open in Chrome or Edge', desc: 'For the best install experience, open useapplyd.com in Google Chrome (Mac or Windows) or Microsoft Edge (Windows).' },
    { icon: <InstallIcon />,   title: 'Click the install icon', desc: 'Look for the install icon in the address bar — it looks like a computer with a down arrow or a ⊕ symbol.' },
    { icon: <CheckIcon />,     title: 'Launch and pin', desc: 'After installing, Applyd opens as a standalone desktop app. Pin it to your Dock or Taskbar for quick access.' },
  ],
};

const BENEFITS = [
  { label: 'No browser chrome', desc: 'No tabs, no address bar. Just Applyd.' },
  { label: 'Works like a native app', desc: 'Opens from your Dock or Taskbar with a single click.' },
  { label: 'Deadline notifications', desc: 'Get notified on your desktop before deadlines hit.' },
  { label: 'App badge count', desc: 'See upcoming deadlines in your Dock/Taskbar badge.' },
  { label: 'Offline access', desc: 'Your data loads even on a spotty connection.' },
  { label: 'Always up to date', desc: 'No App Store updates — always the latest version.' },
];

export default function InstallPage() {
  const [os, setOs] = useState<OS>('other');
  const [browser, setBrowser] = useState<Browser>('other');
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setOs(detectOS());
    setBrowser(detectBrowser());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const stepsKey =
    browser === 'chrome' && os === 'mac' ? 'chrome_mac' :
    browser === 'edge'   && os === 'windows' ? 'edge_windows' :
    browser === 'chrome' && os === 'windows' ? 'chrome_windows' : 'default';

  const steps = STEPS[stepsKey];

  const platformLabel =
    os === 'mac' ? 'macOS' :
    os === 'windows' ? 'Windows' : 'desktop';

  const browserLabel =
    browser === 'chrome' ? 'Chrome' :
    browser === 'edge'   ? 'Edge'   : 'your browser';

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[960px] mx-auto px-6 flex items-center h-[52px] gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <span className="text-[13px]" style={{ color: 'var(--border-gray)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--muted-text)' }}>Get the app</span>
          <div className="ml-auto">
            <Link href="/dashboard" className="text-[12px] font-medium" style={{ color: 'var(--muted-text)' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[860px] mx-auto px-6 py-16">

        {/* Installed state */}
        {installed ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <CheckIcon />
            </div>
            <h1 className="text-[28px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              You&apos;re running the desktop app
            </h1>
            <p className="text-[15px] mb-8" style={{ color: 'var(--muted-text)' }}>
              Applyd is already installed on this device. You&apos;re good to go.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium text-white transition-colors"
              style={{ background: 'var(--accent-blue)' }}
            >
              Open Dashboard →
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-14">
              <div
                className="w-20 h-20 rounded-[22px] mx-auto mb-6 flex items-center justify-center shadow-xl"
                style={{ background: '#2563EB' }}
              >
                <img src="/icons/icon-96.png" alt="Applyd" width={64} height={64} style={{ borderRadius: 14 }} />
              </div>
              <h1 className="text-[36px] font-semibold mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}>
                Applyd for {platformLabel}
              </h1>
              <p className="text-[16px] max-w-md mx-auto" style={{ color: 'var(--muted-text)', lineHeight: 1.6 }}>
                Install Applyd as a desktop app. It opens from your {os === 'mac' ? 'Dock' : 'Taskbar'} like any native app — no browser required.
              </p>

              {/* Primary CTA */}
              {deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all"
                  style={{ background: '#2563EB', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1D4ED8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563EB')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {installing ? 'Installing…' : `Install Applyd for ${platformLabel}`}
                </button>
              ) : (
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border" style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)', background: 'var(--surface-gray)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Look for the install icon in your {browserLabel} address bar
                </div>
              )}
            </div>

            {/* Step-by-step guide */}
            <div className="mb-16">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] mb-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
                How to install · {browserLabel} on {platformLabel}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-5 border"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                        style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)' }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-blue)' }}>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Not on Chrome/Edge? */}
            {browser !== 'chrome' && browser !== 'edge' && (
              <div
                className="rounded-xl p-5 border mb-12 flex items-start gap-4"
                style={{ background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.2)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber-warning)', flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--amber-warning)' }}>Safari doesn&apos;t support this install method</p>
                  <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
                    For the best desktop install experience, open <strong>useapplyd.com</strong> in{' '}
                    <a href="https://www.google.com/chrome" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>Google Chrome</a>{' '}
                    or{' '}
                    <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>Microsoft Edge</a>.
                  </p>
                </div>
              </div>
            )}

            {/* Benefits grid */}
            <div>
              <h2 className="text-[22px] font-semibold mb-8 text-center" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
                Why install the app?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {BENEFITS.map(b => (
                  <div
                    key={b.label}
                    className="flex items-start gap-3 p-4 rounded-xl border"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(22,163,74,0.12)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--brand-navy)' }}>{b.label}</p>
                      <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
