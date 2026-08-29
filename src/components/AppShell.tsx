'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, LayoutDashboard, Rows3, Calendar as CalendarIcon, Mic, Users, Briefcase, Settings as SettingsIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { localeHref, type Locale } from '@/lib/locale';

export type DashboardView = 'today' | 'pipeline' | 'table';
type ClickableTab = DashboardView | 'calendar';
// 'offers' and 'none' are legal activeTab values that intentionally match
// none of the four primary tabs, so none of them show as active — 'offers'
// on the dashboard's Offers view (it lives in the secondary-links row),
// 'none' on secondary pages (Interview, Contacts, Community, Settings).
export type ActiveTab = ClickableTab | 'offers' | 'none';

interface AppShellProps {
  /** Which of the four primary tabs is current. */
  activeTab: ActiveTab;
  /**
   * Called when the user picks Today/Pipeline/Table while already on
   * /dashboard — an in-page view switch, no navigation. Omit on pages
   * (like /calendar) that aren't /dashboard; clicking those tabs there
   * navigates to /dashboard?view=... instead.
   */
  onViewChange?: (view: DashboardView) => void;
  userIsPro: boolean;
  onUpgrade: () => void;
  onLogout: () => void;
  /** Page-specific extras (NotificationBell, StreakBadge) rendered before the theme toggle. */
  rightSlot?: React.ReactNode;
  /** Small badge count shown on the "Offers" secondary link, e.g. active offer count. */
  offerCount?: number;
  /**
   * Called instead of navigating when Offers is clicked while already on
   * /dashboard (query-string-only navigation on the same route wouldn't be
   * picked up by a one-time mount effect). Omit on other pages, where
   * Offers correctly navigates to /dashboard?view=offers as a real page load.
   */
  onOffersClick?: () => void;
  /**
   * 'ja' for shuukatsu-mode users — this is content-level, not route-level
   * (e.g. /calendar itself renders in Japanese for these users based on a
   * cookie/profile flag, there's no separate /ja/calendar route). Contacts
   * and Settings have no JA-prefixed route and stay locale-agnostic.
   */
  locale?: Locale;
  /** Which secondary link (if any) should show as active — for pages like Interview/Contacts themselves. */
  activeSecondary?: 'interview' | 'contacts';
}

const LABELS: Record<Locale, { today: string; pipeline: string; table: string; calendar: string; interview: string; contacts: string; offers: string; upgrade: string; pro: string; logout: string }> = {
  en: { today: 'Today', pipeline: 'Pipeline', table: 'List', calendar: 'Calendar', interview: 'Interview', contacts: 'Contacts', offers: 'Offers', upgrade: 'Upgrade', pro: 'Pro', logout: 'Log out' },
  ja: { today: '今日', pipeline: 'パイプライン', table: 'リスト', calendar: 'カレンダー', interview: '模擬面接', contacts: 'コンタクト', offers: 'オファー', upgrade: 'アップグレード', pro: 'Pro', logout: 'ログアウト' },
};

function useTabNavigate(onViewChange: AppShellProps['onViewChange'], locale: Locale) {
  const router = useRouter();
  return (k: ClickableTab) => {
    if (k === 'calendar') {
      // No locale-prefixed calendar route exists — it's the same URL for
      // both locales, content-switched via cookie/profile flag.
      router.push('/calendar');
      return;
    }
    if (onViewChange) {
      onViewChange(k);
      return;
    }
    const base = localeHref(locale, '/dashboard');
    router.push(k === 'today' ? base : `${base}?view=${k}`);
  };
}

export default function AppShell({
  activeTab,
  onViewChange,
  userIsPro,
  onUpgrade,
  onLogout,
  rightSlot,
  offerCount = 0,
  onOffersClick,
  locale = 'en',
  activeSecondary,
}: AppShellProps) {
  const navigate = useTabNavigate(onViewChange, locale);
  const t = LABELS[locale];

  const tabs: { k: ClickableTab; label: string; icon: React.ReactNode }[] = [
    { k: 'today', label: t.today, icon: <Home size={13} aria-hidden /> },
    { k: 'pipeline', label: t.pipeline, icon: <LayoutDashboard size={13} aria-hidden /> },
    { k: 'table', label: t.table, icon: <Rows3 size={13} aria-hidden /> },
    { k: 'calendar', label: t.calendar, icon: <CalendarIcon size={13} aria-hidden /> },
  ];

  const secondaryLinks = [
    { key: 'interview', href: localeHref(locale, '/interview'), label: t.interview, icon: <Mic size={13} aria-hidden /> },
    { key: 'contacts', href: '/contacts', label: t.contacts, icon: <Users size={13} aria-hidden /> },
    { key: 'offers', href: `${localeHref(locale, '/dashboard')}?view=offers`, label: t.offers, icon: <Briefcase size={13} aria-hidden />, badge: offerCount >= 2, onClick: onOffersClick },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden border-b border-border bg-bg sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            {userIsPro ? <ProLogo size={22} /> : <Logo size={22} variant="dark" />}
            <span className="font-display text-[14px] font-semibold text-text" style={{ letterSpacing: '-0.01em' }}>Applyd</span>
            {userIsPro && (
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: 'var(--gradient-pro)' }}>
                {t.pro}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rightSlot}
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.k;
            return (
              <button
                key={tab.k}
                onClick={() => navigate(tab.k)}
                className="relative flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 h-7 text-[12px] font-medium transition-colors whitespace-nowrap"
                style={{
                  background: active ? 'var(--bg)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--muted)',
                  borderColor: active ? 'var(--border)' : 'transparent',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.icon}{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:block border-b border-border bg-bg sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-4">
            <Link href={localeHref(locale, '/dashboard')} className="flex items-center gap-2 flex-shrink-0">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="font-display hidden sm:block text-[15px] font-semibold text-text" style={{ letterSpacing: '-0.01em' }}>Applyd</span>
            </Link>

            <Tabs value={activeTab} onValueChange={v => navigate(v as ClickableTab)}>
              <TabsList>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.k} value={tab.k}>
                    {tab.icon}{tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-0.5 border-l border-border pl-4">
              {secondaryLinks.map(l => {
                const active = activeSecondary === l.key;
                return (
                  <Link
                    key={l.key}
                    href={l.href}
                    onClick={l.onClick ? (e) => { e.preventDefault(); l.onClick!(); } : undefined}
                    className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-bg-soft hover:text-text"
                    style={active ? { color: 'var(--accent)', background: 'var(--accent-wash)' } : { color: 'var(--muted)' }}
                  >
                    {l.icon}{l.label}
                    {l.badge && (
                      <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full" style={{ background: 'var(--success)' }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userIsPro ? (
              <span
                className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ background: 'var(--gradient-pro)', letterSpacing: '0.02em' }}
              >
                {t.pro}
              </span>
            ) : (
              <button
                onClick={onUpgrade}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted border-border transition-colors hover:border-accent hover:text-accent"
              >
                {t.upgrade}
              </button>
            )}
            {rightSlot}
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className="rounded-lg border border-transparent p-2 text-muted transition-all hover:bg-bg-soft hover:text-accent"
            >
              <SettingsIcon size={18} aria-hidden />
            </Link>
            <button onClick={onLogout} className="text-xs text-muted transition-colors hover:text-text">
              {t.logout}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
