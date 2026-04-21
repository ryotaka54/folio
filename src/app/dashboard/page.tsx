'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTERNSHIP_STAGES, JOB_STAGES } from '@/lib/constants';
import { Application, PipelineStage, Category } from '@/lib/types';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import PipelineView from '@/components/PipelineView';
import TableView from '@/components/TableView';
import AddApplicationModal from '@/components/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import EmptyState from '@/components/EmptyState';
import MobileCardList from '@/components/MobileCardList';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import ContextMenu from '@/components/ContextMenu';
import ExtensionBanner from '@/components/ExtensionBanner';
import StreakBadge from '@/components/StreakBadge';
import OfferConfetti from '@/components/OfferConfetti';
import { useTutorial } from '@/lib/tutorial-context';
import { ExtensionStatusProvider, useExtensionStatus } from '@/lib/extension-status-context';
import { capture } from '@/lib/analytics';
import { isPro as checkIsPro, FREE_TIER_LIMIT } from '@/lib/pro';
import { CapExceededError } from '@/lib/store';
import UpgradeModal from '@/components/UpgradeModal';
import ProTour from '@/components/ProTour';
import ReferralWelcomeModal from '@/components/ReferralWelcomeModal';
import FeedbackPrompt from '@/components/FeedbackPrompt';
import ImportCSVModal from '@/components/ImportCSVModal';
import TodayView from '@/components/TodayView';
import PipelineBar from '@/components/PipelineBar';
import NotificationBell from '@/components/NotificationBell';
import { LayoutDashboard, Calendar, Mic, Home } from 'lucide-react';

