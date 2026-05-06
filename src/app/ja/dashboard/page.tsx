'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { SHUUKATSU_STAGES } from '@/lib/constants';
import { Application, PipelineStage, Tag } from '@/lib/types';
import { isPro as checkIsPro, FREE_TIER_LIMIT } from '@/lib/pro';
import { CapExceededError } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import { ExtensionStatusProvider } from '@/lib/extension-status-context';
import JaAddApplicationModal from '@/components/ja/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import PipelineView from '@/components/PipelineView';
import TableView from '@/components/TableView';
import MobileCardList from '@/components/MobileCardList';
import UpgradeModal from '@/components/UpgradeModal';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import MobileBottomNav from '@/components/MobileBottomNav';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import TodayView from '@/components/TodayView';
import OfferComparisonPanel from '@/components/OfferComparisonPanel';
import PipelineBar from '@/components/PipelineBar';
import TagFilterBar from '@/components/TagFilterBar';
import NotificationBell from '@/components/NotificationBell';
import StreakBadge from '@/components/StreakBadge';
import { authFetch } from '@/lib/auth-fetch';
import { LayoutDashboard, Home, Calendar, Mic, Users } from 'lucide-react';

const SHUUKATSU_STAGE_LIST = SHUUKATSU_STAGES.map(s => s.id) as PipelineStage[];
const JA_OFFER_STAGES = ['内々定', '内定'];
const INACTIVE_STAGES = ['承諾', '辞退'];

function JaDashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, loading, addApplication, updateApplication, deleteApplication, storeError, clearStoreError, retryLoad } = useStore();
  const router = useRouter();

  const [view, setView] = useState<'today' | 'pipeline' | 'table' | 'offers'>('today');
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PipelineStage | 'all'>('all');
  const [hideInactive, setHideInactive] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagMap, setTagMap] = useState<Record<string, Tag[]>>({});
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userIsPro = checkIsPro(user);

  const offerCount = applications.filter(a => JA_OFFER_STAGES.includes(a.status)).length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!loading && user && !user.onboarding_complete) router.push('/ja/onboarding');
  }, [user, loading, router]);

  // Handle ?view= from nav links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'pipeline' || v === 'table' || v === 'today' || v === 'offers') {
      setView(v);
      window.history.replaceState({}, '', '/ja/dashboard');
    }
  }, []);

  useEffect(() => {
    const handler = () => setShowAddModal(true);
    window.addEventListener('applyd:add', handler);
    return () => window.removeEventListener('applyd:add', handler);
  }, []);

  // Keyboard shortcut: N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowAddModal(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load tags
  useEffect(() => {
    if (!user) return;
    authFetch('/api/tags').then(r => r.json()).then(d => {
      setAllTags(d.tags ?? []);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || applications.length === 0) return;
    authFetch('/api/tags/applications').then(r => r.json()).then(d => {
      const map: Record<string, Tag[]> = {};
      for (const { application_id, tag } of (d.links ?? [])) {
        (map[application_id] ??= []).push(tag);
      }
      setTagMap(map);
    }).catch(() => {});
  }, [user, applications.length]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const displayApplications = useMemo(() => applications, [applications]);

  const inactiveCount = applications.filter(a => INACTIVE_STAGES.includes(a.status)).length;

  const filteredApps = useMemo(() => {
    return displayApplications
      .filter(app => {
        if (hideInactive && INACTIVE_STAGES.includes(app.status)) return false;
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!app.company.toLowerCase().includes(q) && !app.role.toLowerCase().includes(q)) return false;
        }
        if (activeTags.length > 0 && !activeTags.every(tid => (tagMap[app.id] ?? []).some(t => t.id === tid))) return false;
        return true;
      })
      .map(app => ({ ...app, tags: tagMap[app.id] ?? app.tags ?? [] }));
  }, [displayApplications, hideInactive, statusFilter, search, activeTags, tagMap]);

  const handleAddSave = async (data: {
    company: string; role: string; location: string; category: string;
    status: string; deadline: string | null; job_link: string; notes: string;
  }) => {
    try {
      await addApplication({
        ...data,
        status: (data.status || 'エントリー') as PipelineStage,
        category: data.category as Application['category'],
        deadline: data.deadline ?? null,
        recruiter_name: '', recruiter_email: '', interview_steps: [],
      });
      setShowAddModal(false);
      showToast('選考を追加しました');
    } catch (err) {
      if (err instanceof CapExceededError) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
      } else { throw err; }
    }
  };

  const handleCardClick = useCallback((app: Application) => {
    setSelectedApp(app);
    setShowDrawer(true);
  }, []);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates).catch(() => {});
    setSelectedApp(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  }, [updateApplication]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteApplication(id);
    setShowDrawer(false);
    setSelectedApp(null);
    showToast('選考を削除しました');
  }, [deleteApplication, showToast]);

  const handleStatusChange = useCallback(async (id: string, status: PipelineStage) => {
    await updateApplication(id, { status }).catch(() => {});
    showToast(`${status}に移動しました`);
  }, [updateApplication, showToast]);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <Toast
        message={toast}
        onDismiss={() => { setToast(null); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }}
      />

      {storeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {storeError}
          <button onClick={() => { clearStoreError(); retryLoad(); }} className="underline text-sm font-semibold">再試行</button>
          <button onClick={clearStoreError}>✕</button>
        </div>
      )}

      {!userIsPro && !loading && applications.length >= FREE_TIER_LIMIT - 3 && applications.length < FREE_TIER_LIMIT && (
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-3">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <p className="text-[13px]" style={{ color: 'var(--brand-navy)' }}>
              <span className="font-semibold">上限まで残り{FREE_TIER_LIMIT - applications.length}社</span> — Proにアップグレードして無制限に。
            </p>
            <button onClick={() => setShowUpgradeModal(true)} className="text-[12px] font-semibold px-3 py-1 rounded-md text-white flex-shrink-0" style={{ background: 'var(--accent-blue)' }}>
              アップグレード ⚡
            </button>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2">
          {userIsPro ? <ProLogo size={26} /> : <Logo size={26} variant="dark" />}
          <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist), sans-serif' }}>Applyd</span>
          {userIsPro && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>⚡ Pro</span>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:block border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-4">
            <Link href="/ja" className="flex items-center gap-2 flex-shrink-0">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="text-[15px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist), sans-serif' }}>Applyd</span>
            </Link>

            {/* View switcher pill */}
            <div
              className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border-gray overflow-x-auto"
              style={{ background: 'var(--surface-gray)', WebkitOverflowScrolling: 'touch' }}
            >
              {([
                { k: 'today'    as const, label: '今日',         icon: <Home size={12} aria-hidden /> },
                { k: 'pipeline' as const, label: 'パイプライン', icon: <LayoutDashboard size={12} aria-hidden /> },
                { k: 'table'    as const, label: 'リスト',       icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
                { k: 'offers'   as const, label: '内定',         icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/><path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M21 7c0 4.97-4.03 9-9 9S3 11.97 3 7"/></svg> },
              ] as const).map(({ k, label, icon }) => {
                const active = view === k;
                return (
                  <button
                    key={k}
                    onClick={() => setView(k)}
                    className="relative flex items-center gap-1.5 px-2.5 h-7 text-[12px] font-medium rounded-md transition-all flex-shrink-0 whitespace-nowrap"
                    style={{
                      background: active ? 'var(--card-bg)' : 'transparent',
                      color: active ? 'var(--brand-navy)' : 'var(--muted-text)',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border-gray)' : 'none',
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    {icon}{label}
                    {k === 'offers' && offerCount >= 2 && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Page links */}
            <div className="flex items-center gap-0.5 border-l border-border-gray pl-4">
              {[
                { href: '/calendar',     label: 'カレンダー', icon: <Calendar size={13} aria-hidden /> },
                { href: '/ja/interview', label: '模擬面接',   icon: <Mic size={13} aria-hidden /> },
                { href: '/contacts',     label: 'コンタクト', icon: <Users size={13} aria-hidden /> },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-gray)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted-text)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userIsPro ? (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', letterSpacing: '0.02em' }}
              >
                ⚡ Pro
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors hover:border-accent-blue hover:text-accent-blue"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                アップグレード
              </button>
            )}
            {user && <NotificationBell userId={user.id} applications={applications} onOpenApp={handleCardClick} />}
            {applications.length > 0 && <StreakBadge />}
            <LocaleSwitcher />
            <ThemeToggle />
            <Link
              href="/settings"
              className="p-2 rounded-lg border border-transparent text-muted-text hover:text-accent-blue hover:bg-surface-gray transition-all"
              aria-label="設定"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
            <button
              onClick={async () => { await signOut(); router.push('/ja'); }}
              className="text-xs text-muted-text hover:text-body-text transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {view === 'today' ? (
        <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-mobile-nav lg:pb-6">
          <TodayView
            applications={displayApplications}
            userName={user?.name?.split(' ')[0]}
            onOpenApp={handleCardClick}
            locale="ja"
            prepRoute="/ja/interview"
          />
          <footer className="mt-16 pt-6 border-t border-border-gray flex justify-between flex-wrap gap-3">
            <div className="flex gap-5">
              {[
                { href: '/settings',    label: '設定' },
                { href: '/ja/privacy',  label: 'プライバシー' },
                { href: '/ja/terms',    label: '利用規約' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="text-[12px] transition-colors hover:text-brand-navy" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>© {new Date().getFullYear()} Applyd</p>
          </footer>
        </main>
      ) : view === 'offers' ? (
        <OfferComparisonPanel applications={displayApplications} />
      ) : (
        <>
          {/* PipelineBar */}
          {!loading && displayApplications.length > 0 && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <PipelineBar
                applications={displayApplications}
                stages={SHUUKATSU_STAGE_LIST}
                activeStage={statusFilter}
                onStageClick={s => setStatusFilter(s)}
              />
            </div>
          )}

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
              <TagFilterBar
                tags={allTags}
                activeTags={activeTags}
                onToggle={id => setActiveTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])}
                onClear={() => setActiveTags([])}
              />
            </div>
          )}

          {/* Search + controls */}
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex flex-col gap-2">
            <div className="hidden lg:flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="企業名・職種で検索..."
                  className="w-full h-9 pl-9 pr-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-9 px-4 text-[13px] font-medium text-white rounded-md flex items-center gap-1.5 flex-shrink-0 transition-colors"
                style={{ background: 'var(--accent-blue)', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                選考を追加
                <kbd className="hidden lg:inline-flex items-center px-1 rounded text-[10px] ml-0.5" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', fontFamily: 'inherit', lineHeight: '1.6' }}>N</kbd>
              </button>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as PipelineStage | 'all')}
                className="h-9 px-3 bg-background border border-border-gray rounded-md text-[12px] focus:outline-none focus:border-accent-blue transition-colors"
                style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                <option value="all">すべてのステージ</option>
                {SHUUKATSU_STAGE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => setHideInactive(h => !h)}
                className="h-9 px-3 text-[12px] font-medium border rounded-md flex-shrink-0 transition-colors"
                style={hideInactive
                  ? { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }
                  : { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {hideInactive ? `${inactiveCount}件を非表示中` : 'すべて表示'}
              </button>
            </div>

            {isMobile && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="企業名・職種で検索"
                  className="w-full h-11 pl-10 pr-3 bg-background border border-border-gray rounded-xl text-[16px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
                />
              </div>
            )}

            {displayApplications.length > 0 && (
              <p className="text-[11px] text-right" style={{ color: 'var(--text-tertiary)' }}>
                {filteredApps.length === displayApplications.length
                  ? `${displayApplications.length}件`
                  : `${filteredApps.length} / ${displayApplications.length}件を表示中`}
              </p>
            )}
          </div>

          {/* Pipeline/List content */}
          {loading ? (
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex gap-3 overflow-hidden py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 min-w-[160px] rounded-lg border border-border-gray p-3" style={{ background: 'var(--card-bg)' }}>
                  <div className="h-3 w-16 rounded mb-3 animate-pulse" style={{ background: 'var(--surface-gray)' }} />
                  {[...Array(i === 1 ? 3 : i === 0 ? 2 : 1)].map((_, j) => (
                    <div key={j} className="h-16 rounded-md mb-2 animate-pulse" style={{ background: 'var(--surface-gray)' }} />
                  ))}
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center border border-dashed border-border-gray rounded-xl mx-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(37,99,235,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <p className="text-[17px] font-semibold mb-2" style={{ color: 'var(--brand-navy)' }}>まだ選考を追加していません</p>
              <p className="text-[13px] mb-6" style={{ color: 'var(--muted-text)' }}>最初の選考を追加して、就活管理を始めましょう</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[14px] font-medium text-white transition-colors"
                style={{ background: 'var(--accent-blue)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                最初の選考を追加する
              </button>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center">
              <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>一致なし</h3>
              <p className="text-[12px] mb-4" style={{ color: 'var(--muted-text)' }}>フィルターを変えてみてください。</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setHideInactive(true); setActiveTags([]); }}
                className="inline-flex items-center h-8 px-3 text-[12px] font-medium rounded-md border border-border-gray transition-colors hover:bg-surface-gray"
                style={{ color: 'var(--muted-text)' }}
              >
                フィルターをリセット
              </button>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '16px' }}>
              <MobileCardList
                applications={filteredApps}
                stages={SHUUKATSU_STAGE_LIST}
                onCardClick={handleCardClick}
                onStatusChange={(id, status) => handleStatusChange(id, status)}
              />
            </div>
          ) : view === 'pipeline' ? (
            <PipelineView
              applications={filteredApps}
              stages={SHUUKATSU_STAGE_LIST}
              onCardClick={handleCardClick}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
            />
          ) : (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 80px' }}>
              <TableView
                applications={filteredApps}
                selectedIds={new Set()}
                onSelectionChange={() => {}}
                onRowClick={handleCardClick}
              />
            </div>
          )}
        </>
      )}

      {/* Application Drawer */}
      <ApplicationDrawer
        key={selectedApp?.id}
        application={selectedApp}
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedApp(null); }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        stages={SHUUKATSU_STAGE_LIST}
        userId={user?.id}
        isPro={userIsPro}
        onUpgrade={() => setShowUpgradeModal(true)}
        isShuukatsu
      />

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={applications.length >= FREE_TIER_LIMIT ? 'cap' : 'billing'}
      />

      <JaAddApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSave}
        stages={SHUUKATSU_STAGE_LIST}
        isPro={userIsPro}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      <MobileBottomNav />
    </div>
  );
}

export default function JaDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/ja/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <ExtensionStatusProvider>
      <StoreProvider userId={user.id} isPro={checkIsPro(user)}>
        <JaDashboardContent />
      </StoreProvider>
    </ExtensionStatusProvider>
  );
}
