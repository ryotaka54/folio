'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INTERNSHIP_STAGES, JOB_STAGES } from '@/lib/constants';
import { Application, PipelineStage, Category } from '@/lib/types';
import StatsBar from '@/components/StatsBar';
import PipelineView from '@/components/PipelineView';
import TableView from '@/components/TableView';
import FunnelChart from '@/components/FunnelChart';
import AddApplicationModal from '@/components/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import EmptyState from '@/components/EmptyState';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

  const handleUpdate = (id: string, updates: Partial<Application>) => {
    updateApplication(id, updates).catch(() => {});
    setSelectedApp(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    setShowDrawer(false);
    setSelectedApp(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Store error banner */}
      {storeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {storeError}
          <button onClick={clearStoreError} className="ml-1 hover:opacity-75">✕</button>
        </div>
      )}
      {/* Success toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}
      {/* Top nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--brand-navy)' }}>Applyd</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="text-sm text-muted-text hidden md:block">Hi, {user.name}</span>
            )}
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
            {user?.name ? user.name.split(' ')[0] : 'Hey'}{' '}
            <span className="text-muted-text font-normal">
              {(() => {
                const submitted = applications.filter(a => a.status !== 'Wishlist').length;
                const inInterviews = applications.filter(a => ['OA / Online Assessment','Phone / Recruiter Screen','Final Round Interviews','Recruiter Screen','Technical / Case Interview','Final Round','Offer — Negotiating'].includes(a.status)).length;
                if (applications.length === 0) return '— start tracking and see where things land.';
                if (inInterviews > 0) return `— ${inInterviews} interview${inInterviews !== 1 ? 's' : ''} in play.`;
                if (submitted === 1) return '— 1 application out.';
                return `— ${submitted} applications out.`;
              })()}
            </span>
          </h1>
        </div>
        {/* Stats */}
        <StatsBar applications={applications} />

        {/* Gamified Pipeline Funnel */}
        <FunnelChart applications={applications} />

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* View toggle */}
            <div className="flex border border-border-gray rounded-md p-0.5 flex-shrink-0" style={{ background: 'var(--surface-gray)' }}>
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
              onClick={() => setShowAddModal(true)}
              className="sm:ml-auto h-9 px-4 text-[13px] font-medium text-white rounded-md flex items-center gap-1.5 flex-shrink-0 transition-colors"
              style={{ background: 'var(--accent-blue)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-blue-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-blue)')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1">
          {applications.length === 0 ? (
            <EmptyState onAdd={() => setShowAddModal(true)} />
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
              onStatusChange={(id, status) => handleUpdate(id, { status })}
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
          <p className="text-[10px] text-muted-text/50 font-medium tracking-wider uppercase">© 2026 Applyd — Made for Students</p>
        </footer>
      </main>

      {/* Add Modal */}
      <AddApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSave}
        stages={stages as PipelineStage[]}
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
        // Auto-complete onboarding for legacy power users
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
        <div className="border-b border-border-gray bg-background h-14 sm:h-16 flex items-center px-4 md:px-6 max-w-[1200px] mx-auto gap-3">
          <div className="w-6 h-6 rounded bg-surface-gray animate-pulse" />
          <div className="w-16 h-4 rounded bg-surface-gray animate-pulse" />
          <div className="ml-auto flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-gray animate-pulse" />
            <div className="w-14 h-4 rounded bg-surface-gray animate-pulse self-center" />
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          {/* Greeting skeleton */}
          <div className="mb-6 w-48 h-6 rounded bg-surface-gray animate-pulse" />
          {/* Stats skeleton */}
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
          {/* Pipeline skeleton */}
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