const DEMO_APPS_INTERNSHIP: Application[] = [
  { id: 'demo-1', user_id: 'demo', company: 'Stripe', role: 'Software Engineer Intern', location: 'San Francisco, CA', category: 'Engineering', status: 'Applied', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-2', user_id: 'demo', company: 'Google', role: 'PM Intern', location: 'Mountain View, CA', category: 'Product Management', status: 'Applied', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-3', user_id: 'demo', company: 'Microsoft', role: 'Software Engineer Intern', location: 'Redmond, WA', category: 'Engineering', status: 'OA / Online Assessment', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-4', user_id: 'demo', company: 'Amazon', role: 'SDE Intern', location: 'Seattle, WA', category: 'Engineering', status: 'Phone / Recruiter Screen', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-5', user_id: 'demo', company: 'Meta', role: 'Software Engineer Intern', location: 'Menlo Park, CA', category: 'Engineering', status: 'Final Round Interviews', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
];

const DEMO_APPS_JOB: Application[] = [
  { id: 'demo-1', user_id: 'demo', company: 'Stripe', role: 'Software Engineer', location: 'San Francisco, CA', category: 'Engineering', status: 'Applied', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-2', user_id: 'demo', company: 'Google', role: 'Product Manager', location: 'Mountain View, CA', category: 'Product Management', status: 'Applied', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-3', user_id: 'demo', company: 'Microsoft', role: 'Software Engineer', location: 'Redmond, WA', category: 'Engineering', status: 'Recruiter Screen', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-4', user_id: 'demo', company: 'Amazon', role: 'SDE', location: 'Seattle, WA', category: 'Engineering', status: 'Technical / Case Interview', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
  { id: 'demo-5', user_id: 'demo', company: 'Meta', role: 'Software Engineer', location: 'Menlo Park, CA', category: 'Engineering', status: 'Final Round', deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '', interview_steps: [], created_at: '', updated_at: '' },
];

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, loading, addApplication, updateApplication, deleteApplication, storeError, clearStoreError, retryLoad } = useStore();
  const { start: startTutorial, isActive, demoApplications } = useTutorial();
  const { isInstalled: extInstalled, isDismissed: extDismissed, isBannerEligible } = useExtensionStatus();
  const router = useRouter();

  const [view, setView] = useState<'today' | 'pipeline' | 'table'>('today');
  const [isMobile, setIsMobile] = useState(false);
  // Detect mobile after mount to avoid SSR mismatch
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [showFirstAppTip, setShowFirstAppTip] = useState(false);
  const [hideInactive, setHideInactive] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PipelineStage | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PipelineStage | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addModalInitialUrl, setAddModalInitialUrl] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; app: Application } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null);
  const [offerConfetti, setOfferConfetti] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);
  const [showProWelcome, setShowProWelcome] = useState(false);
  const [showReferralWelcome, setShowReferralWelcome] = useState(false);
  const userIsPro = checkIsPro(user);
  const prevStatusesRef = useRef<Record<string, string>>({});

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDeleteRef = useRef<{ id: string; app: Application } | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firstAppTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stages = user?.mode === 'job' ? JOB_STAGES : INTERNSHIP_STAGES;
  const inactiveStatuses = ['Rejected', 'Declined'];

  const displayApplications = useMemo(
    () => isActive && demoApplications.length > 0 ? [...applications, ...demoApplications] : applications,
    [isActive, demoApplications, applications]
  );

  const filteredApps = useMemo(() => {
    return displayApplications.filter(app => {
      if (hideInactive && inactiveStatuses.includes(app.status)) return false;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      return true;
    });
  }, [displayApplications, hideInactive, statusFilter]);

  const showToast = (msg: string, undoFn?: () => void) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    setToastUndo(undoFn ? () => undoFn : null);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      setToastUndo(null);
      // If there's a pending delete and the timer fires (no undo clicked), execute it
      if (pendingDeleteRef.current) {
        deleteApplication(pendingDeleteRef.current.id).catch(() => {});
        pendingDeleteRef.current = null;
      }
    }, 5000);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    await Promise.all([...selectedIds].map(id => updateApplication(id, { status: bulkStatus as PipelineStage }).catch(() => {})));
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} application${selectedIds.size !== 1 ? 's' : ''}?`)) return;
    await Promise.all([...selectedIds].map(id => deleteApplication(id).catch(() => {})));
    setSelectedIds(new Set());
  };

  const handleCardClick = (app: Application) => {
    setSelectedApp(app);
    setShowDrawer(true);
  };

  const bannerVisible = !extInstalled && !extDismissed && isBannerEligible(user?.created_at) && !isActive;

  const handleAddSave = async (data: {
    company: string;
    role: string;
    location: string;
    category: Category | '';
    status: PipelineStage;
    deadline: string | null;
    job_link: string;
    notes: string;
  }) => {
    const isFirstApp = applications.length === 0;
    try {
      await addApplication({ ...data, recruiter_name: '', recruiter_email: '', interview_steps: [] });
    } catch (err) {
      if (err instanceof CapExceededError) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
        return;
      }
      throw err;
    }
    capture('application_added', { status: data.status, has_job_link: !!data.job_link });
    showToast(`${data.company} added`);
    if (isFirstApp && !localStorage.getItem('first_app_celebration_shown')) {
      localStorage.setItem('first_app_celebration_shown', 'true');
      setShowFirstAppTip(true);
      firstAppTimerRef.current = setTimeout(() => setShowFirstAppTip(false), 5000);
      capture('first_application_logged');
    }
  };

  // Drawer edits — silent, no toast
  const handleUpdate = (id: string, updates: Partial<Application>) => {
    updateApplication(id, updates).catch(() => {});
    setSelectedApp(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  // Drag-and-drop status change — shows toast
  const handleStatusChange = (id: string, status: PipelineStage) => {
    capture('application_status_changed', { status });
    handleUpdate(id, { status });
    showToast(`Moved to ${status}`);
  };

  const handleDelete = async (id: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    // Optimistically close the drawer
    setShowDrawer(false);
    setSelectedApp(null);

    // Stage the delete with undo window
    capture('application_deleted', { company: app.company, status: app.status });
    pendingDeleteRef.current = { id, app };
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);

    showToast(`${app.company} removed`, () => {
      // Undo: cancel the pending delete
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      pendingDeleteRef.current = null;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(null);
      setToastUndo(null);
      // Re-open drawer since app still exists in store (delete hasn't fired)
      setSelectedApp(app);
      setShowDrawer(true);
    });
  };

  const handleContextMenu = (app: Application, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, app });
  };

  const handleAutofillUrl = (url: string) => {
    setAddModalInitialUrl(url);
    setShowAddModal(true);
  };


  // Detect ?upgraded=true in URL → show Pro welcome (once) then success banner
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      window.history.replaceState({}, '', '/dashboard');
      if (!localStorage.getItem('pro_welcome_shown')) {
        setShowProWelcome(true);
      } else {
        setUpgradedSuccess(true);
      }
    }
    // Detect ?ref_welcome=1 → show referral welcome modal once per user
    if (params.get('ref_welcome') === '1') {
      window.history.replaceState({}, '', '/dashboard');
      if (!localStorage.getItem('ref_welcome_shown')) {
        setShowReferralWelcome(true);
      }
    }
  }, []);

  // Listen for command palette "Add Application" and mobile bottom nav
  useEffect(() => {
    const handler = () => { setAddModalInitialUrl(''); setShowAddModal(true); };
    document.addEventListener('applyd:add', handler);
    return () => document.removeEventListener('applyd:add', handler);
  }, []);

  // Handle ?add=1 from mobile nav when navigating from another page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === '1') {
      window.history.replaceState({}, '', '/dashboard');
      setAddModalInitialUrl('');
      setShowAddModal(true);
    }
  }, []);

  // Keyboard shortcut: N opens add modal (when no input is focused)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setAddModalInitialUrl('');
        setShowAddModal(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-start tutorial for new users who haven't seen it yet
  const tutorialStartedRef = useRef(false);
  useEffect(() => {
    if (tutorialStartedRef.current) return;
    if (user?.onboarding_complete && user?.tutorial_completed === false) {
      tutorialStartedRef.current = true;
      // Brief delay so the dashboard has fully rendered before the overlay appears
      const t = setTimeout(() => {
        const demos = applications.length < 5
          ? (user?.mode === 'job' ? DEMO_APPS_JOB : DEMO_APPS_INTERNSHIP)
          : [];
        startTutorial(demos);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [user, startTutorial, applications]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (firstAppTimerRef.current) clearTimeout(firstAppTimerRef.current);
    };
  }, []);

  // Dynamic page title + app badge
  useEffect(() => {
    if (loading) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayDeadlines = applications.filter(a => a.deadline === todayStr);
    const weekDeadlines = applications.filter(a => {
      if (!a.deadline) return false;
      const d = new Date(a.deadline + 'T00:00:00');
      return d >= now && d <= sevenDays;
    });

    if (todayDeadlines.length > 0) {
      document.title = `🔴 Deadline Today — Applyd`;
    } else if (applications.length > 0) {
      document.title = `Applyd — ${applications.length} application${applications.length !== 1 ? 's' : ''} tracked`;
    } else {
      document.title = 'Dashboard | Applyd';
    }

    // App badge (dock/taskbar badge count = deadlines this week)
    if ('setAppBadge' in navigator) {
      if (weekDeadlines.length > 0) {
        (navigator as Navigator & { setAppBadge: (n: number) => void }).setAppBadge(weekDeadlines.length);
      } else {
        (navigator as Navigator & { clearAppBadge: () => void }).clearAppBadge?.();
      }
    }

    return () => {
      document.title = 'Applyd — Recruiting Pipeline Tracker for Students';
      if ('clearAppBadge' in navigator) {
        (navigator as Navigator & { clearAppBadge: () => void }).clearAppBadge();
      }
    };
  }, [applications, loading]);

  // Desktop notifications — request after 3+ apps, fire for deadlines within 24h
  useEffect(() => {
    if (loading || applications.length < 3) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    const requestAndNotify = async () => {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const notifiedKey = `applyd_notified_${tomorrowStr}`;
      if (localStorage.getItem(notifiedKey)) return;

      const dueTomorrow = applications.filter(a => a.deadline === tomorrowStr);
      for (const app of dueTomorrow.slice(0, 3)) {
        new Notification(`Applyd — Deadline Tomorrow`, {
          body: `${app.company} — ${app.role}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: `applyd-deadline-${app.id}`,
        });
      }
      if (dueTomorrow.length > 0) localStorage.setItem(notifiedKey, '1');
    };

    requestAndNotify();
  }, [applications, loading]);

  // Detect offer status changes → trigger confetti
  useEffect(() => {
    const offerStatuses = ['Offer', 'Offer — Negotiating'];
    for (const app of applications) {
      const prev = prevStatusesRef.current[app.id];
      if (prev && !offerStatuses.includes(prev) && offerStatuses.includes(app.status)) {
        setOfferConfetti(true);
        showToast('🎉 Offer received — you earned this.');
        setTimeout(() => setOfferConfetti(false), 100);
        break;
      }
    }
    prevStatusesRef.current = Object.fromEntries(applications.map(a => [a.id, a.status]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

  return (
    <div className="min-h-screen bg-background">
      <ExtensionBanner />

      {/* Pro upgrade success banner */}
      {upgradedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg fade-in"
          style={{ background: 'linear-gradient(135deg,#0a0a14,#1e1e3a)', border: '1px solid rgba(201,168,76,0.3)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
          <ProLogo size={24} />
          Welcome to Pro! Unlimited applications unlocked.
          <button onClick={() => setUpgradedSuccess(false)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* Free-tier soft nudge — appears at 12 apps */}
      {!userIsPro && !loading && applications.length >= FREE_TIER_LIMIT - 3 && applications.length < FREE_TIER_LIMIT && (
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-3">
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg"
            style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <p className="text-[13px]" style={{ color: 'var(--brand-navy)' }}>
              <span className="font-semibold">Almost at the limit</span> — {FREE_TIER_LIMIT - applications.length} free slot{FREE_TIER_LIMIT - applications.length !== 1 ? 's' : ''} remaining.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-[12px] font-semibold px-3 py-1 rounded-md text-white flex-shrink-0"
              style={{ background: 'var(--accent-blue)' }}
            >
              Upgrade ⚡
            </button>
          </div>
        </div>
      )}

      {/* Store error banner */}
      {storeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {storeError}
          <button
            onClick={() => { clearStoreError(); retryLoad(); }}
            className="underline underline-offset-2 hover:opacity-80 text-sm font-semibold"
          >
            Retry
          </button>
          <button onClick={clearStoreError} className="ml-1 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Offer confetti */}
      <OfferConfetti trigger={offerConfetti} />

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onOpen={() => { handleCardClick(ctxMenu.app); setCtxMenu(null); }}
          onDelete={() => { handleDelete(ctxMenu.app.id); setCtxMenu(null); }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Toast */}
      <Toast
        message={toast}
        onDismiss={() => { setToast(null); setToastUndo(null); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }}
        onUndo={toastUndo ?? undefined}
      />

      {/* Mobile top bar — logo + theme toggle (replaces full desktop nav on small screens) */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2">
          {userIsPro ? <ProLogo size={26} /> : <Logo size={26} variant="dark" />}
          <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          {userIsPro && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>⚡ Pro</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {applications.length > 0 && <StreakBadge onMilestone={msg => showToast(msg)} />}
          <ThemeToggle />
        </div>
      </div>

      {/* Top nav — hidden on mobile (replaced by bottom tab bar) */}
      <nav className="hidden lg:block border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="text-[15px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            </Link>

            {/* View switcher — Today / Pipeline / Table */}
            <div
              className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border-gray"
              style={{ background: 'var(--surface-gray)' }}
            >
              {([
                { k: 'today' as const,    label: 'Today',    icon: <Home size={12} aria-hidden /> },
                { k: 'pipeline' as const, label: 'Pipeline', icon: <LayoutDashboard size={12} aria-hidden /> },
                { k: 'table' as const,    label: 'List',     icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
              ] as const).map(({ k, label, icon }) => {
                const active = view === k;
                return (
                  <button
                    key={k}
                    onClick={() => { setView(k); capture('view_switched', { view: k }); }}
                    className="flex items-center gap-1.5 px-2.5 h-7 text-[12px] font-medium rounded-md transition-all"
                    style={{
                      background: active ? 'var(--card-bg)' : 'transparent',
                      color: active ? 'var(--brand-navy)' : 'var(--muted-text)',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border-gray)' : 'none',
                    }}
                  >
                    {icon}{label}
                  </button>
                );
              })}
            </div>

            {/* Page nav — Calendar & Interview */}
            <div className="flex items-center gap-0.5 border-l border-border-gray pl-4">
              {[
                { href: '/calendar',  label: 'Calendar',  icon: <Calendar size={13} aria-hidden /> },
                { href: '/interview', label: 'Interview',  icon: <Mic size={13} aria-hidden /> },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors hover:text-brand-navy"
                  style={{ color: 'var(--muted-text)' }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view !== 'today' && (
              <button
                onClick={() => { setAddModalInitialUrl(''); setShowAddModal(true); }}
                className="h-8 px-3.5 text-[13px] font-medium rounded-md flex items-center gap-1.5 flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: 'var(--brand-navy)', color: 'var(--background)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
                <kbd className="hidden lg:inline-flex items-center px-1 rounded text-[10px] ml-0.5" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', fontFamily: 'inherit', lineHeight: '1.6' }}>N</kbd>
              </button>
            )}
            {user?.name && (
              <span className="text-sm text-muted-text hidden md:block">Hi, {user.name.split(' ')[0]}</span>
            )}
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
                style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
              >
                Upgrade
              </button>
            )}
            {user && <NotificationBell userId={user.id} applications={applications} onOpenApp={handleCardClick} />}
            {applications.length > 0 && <StreakBadge onMilestone={msg => showToast(msg)} />}
            <ThemeToggle />
            <Link
              href="/settings"
              className="p-2 rounded-lg border border-transparent text-muted-text hover:text-accent-blue hover:bg-surface-gray transition-all"
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="text-xs text-muted-text hover:text-body-text transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {view === 'today' ? (
        <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-mobile-nav lg:pb-6">
          {!isMobile && (
            <TodayView
              applications={displayApplications}
              userName={user?.name?.split(' ')[0]}
              onOpenApp={handleCardClick}
            />
          )}
          {isMobile && (
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
              ) : displayApplications.length === 0 ? (
                <EmptyState onAdd={() => { setAddModalInitialUrl(''); setShowAddModal(true); }} onAutofillUrl={handleAutofillUrl} hideExtensionHint={bannerVisible} />
              ) : (
                <MobileCardList
                  applications={filteredApps}
                  stages={stages as PipelineStage[]}
                  onCardClick={handleCardClick}
                  onStatusChange={(id, status) => handleStatusChange(id, status)}
                  onCardContextMenu={handleContextMenu}
                />
              )}
            </div>
          )}

          {/* Dashboard Footer */}
          <footer className="mt-20 py-8 border-t border-border-gray flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/settings" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Settings</Link>
              <Link href="/help" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Help Center</Link>
              <Link href="/contact" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Contact Support</Link>
              <Link href="/privacy" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Terms of Service</Link>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              © {new Date().getFullYear()} Applyd. All rights reserved.
            </p>
          </footer>
        </main>
      ) : (
        <>
          {/* PipelineBar — full width, directly under topbar */}
          {!loading && displayApplications.length > 0 && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <PipelineBar
                applications={displayApplications}
                stages={stages as PipelineStage[]}
                activeStage={statusFilter}
                onStageClick={s => setStatusFilter(s)}
              />
            </div>
          )}

          {/* Pipeline / List content */}
          {loading ? (
            <div style={{ padding: '20px 24px' }} className="flex gap-3 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 min-w-[160px] rounded-lg border border-border-gray p-3" style={{ background: 'var(--card-bg)' }}>
                  <div className="h-3 w-16 rounded mb-3 animate-pulse" style={{ background: 'var(--surface-gray)' }} />
                  {[...Array(i === 1 ? 3 : i === 0 ? 2 : 1)].map((_, j) => (
                    <div key={j} className="h-16 rounded-md mb-2 animate-pulse" style={{ background: 'var(--surface-gray)' }} />
                  ))}
                </div>
              ))}
            </div>
          ) : displayApplications.length === 0 ? (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
              <EmptyState onAdd={() => { setAddModalInitialUrl(''); setShowAddModal(true); }} onAutofillUrl={handleAutofillUrl} hideExtensionHint={bannerVisible} />
            </div>
          ) : filteredApps.length === 0 ? (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
              <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--brand-navy)' }}>No matches</h3>
              <p className="text-[12px] mb-4" style={{ color: 'var(--muted-text)' }}>Try adjusting your filters.</p>
              <button
                onClick={() => { setStatusFilter('all'); setHideInactive(true); }}
                className="inline-flex items-center h-8 px-3 text-[12px] font-medium rounded-md border border-border-gray transition-colors hover:bg-surface-gray"
                style={{ color: 'var(--muted-text)' }}
              >
                Clear filters
              </button>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '16px' }}>
              <MobileCardList
                applications={filteredApps}
                stages={stages as PipelineStage[]}
                onCardClick={handleCardClick}
                onStatusChange={(id, status) => handleStatusChange(id, status)}
                onCardContextMenu={handleContextMenu}
              />
            </div>
          ) : view === 'pipeline' ? (
            <div data-tutorial-id="pipeline-board">
              <PipelineView
                applications={filteredApps}
                stages={stages as PipelineStage[]}
                onCardClick={handleCardClick}
                onStatusChange={(id, status) => handleStatusChange(id, status)}
                onCardContextMenu={handleContextMenu}
              />
            </div>
          ) : (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 80px' }}>
              <TableView
                applications={filteredApps}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={handleCardClick}
                onRowContextMenu={handleContextMenu}
              />
            </div>
          )}
        </>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-gray shadow-lg" style={{ background: 'var(--brand-navy)', color: '#fff' }}>
          <span className="text-[12px] font-medium mr-1">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value as PipelineStage | '')}
            className="bg-white/10 border border-white/20 text-white text-[12px] rounded-md px-2 h-7 focus:outline-none"
          >
            <option value="">Move to…</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleBulkStatusUpdate}
            disabled={!bulkStatus}
            className="px-3 h-7 bg-accent-blue text-white text-[12px] font-medium rounded-md disabled:opacity-40 transition-colors"
          >
            Apply
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button onClick={handleBulkDelete} className="px-3 h-7 bg-red-500 text-white text-[12px] font-medium rounded-md hover:bg-red-600 transition-colors">
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-1 text-white/60 hover:text-white text-[12px]">
            ✕
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AddApplicationModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setAddModalInitialUrl(''); }}
        onSave={handleAddSave}
        stages={stages as PipelineStage[]}
        initialJobLink={addModalInitialUrl}
        userId={user?.id}
        isPro={userIsPro}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* CSV Import Modal */}
      <ImportCSVModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        stages={stages as PipelineStage[]}
        onImport={async rows => {
          for (const row of rows) {
            try {
              await addApplication({ ...row, recruiter_name: '', recruiter_email: '', interview_steps: [] });
            } catch { /* skip rows that fail */ }
          }
        }}
      />

      {/* Detail Drawer */}
      <ApplicationDrawer
        key={selectedApp?.id}
        application={selectedApp}
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedApp(null); }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        stages={stages as PipelineStage[]}
        userId={user?.id}
        isPro={userIsPro}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={applications.length >= FREE_TIER_LIMIT ? 'cap' : 'billing'}
      />

      {/* Pro Tour — shown once on first upgrade, walks through all 5 AI features */}
      {showProWelcome && (
        <ProTour
          onDone={() => {
            localStorage.setItem('pro_welcome_shown', '1');
            setShowProWelcome(false);
            setUpgradedSuccess(true);
          }}
        />
      )}

      {showReferralWelcome && (
        <ReferralWelcomeModal
          onDone={() => {
            localStorage.setItem('ref_welcome_shown', '1');
            setShowReferralWelcome(false);
          }}
        />
      )}

      {/* First-app celebration tooltip — appears once, fades after 5s */}
      {showFirstAppTip && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-5 py-3.5 rounded-xl shadow-2xl fade-in"
          style={{ background: '#111827', color: '#fff', fontSize: 13, textAlign: 'center', lineHeight: 1.5, maxWidth: 340, width: 'calc(100% - 2rem)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <div style={{ color: '#4ADE80', fontWeight: 700, marginBottom: 2 }}>✓ Your pipeline is live.</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Keep adding applications — the more you track, the smarter Applyd gets.</div>
        </div>
      )}

      {/* In-app feedback prompt — fires after 5th application, once per user */}
      {user?.id && !isActive && (
        <FeedbackPrompt
          userId={user.id}
          applicationCount={applications.length}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [checkingLegacy, setCheckingLegacy] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkRoute() {
      if (loading) return;
      if (!user) {
        if (active) {
          setCheckingLegacy(false);
          router.replace('/login');
        }
        return;
      }

      if (user.onboarding_complete) {
        if (active) setCheckingLegacy(false);
        return;
      }

      // Check if legacy user with existing applications
      const { data } = await supabase.from('applications').select('id').eq('user_id', user.id).limit(1);

      if (!active) return;

      if (data && data.length > 0) {
        updateProfile({ onboarding_complete: true });
        setCheckingLegacy(false);
      } else {
        setCheckingLegacy(false);
        router.replace('/onboarding');
      }
    }

    checkRoute();

    return () => { active = false; };
  }, [user, loading, router, updateProfile]);

  if (loading || checkingLegacy || !user || !user.onboarding_complete) {
    return (
      <div className="min-h-screen bg-background">
        {/* Nav skeleton */}
        <div className="border-b border-border-gray bg-background h-[52px] flex items-center px-4 md:px-6 max-w-[1200px] mx-auto gap-3">
          <div className="w-7 h-7 rounded-[7px] bg-surface-gray animate-pulse" />
          <div className="w-16 h-4 rounded bg-surface-gray animate-pulse" />
          <div className="ml-auto flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-gray animate-pulse" />
            <div className="w-14 h-4 rounded bg-surface-gray animate-pulse self-center" />
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="mb-6 w-48 h-6 rounded bg-surface-gray animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg p-4 bg-card-bg border border-border-gray">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 rounded bg-surface-gray animate-pulse" />
                  <div className="w-20 h-3 rounded bg-surface-gray animate-pulse" />
                </div>
                <div className="w-10 h-7 rounded bg-surface-gray animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="min-w-[180px] w-[180px] flex-shrink-0">
                <div className="w-full h-3 rounded bg-surface-gray animate-pulse mb-3" />
                <div className="space-y-2">
                  {[...Array(i % 2 === 0 ? 3 : 2)].map((_, j) => (
                    <div key={j} className="h-16 rounded-xl bg-surface-gray animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider userId={user.id} isPro={checkIsPro(user)}>
      <ExtensionStatusProvider>
        <DashboardContent />
      </ExtensionStatusProvider>
    </StoreProvider>
  );
}
