'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Inline SVG icons — no lucide dependency so bundle stays small for this nav component
function PipelineIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-blue)' : 'var(--text-tertiary)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="13" rx="1" />
      <rect x="17" y="3" width="4" height="9" rx="1" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-blue)' : 'var(--text-tertiary)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-blue)' : 'var(--text-tertiary)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Pages where the bottom nav should be visible
const EN_PATHS = ['/dashboard', '/calendar', '/community', '/settings'];
const JA_PATHS = ['/ja/dashboard', '/ja/calendar', '/ja/settings'];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isJa = pathname.startsWith('/ja/');
  const isVisible = isJa
    ? JA_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
    : EN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!isVisible) return null;

  const dashPath = isJa ? '/ja/dashboard' : '/dashboard';
  const settingsPath = '/settings';

  const handleAdd = () => {
    if (pathname === dashPath) {
      // Japanese dashboard listens on window; English on document
      const target = isJa ? window : document;
      target.dispatchEvent(new CustomEvent('applyd:add'));
    } else {
      router.push(dashPath);
    }
  };

  const tabs = isJa
    ? [
        { href: '/ja/dashboard', label: 'パイプライン', icon: (active: boolean) => <PipelineIcon active={active} /> },
        { href: '/calendar', label: 'カレンダー', icon: (active: boolean) => <CalendarIcon active={active} /> },
      ]
    : [
        { href: '/dashboard', label: 'Pipeline', icon: (active: boolean) => <PipelineIcon active={active} /> },
        { href: '/calendar', label: 'Calendar', icon: (active: boolean) => <CalendarIcon active={active} /> },
      ];

  const addLabel = isJa ? '追加' : 'Add';
  const profileLabel = isJa ? '設定' : 'Profile';

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border-gray)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center h-16 px-2">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 tap-compact min-h-0"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: active ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Add button — elevated center */}
        <div className="flex-1 flex flex-col items-center justify-center tap-compact min-h-0">
          <button
            onClick={handleAdd}
            aria-label={addLabel}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-5 tap-compact min-h-0"
            style={{ background: 'var(--accent-blue)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="text-[10px] font-medium mt-1 leading-none" style={{ color: 'var(--text-tertiary)' }}>{addLabel}</span>
        </div>

        {/* Profile/Settings tab */}
        <Link
          href={settingsPath}
          className="flex-1 flex flex-col items-center justify-center gap-1 tap-compact min-h-0"
        >
          <ProfileIcon active={pathname === settingsPath} />
          <span
            className="text-[10px] font-medium leading-none"
            style={{ color: pathname === settingsPath ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
          >
            {profileLabel}
          </span>
        </Link>
      </div>
    </nav>
  );
}
