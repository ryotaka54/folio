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

  const [view, setView] = useState<'pipeline' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PipelineStage | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PipelineStage | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

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

  const handleAddSave = async (data: {
    company: string;
    role: string;
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
      {/* Top nav */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-lg font-semibold text-brand-navy tracking-tight">Applyd</span>
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
          <h1 className="text-xl font-semibold text-brand-navy tracking-tight">
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
            <div className="flex bg-surface-gray rounded-lg p-0.5 flex-shrink-0">
              <button onClick={() => setView('pipeline')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'pipeline' ? 'bg-card-bg text-brand-navy shadow-sm' : 'text-muted-text hover:text-body-text'}`}>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Pipeline
                </span>
              </button>
              <button onClick={() => setView('table')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'table' ? 'bg-card-bg text-brand-navy shadow-sm' : 'text-muted-text hover:text-body-text'}`}>
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Table
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company or role..." className="w-full pl-9 pr-3 py-1.5 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue" />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PipelineStage | 'all')}
              className="py-1.5 px-3 border border-border-gray rounded-lg text-sm text-muted-text focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue bg-background flex-shrink-0"
            >
              <option value="all">All statuses</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Hide inactive toggle */}
            <button
              onClick={() => setHideInactive(h => !h)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 transition-colors ${
                hideInactive
                  ? 'bg-surface-gray border-border-gray text-muted-text'
                  : 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
              }`}
            >
              {hideInactive ? `${hiddenCount} hidden` : 'Showing all'}
            </button>

            {/* Add button */}
            <button onClick={() => setShowAddModal(true)} className="sm:ml-auto px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 flex items-center gap-1.5 shadow-sm active:scale-[0.98] flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1">
          {applications.length === 0 ? (
            <EmptyState onAdd={() => setShowAddModal(true)} />
          ) : filteredApps.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border-gray rounded-xl bg-card-bg/30">
              <h3 className="text-sm font-medium text-brand-navy mb-1">No matches</h3>
              <p className="text-xs text-muted-text">Try adjusting your filters.</p>
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
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-brand-navy text-white px-4 py-2.5 rounded-2xl shadow-2xl">
            <span className="text-sm font-medium mr-1">{selectedIds.size} selected</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value as PipelineStage | '')}
              className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">Move to...</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus}
              className="px-3 py-1.5 bg-accent-blue text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:bg-accent-blue/80"
            >
              Apply
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="ml-1 text-white/60 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Footer */}
        <footer className="mt-20 py-8 border-t border-border-gray flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/help" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Help Center</Link>
            <Link href="/contact" className="text-xs font-medium text-muted-text hover:text-accent-blue transition-colors">Contact Support</Link>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-text text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <StoreProvider userId={user.id}>
      <DashboardContent />
    </StoreProvider>
  );
}
