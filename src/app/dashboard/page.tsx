'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTERNSHIP_STAGES, JOB_STAGES } from '@/lib/constants';
import { Application, PipelineStage, Category } from '@/lib/types';
import StatsBar from '@/components/StatsBar';
import { Logo } from '@/components/Logo';
import PipelineView from '@/components/PipelineView';
import TableView from '@/components/TableView';
import FunnelChart from '@/components/FunnelChart';
import AddApplicationModal from '@/components/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import EmptyState from '@/components/EmptyState';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, addApplication, updateApplication, deleteApplication, storeError, clearStoreError } = useStore();
  const router = useRouter();

  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [search, setSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PipelineStage | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PipelineStage | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialUrl, setAddModalInitialUrl] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDeleteRef = useRef<{ id: string; app: Application } | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stages = user?.mode === 'job' ? JOB_STAGES : INTERNSHIP_STAGES;
  const inactiveStatuses = ['Rejected', 'Declined'];

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (hideInactive && inactiveStatuses.includes(app.status)) return false;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!app.company.toLowerCase().includes(q) && !app.role.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [applications, search, hideInactive, statusFilter]);

  const hiddenCount = useMemo(() =>
    applications.filter(a => inactiveStatuses.includes(a.status)).length,
  [applications]);

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
    await addApplication({
      ...data,
      recruiter_name: '',
      recruiter_email: '',
    });
    showToast(`${data.company} added`);
  };

  // Drawer edits — silent, no toast
  const handleUpdate = (id: string, updates: Partial<Application>) => {
    updateApplication(id, updates).catch(() => {});
    setSelectedApp(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  // Drag-and-drop status change — shows toast
  const handleStatusChange = (id: string, status: PipelineStage) => {
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

  const handleAutofillUrl = (url: string) => {
    setAddModalInitialUrl(url);
    setShowAddModal(true);
  };

  // Listen for command palette "Add Application"
  useEffect(() => {
    const handler = () => { setAddModalInitialUrl(''); setShowAddModal(true); };
    document.addEventListener('applyd:add', handler);
    return () => document.removeEventListener('applyd:add', handler);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Store error banner */}
      {storeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {storeError}
          <button onClick={clearStoreError} className="ml-1 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toast}
        onDismiss={() => { setToast(null); setToastUndo(null); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }}
        onUndo={toastUndo ?? undefined}
      />

      {/* Top nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[52px]">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} variant="dark" />
            <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          </Link>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="text-sm text-muted-text hidden md:block">Hi, {user.name}</span>
            )}
            {/* Quick add */}
            <button
              onClick={() => { setAddModalInitialUrl(''); setShowAddModal(true); }}
              className="hidden md:flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium text-white rounded-md transition-colors bg-accent-blue hover:bg-accent-blue-hover"
              aria-label="Add application"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
            {/* Cmd+K hint */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
              className="hidden md:flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-border-gray transition-colors"
              style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
              aria-label="Open command palette"
            >
              ⌘K
            </button>
            <ThemeToggle />
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="text-xs text-muted-text hover:text-body-text transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            {user?.name ? (
              <>
                {user.name.split(' ')[0]}{' '}
                <span className="font-normal" style={{ color: 'var(--muted-text)' }}>
                  {(() => {
                    const submitted = applications.filter(a => a.status !== 'Wishlist').length;
                    const inInterviews = applications.filter(a => ['OA / Online Assessment','Phone / Recruiter Screen','Final Round Interviews','Recruiter Screen','Technical / Case Interview','Final Round','Offer — Negotiating'].includes(a.status)).length;
                    if (applications.length === 0) return '— start tracking and see where things land.';
                    if (inInterviews > 0) return `— ${inInterviews} interview${inInterviews !== 1 ? 's' : ''} in play.`;
                    if (submitted === 1) return '— 1 application out.';
                    return `— ${submitted} applications out.`;
                  })()}
                </span>
              </>
            ) : (
              <span className="font-normal" style={{ color: 'var(--muted-text)' }}>
                {(() => {
                  const submitted = applications.filter(a => a.status !== 'Wishlist').length;
                  const inInterviews = applications.filter(a => ['OA / Online Assessment','Phone / Recruiter Screen','Final Round Interviews','Recruiter Screen','Technical / Case Interview','Final Round','Offer — Negotiating'].includes(a.status)).length;
                  if (applications.length === 0) return 'Start tracking and see where things land.';
                  if (inInterviews > 0) return `${inInterviews} interview${inInterviews !== 1 ? 's' : ''} in play.`;
                  if (submitted === 1) return '1 application out.';
                  return `${submitted} applications out.`;
                })()}
              </span>
            )}
          </h1>
        </div>

        {/* Stats */}
        <StatsBar applications={applications} />

        {/* Funnel */}
        <FunnelChart applications={applications} />

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* View toggle — hidden on mobile */}
            <div className="hidden lg:flex border border-border-gray rounded-md p-0.5 flex-shrink-0" style={{ background: 'var(--surface-gray)' }}>
              <button
                onClick={() => setView('pipeline')}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors ${view === 'pipeline' ? 'bg-card-bg text-brand-navy' : 'text-muted-text'}`}
              >Pipeline</button>
              <button
                onClick={() => setView('table')}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors ${view === 'table' ? 'bg-card-bg text-brand-navy' : 'text-muted-text'}`}
              >Table</button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search company or role…"
                className="w-full h-9 pl-9 pr-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PipelineStage | 'all')}
              className="h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-colors flex-shrink-0"
              style={{ color: 'var(--muted-text)' }}
            >
              <option value="all">All statuses</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Hide inactive toggle */}
            <button
              onClick={() => setHideInactive(h => !h)}
              className="h-9 px-3 text-[12px] font-medium border rounded-md flex-shrink-0 transition-colors"
              style={hideInactive
                ? { background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }
                : { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' }}
            >
              {hideInactive ? `${hiddenCount} hidden` : 'Showing all'}
            </button>

            {/* Add button */}
            <button
              onClick={() => { setAddModalInitialUrl(''); setShowAddModal(true); }}
              className="sm:ml-auto h-9 px-4 text-[13px] font-medium text-white rounded-md flex items-center gap-1.5 flex-shrink-0 transition-colors bg-accent-blue hover:bg-accent-blue-hover"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1">
          {applications.length === 0 ? (
            <EmptyState onAdd={() => { setAddModalInitialUrl(''); setShowAddModal(true); }} onAutofillUrl={handleAutofillUrl} />
          ) : filteredApps.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border-gray rounded-lg">
              <h3 className="text-[13px] font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>No matches</h3>
              <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Try adjusting your filters.</p>
            </div>
          ) : view === 'pipeline' ? (
            <PipelineView
              applications={filteredApps}
              stages={stages as PipelineStage[]}
              onCardClick={handleCardClick}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
            />
          ) : (
            <TableView
              applications={filteredApps}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={handleCardClick}
            />
          )}
        </div>

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

        {/* Dashboard Footer */}
        <footer className="mt-20 py-8 border-t border-border-gray flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/help" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Help Center</Link>
            <Link href="/contact" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Contact Support</Link>
            <Link href="/privacy" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-[10px] text-muted-text/50 font-medium tracking-wider uppercase">© {new Date().getFullYear()} Applyd — Made for Students</p>
        </footer>
      </main>

      {/* Add Modal */}
      <AddApplicationModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setAddModalInitialUrl(''); }}
        onSave={handleAddSave}
        stages={stages as PipelineStage[]}
        initialJobLink={addModalInitialUrl}
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
      />
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
    <StoreProvider userId={user.id}>
      <DashboardContent />
    </StoreProvider>
  );
}
