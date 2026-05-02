'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { SHUUKATSU_STAGES } from '@/lib/constants';
import { Application, PipelineStage } from '@/lib/types';
import { isPro as checkIsPro, FREE_TIER_LIMIT } from '@/lib/pro';
import { CapExceededError } from '@/lib/store';
import { getGreetingJa } from '@/lib/ja-utils';
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
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Zap, MessageSquare, Clock } from 'lucide-react';

const SHUUKATSU_STAGE_LIST = SHUUKATSU_STAGES.map(s => s.id) as PipelineStage[];

// ── Stats bar (Japanese-aware) ────────────────────────────────────────────────

function JaStatsBar({ apps }: { apps: Application[] }) {
  const reduce = useReducedMotion();
  const total = apps.length;

  const interviewStages = ['一次面接', '二次面接', '最終面接', 'GD・グループ面接'];
  const interviews = apps.filter(a => interviewStages.includes(a.status)).length;

  const postEntryApps = apps.filter(a => !['エントリー', '不採用', '辞退', '承諾'].includes(a.status));
  const responseRate = postEntryApps.length >= 5
    ? Math.round((interviews / postEntryApps.length) * 100)
    : null;

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const deadlinesSoon = apps.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline + 'T00:00:00');
    return d >= now && d <= sevenDays;
  }).length;

  const thisWeek = apps.filter(a => {
    if (!a.created_at) return false;
    return new Date(a.created_at) >= sevenDaysAgo;
  }).length;

  const stats = [
    {
      label: '合計',
      value: total.toString(),
      subtext: total === 0 ? '最初の選考を追加' : thisWeek > 0 ? `今週+${thisWeek}社` : '選考中',
      icon: <TrendingUp size={14} />,
      accent: null as null | 'green' | 'amber',
    },
    {
      label: '応答率',
      value: responseRate !== null ? `${responseRate}%` : '—',
      subtext: responseRate === null
        ? `あと${Math.max(0, 5 - postEntryApps.length)}社で表示`
        : responseRate >= 30 ? '平均以上です' : '20〜30%が目安',
      icon: <Zap size={14} />,
      accent: null,
    },
    {
      label: '面接中',
      value: interviews.toString(),
      subtext: interviews === 0 ? '面接なし' : interviews === 1 ? '頑張ってください！' : 'よい調子です！',
      icon: <MessageSquare size={14} />,
      accent: 'green' as const,
    },
    {
      label: '期限が近い',
      value: deadlinesSoon.toString(),
      subtext: deadlinesSoon === 0 ? '急ぎの期限なし' : `${deadlinesSoon}件・7日以内`,
      icon: <Clock size={14} />,
      accent: 'amber' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="rounded-lg p-4 border relative overflow-hidden"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-gray)',
            borderLeft: s.accent === 'green' ? '3px solid var(--green-success)' : s.accent === 'amber' ? '3px solid var(--amber-warning)' : undefined,
          }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.28, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ color: 'var(--text-tertiary)' }}>{s.icon}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>{s.label}</span>
          </div>
          <div className="text-[28px] font-semibold leading-none mb-1"
            style={{
              color: s.accent === 'green' ? 'var(--green-success)' : s.accent === 'amber' ? 'var(--amber-warning)' : 'var(--brand-navy)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-geist), sans-serif',
            }}
          >{s.value}</div>
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)', fontFamily: "'Noto Sans JP', sans-serif" }}>{s.subtext}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Dashboard content ─────────────────────────────────────────────────────────

function JaDashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, loading, addApplication, updateApplication, deleteApplication, storeError, clearStoreError, retryLoad } = useStore();
  const router = useRouter();

  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PipelineStage | 'all'>('all');
  const [hideInactive, setHideInactive] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userIsPro = checkIsPro(user);
  const greeting = getGreetingJa();

  const INACTIVE_STAGES: string[] = ['承諾'];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!loading && user && !user.onboarding_complete) router.push('/ja/onboarding');
  }, [user, loading, router]);

  useEffect(() => {
    const handler = () => setShowAddModal(true);
    window.addEventListener('applyd:add', handler);
    return () => window.removeEventListener('applyd:add', handler);
  }, []);

  // Keyboard shortcut: N to add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !(e.target as HTMLElement).matches('input,textarea,select')) {
        setShowAddModal(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const inactiveCount = applications.filter(a => INACTIVE_STAGES.includes(a.status)).length;
  const hiddenCount = inactiveCount;

  const displayApplications = useMemo(() => {
    if (!hideInactive) return applications;
    return applications.filter(a => !INACTIVE_STAGES.includes(a.status));
  }, [applications, hideInactive]);

  const filteredApps = useMemo(() => {
    let apps = displayApplications;
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      apps = apps.filter(a => a.status === statusFilter);
    }
    return apps;
  }, [displayApplications, search, statusFilter]);

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
        recruiter_name: '',
        recruiter_email: '',
        interview_steps: [],
      });
      setShowAddModal(false);
      showToast('選考を追加しました');
    } catch (err) {
      if (err instanceof CapExceededError) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
      } else {
        throw err;
      }
    }
  };

  const handleCardClick = (app: Application) => {
    setSelectedApp(app);
    setShowDrawer(true);
  };

  const handleUpdate = async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates);
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
  };

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    setShowDrawer(false);
    setSelectedApp(null);
    showToast('選考を削除しました');
  };

  const handleStatusChange = async (id: string, status: PipelineStage) => {
    await updateApplication(id, { status });
    showToast(`${status}に移動しました`);
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <Toast
        message={toast}
        onDismiss={() => { setToast(null); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }}
      />

      {/* Store error */}
      {storeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {storeError}
          <button onClick={() => { clearStoreError(); retryLoad(); }} className="underline text-sm font-semibold">再試行</button>
          <button onClick={clearStoreError}>✕</button>
        </div>
      )}

      {/* Free-tier nudge */}
      {!userIsPro && !loading && applications.length >= FREE_TIER_LIMIT - 3 && applications.length < FREE_TIER_LIMIT && (
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-3">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <p className="text-[13px]" style={{ color: 'var(--brand-navy)', fontFamily: "'Noto Sans JP', sans-serif" }}>
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-5">
            <Link href="/ja" className="flex items-center gap-2">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="text-[16px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist), sans-serif' }}>Applyd</span>
            </Link>
            <div className="flex items-center gap-0.5">
              {[
                { href: '/ja/dashboard', label: 'ダッシュボード', active: true },
                { href: '/calendar',     label: 'カレンダー',     active: false },
                { href: '/ja/interview', label: '模擬面接',       active: false },
              ].map(({ href, label, active }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative text-[13px] font-medium px-2.5 py-1.5 rounded-lg"
                  style={{ color: active ? 'var(--accent-blue)' : 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  {active && (
                    <motion.span
                      layoutId="ja-nav-active"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(37,99,235,0.08)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="text-sm hidden md:block" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>
                {user.name.split(' ')[0]}さん
              </span>
            )}
            {userIsPro ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', letterSpacing: '0.02em' }}>
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
            <LocaleSwitcher />
            <ThemeToggle />
            <button
              onClick={async () => { await signOut(); router.push('/ja'); }}
              className="text-xs transition-colors"
              style={{ color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-mobile-nav lg:pb-6">

        {/* Greeting */}
        <div className="mb-5">
          <p className="text-[17px] font-semibold leading-snug" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: "'Noto Sans JP', sans-serif" }}>
            {greeting}{user?.name ? `、${user.name.split(' ')[0]}さん。` : '。'}
          </p>
        </div>

        {/* Stats */}
        {applications.length > 0 && <JaStatsBar apps={applications} />}

        {/* Controls */}
        <div className="mt-2 flex flex-col gap-2">
          {/* Mobile search */}
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

          {/* Desktop: search + add row */}
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
              className="h-9 px-4 text-[13px] font-medium text-white rounded-md flex items-center gap-1.5 flex-shrink-0 transition-colors bg-accent-blue hover:bg-accent-blue-hover"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              選考を追加
              <kbd className="hidden lg:inline-flex items-center px-1 rounded text-[10px] ml-0.5" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', fontFamily: 'inherit', lineHeight: '1.6' }}>N</kbd>
            </button>
          </div>

          {/* Desktop: view toggle + filter row */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            <div className="flex border border-border-gray rounded-md p-0.5 flex-shrink-0" style={{ background: 'var(--surface-gray)' }}>
              <button
                onClick={() => setView('pipeline')}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors ${view === 'pipeline' ? 'bg-card-bg text-brand-navy' : 'text-muted-text'}`}
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >パイプライン</button>
              <button
                onClick={() => setView('table')}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors ${view === 'table' ? 'bg-card-bg text-brand-navy' : 'text-muted-text'}`}
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >テーブル</button>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PipelineStage | 'all')}
              className="h-8 px-3 bg-background border border-border-gray rounded-md text-[12px] focus:outline-none focus:border-accent-blue transition-colors flex-shrink-0"
              style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              <option value="all">すべてのステージ</option>
              {SHUUKATSU_STAGE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => setHideInactive(h => !h)}
              className="h-8 px-3 text-[12px] font-medium border rounded-md flex-shrink-0 transition-colors"
              style={hideInactive
                ? { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }
                : { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff', fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {hideInactive ? `${hiddenCount}件を非表示中` : 'すべて表示'}
            </button>
          </div>

          {displayApplications.length > 0 && (
            <p className="text-[11px] text-right" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist), sans-serif' }}>
              {filteredApps.length === displayApplications.length
                ? `${displayApplications.length}件`
                : `${filteredApps.length} / ${displayApplications.length}件を表示中`}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 flex-1">
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
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
            /* Empty state */
            <div className="py-20 text-center border border-dashed border-border-gray rounded-xl">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(37,99,235,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <p className="text-[17px] font-semibold mb-2" style={{ color: 'var(--brand-navy)', fontFamily: "'Noto Sans JP', sans-serif" }}>
                まだ選考を追加していません
              </p>
              <p className="text-[13px] mb-6" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>
                最初の選考を追加して、就活管理を始めましょう
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[14px] font-medium text-white transition-colors"
                style={{ background: 'var(--accent-blue)', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                最初の選考を追加する
              </button>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border-gray rounded-lg">
              <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)', fontFamily: "'Noto Sans JP', sans-serif" }}>一致なし</h3>
              <p className="text-[12px] mb-4" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>フィルターを変えてみてください。</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setHideInactive(true); }}
                className="inline-flex items-center h-8 px-3 text-[12px] font-medium rounded-md border border-border-gray transition-colors hover:bg-surface-gray"
                style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                フィルターをリセット
              </button>
            </div>
          ) : isMobile ? (
            <MobileCardList
              applications={filteredApps}
              stages={SHUUKATSU_STAGE_LIST}
              onCardClick={handleCardClick}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
            />
          ) : view === 'pipeline' ? (
            <PipelineView
              applications={filteredApps}
              stages={SHUUKATSU_STAGE_LIST}
              onCardClick={handleCardClick}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
            />
          ) : (
            <TableView
              applications={filteredApps}
              selectedIds={new Set()}
              onSelectionChange={() => {}}
              onRowClick={handleCardClick}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-border-gray flex justify-between flex-wrap gap-3">
          <div className="flex gap-5">
            {[
              { href: '/settings', label: '設定' },
              { href: '/ja/privacy', label: 'プライバシー' },
              { href: '/ja/terms', label: '利用規約' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-[12px] transition-colors hover:text-brand-navy" style={{ color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist), sans-serif' }}>© {new Date().getFullYear()} Applyd</p>
        </footer>
      </main>

      {/* Add Modal — Japanese UI */}
      <JaAddApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSave}
        stages={SHUUKATSU_STAGE_LIST}
        isPro={userIsPro}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Detail Drawer */}
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

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={applications.length >= FREE_TIER_LIMIT ? 'cap' : 'billing'}
      />

      <MobileBottomNav />
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function JaDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/ja/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <ExtensionStatusProvider>
      <StoreProvider userId={user.id}>
        <JaDashboardContent />
      </StoreProvider>
    </ExtensionStatusProvider>
  );
}
