'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { SHUUKATSU_STAGES, SHUUKATSU_STAGE_COLORS } from '@/lib/constants';
import { Application, PipelineStage, ShuukatsuStage } from '@/lib/types';
import { isPro as checkIsPro, FREE_TIER_LIMIT } from '@/lib/pro';
import { CapExceededError } from '@/lib/store';
import { getGreetingJa, formatDeadlineJa } from '@/lib/ja-utils';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import { ExtensionStatusProvider } from '@/lib/extension-status-context';
import AddApplicationModal from '@/components/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import UpgradeModal from '@/components/UpgradeModal';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import MobileBottomNav from '@/components/MobileBottomNav';

const SHUUKATSU_STAGE_LIST = SHUUKATSU_STAGES.map(s => s.id) as ShuukatsuStage[];

// ── Stats bar ─────────────────────────────────────────────────────────────────

function JaStatsBar({ apps }: { apps: Application[] }) {
  const total = apps.length;
  const interviews = apps.filter(a =>
    ['一次面接', '二次面接', '最終面接'].includes(a.status)
  ).length;
  const offers = apps.filter(a => ['内々定', '内定'].includes(a.status)).length;
  const actNow = apps.filter(a => {
    if (!a.deadline) return false;
    const { urgency } = formatDeadlineJa(a.deadline);
    return urgency === 'danger' || urgency === 'warning';
  }).length;

  const stats = [
    { label: '合計', value: total },
    { label: '面接中', value: interviews },
    { label: '内定', value: offers },
    { label: '要対応', value: actNow, highlight: actNow > 0 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {stats.map(s => (
        <div
          key={s.label}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-gray)',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <p style={{
            fontSize: 22,
            fontWeight: 700,
            color: s.highlight ? '#EF4444' : 'var(--brand-navy)',
            fontFamily: 'var(--font-geist), sans-serif',
            letterSpacing: '-0.03em',
            margin: 0,
          }}>
            {s.value}
          </p>
          <p style={{
            fontSize: 11,
            color: 'var(--muted-text)',
            letterSpacing: '0.05em',
            margin: '2px 0 0',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Shuukatsu card ────────────────────────────────────────────────────────────

function JaCard({
  app,
  onClick,
}: {
  app: Application;
  onClick: () => void;
}) {
  const stageColor = SHUUKATSU_STAGE_COLORS[app.status] ?? '#64748B';
  const { label: deadlineLabel, urgency } = formatDeadlineJa(app.deadline);
  const deadlineColor = urgency === 'danger' ? '#EF4444' : urgency === 'warning' ? '#F59E0B' : '#94A3B8';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-gray)',
        borderRadius: 12,
        padding: '14px 16px 14px 20px',
        borderLeft: `3px solid ${stageColor}`,
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'box-shadow 0.15s',
        display: 'block',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${stageColor}40, 0 2px 8px rgba(0,0,0,0.06)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--brand-navy)',
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {app.company}
          </p>
          <p style={{
            fontSize: 12,
            color: 'var(--muted-text)',
            margin: '2px 0 0',
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {app.role}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            color: stageColor,
            background: `${stageColor}18`,
            border: `1px solid ${stageColor}30`,
            borderRadius: 9999,
            padding: '2px 8px',
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            {app.status}
          </span>
          {deadlineLabel && (
            <span style={{
              fontSize: 10,
              color: deadlineColor,
              fontFamily: 'var(--font-geist), sans-serif',
              fontWeight: 500,
            }}>
              {deadlineLabel}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Pipeline column ───────────────────────────────────────────────────────────

function StageColumn({
  stage,
  apps,
  onCardClick,
}: {
  stage: typeof SHUUKATSU_STAGES[0];
  apps: Application[];
  onCardClick: (app: Application) => void;
}) {
  return (
    <div style={{
      flexShrink: 0,
      width: 220,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        padding: '0 2px',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: stage.color,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--brand-navy)',
          letterSpacing: '0.05em',
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          {stage.label}
        </span>
        {apps.length > 0 && (
          <span style={{
            fontSize: 10,
            color: stage.color,
            background: `${stage.color}18`,
            borderRadius: 9999,
            padding: '1px 6px',
            fontFamily: 'var(--font-geist), sans-serif',
            fontWeight: 600,
            marginLeft: 'auto',
          }}>
            {apps.length}
          </span>
        )}
      </div>

      {/* Cards */}
      <div style={{ flex: 1 }}>
        {apps.map(app => (
          <JaCard key={app.id} app={app} onClick={() => onCardClick(app)} />
        ))}
      </div>
    </div>
  );
}

// ── Mobile stage list ─────────────────────────────────────────────────────────

function MobileStageList({
  apps,
  onCardClick,
  onStatusChange,
}: {
  apps: Application[];
  onCardClick: (app: Application) => void;
  onStatusChange: (id: string, status: PipelineStage) => void;
}) {
  const [openStages, setOpenStages] = useState<Set<string>>(new Set(
    SHUUKATSU_STAGES.filter(s => apps.some(a => a.status === s.id)).map(s => s.id)
  ));
  const [pickerApp, setPickerApp] = useState<Application | null>(null);

  const toggle = (id: string) =>
    setOpenStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      {SHUUKATSU_STAGES.map(stage => {
        const stageApps = apps.filter(a => a.status === stage.id);
        const isOpen = openStages.has(stage.id);
        return (
          <div key={stage.id} style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggle(stage.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'var(--surface-gray)',
                border: '1px solid var(--border-gray)',
                borderRadius: isOpen ? '10px 10px 0 0' : 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color }} />
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--brand-navy)',
                letterSpacing: '0.05em',
                fontFamily: "'Noto Sans JP', sans-serif",
                flex: 1,
                textAlign: 'left',
              }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: 11,
                color: stageApps.length > 0 ? stage.color : 'var(--muted-text)',
                background: stageApps.length > 0 ? `${stage.color}18` : 'transparent',
                borderRadius: 9999,
                padding: '1px 7px',
                fontFamily: 'var(--font-geist), sans-serif',
                fontWeight: 600,
              }}>
                {stageApps.length}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen && stageApps.length > 0 && (
              <div style={{
                border: '1px solid var(--border-gray)',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '8px 10px',
                background: 'var(--card-bg)',
              }}>
                {stageApps.map(app => (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <JaCard app={app} onClick={() => onCardClick(app)} />
                    </div>
                    <button
                      onClick={() => setPickerApp(app)}
                      style={{
                        flexShrink: 0,
                        height: 36,
                        padding: '0 10px',
                        fontSize: 11,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        color: 'var(--accent-blue)',
                        background: 'rgba(37,99,235,0.07)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      移動
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Stage picker sheet */}
      {pickerApp && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPickerApp(null)}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--card-bg)',
              borderRadius: '20px 20px 0 0',
              padding: '16px 0 calc(24px + env(safe-area-inset-bottom))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 32, height: 4, borderRadius: 99, background: 'var(--border-gray)', margin: '0 auto 16px' }} />
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted-text)',
              letterSpacing: '0.05em',
              padding: '0 20px 8px',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              ステージを選択
            </p>
            {SHUUKATSU_STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => { onStatusChange(pickerApp.id, s.id as PipelineStage); setPickerApp(null); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  background: pickerApp.status === s.id ? `${s.color}10` : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 52,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{
                  fontSize: 14,
                  fontWeight: pickerApp.status === s.id ? 600 : 400,
                  color: pickerApp.status === s.id ? s.color : 'var(--brand-navy)',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  letterSpacing: '0.05em',
                }}>
                  {s.label}
                </span>
                {pickerApp.status === s.id && (
                  <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard inner ───────────────────────────────────────────────────────────

function JaDashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, loading, addApplication, updateApplication, deleteApplication, storeError, clearStoreError, retryLoad } = useStore();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userIsPro = checkIsPro(user);
  const greeting = getGreetingJa();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Redirect if not onboarded
  useEffect(() => {
    if (!loading && user && !user.onboarding_complete) {
      router.push('/ja/onboarding');
    }
  }, [user, loading, router]);

  // Listen for mobile add event
  useEffect(() => {
    const handler = () => setShowAddModal(true);
    window.addEventListener('applyd:add', handler);
    return () => window.removeEventListener('applyd:add', handler);
  }, []);

  const filteredApps = useMemo(() => {
    if (!search) return applications;
    const q = search.toLowerCase();
    return applications.filter(a =>
      a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  }, [applications, search]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

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
      }
    }
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

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border-gray bg-background sticky top-0 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2">
          {userIsPro ? <ProLogo size={26} /> : <Logo size={26} variant="dark" />}
          <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist)' }}>Applyd</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:block border-b border-border-gray bg-background sticky top-0 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-5">
            <Link href="/ja" className="flex items-center gap-2">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist)' }}>Applyd</span>
            </Link>
            <div className="flex items-center gap-0.5">
              {[
                { href: '/ja/dashboard', label: 'ダッシュボード', active: true },
                { href: '/calendar',     label: 'カレンダー',     active: false },
                { href: '/settings',     label: '設定',           active: false },
              ].map(({ href, label, active }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: 8,
                    color: active ? 'var(--accent-blue)' : 'var(--muted-text)',
                    background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    letterSpacing: '0.03em',
                    textDecoration: 'none',
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span style={{ fontSize: 13, color: 'var(--muted-text)', fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: '0.05em' }}>
                {user.name.split(' ')[0]}さん
              </span>
            )}
            {!userIsPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-gray)',
                  color: 'var(--muted-text)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  letterSpacing: '0.05em',
                }}
              >
                アップグレード
              </button>
            )}
            <ThemeToggle />
            <Link href="/settings" style={{ color: 'var(--muted-text)', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
            <button
              onClick={async () => { await signOut(); router.push('/ja'); }}
              style={{ fontSize: 12, color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: '0.05em' }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-mobile-nav lg:pb-8">
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--brand-navy)',
            letterSpacing: '-0.01em',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>
            {greeting}{user?.name ? `、${user.name.split(' ')[0]}さん。` : '。'}
          </p>
        </div>

        {/* Stats */}
        {applications.length > 0 && <JaStatsBar apps={applications} />}

        {/* Search + Add */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="企業名・職種で検索"
              style={{
                width: '100%',
                height: isMobile ? 44 : 38,
                paddingLeft: 36,
                paddingRight: 12,
                background: 'var(--background)',
                border: '1px solid var(--border-gray)',
                borderRadius: isMobile ? 12 : 8,
                fontSize: isMobile ? 16 : 13,
                color: 'var(--brand-navy)',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden lg:flex"
            style={{
              height: 38,
              padding: '0 16px',
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Noto Sans JP', sans-serif",
              letterSpacing: '0.05em',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            選考を追加
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 220, borderRadius: 12, border: '1px solid var(--border-gray)', padding: 12, background: 'var(--card-bg)' }}>
                <div style={{ height: 12, width: 80, borderRadius: 6, background: 'var(--surface-gray)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                {[...Array(2)].map((_, j) => (
                  <div key={j} style={{ height: 64, borderRadius: 8, background: 'var(--surface-gray)', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            border: '1px dashed var(--border-gray)',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8, fontFamily: "'Noto Sans JP', sans-serif" }}>
              まだ選考を追加していません
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 24, letterSpacing: '0.05em', fontFamily: "'Noto Sans JP', sans-serif" }}>
              最初の選考を追加して、就活管理を始めましょう
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                height: 52,
                padding: '0 32px',
                background: 'var(--accent-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Noto Sans JP', sans-serif",
                letterSpacing: '0.05em',
              }}
            >
              最初の選考を追加する
            </button>
          </div>
        ) : isMobile ? (
          <MobileStageList
            apps={filteredApps}
            onCardClick={app => { setSelectedApp(app); setShowDrawer(true); }}
            onStatusChange={handleStatusChange}
          />
        ) : (
          /* Desktop: horizontal kanban */
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
            {SHUUKATSU_STAGES.map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                apps={filteredApps.filter(a => a.status === stage.id)}
                onCardClick={app => { setSelectedApp(app); setShowDrawer(true); }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: '1px solid var(--border-gray)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { href: '/settings', label: '設定' },
              { href: '/privacy', label: 'プライバシーポリシー' },
              { href: '/terms', label: '利用規約' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'var(--muted-text)', textDecoration: 'none', fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: '0.05em' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist), sans-serif' }}>
            © 2026 Applyd
          </p>
        </footer>
      </main>

      {/* Add Modal — uses English stages but pre-selects エントリー */}
      <AddApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSave}
        stages={SHUUKATSU_STAGE_LIST as PipelineStage[]}
        userId={user?.id}
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
        stages={SHUUKATSU_STAGE_LIST as PipelineStage[]}
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

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function JaDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
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
