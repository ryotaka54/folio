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
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const stages = user?.mode === 'job' ? JOB_STAGES : INTERNSHIP_STAGES;

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (search) {
        const q = search.toLowerCase();
        if (!app.company.toLowerCase().includes(q) && !app.role.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [applications, search]);

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
            {user?.name ? `Hey ${user.name.split(' ')[0]} —` : 'Hey —'}{' '}
            <span className="text-muted-text font-normal">
              {applications.length === 0
                ? 'your next offer is one application away.'
                : applications.filter(a => ['OA / Online Assessment','Phone / Recruiter Screen','Final Round Interviews','Recruiter Screen','Technical / Case Interview','Final Round','Offer — Negotiating'].includes(a.status)).length > 0
                  ? "you're in the interview stage. Stay sharp."
                  : `you have ${applications.filter(a => a.status !== 'Wishlist').length} application${applications.filter(a => a.status !== 'Wishlist').length !== 1 ? 's' : ''} out there. Keep pushing.`
              }
            </span>
          </h1>
        </div>
        {/* Stats */}
        <StatsBar applications={applications} />

        {/* Gamified Pipeline Funnel */}
        <FunnelChart applications={applications} />

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View toggle */}
            <div className="flex bg-surface-gray rounded-lg p-0.5 flex-1 sm:flex-none">
              <button
                onClick={() => setView('pipeline')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === 'pipeline'
                    ? 'bg-card-bg text-brand-navy shadow-sm'
                    : 'text-muted-text hover:text-body-text'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Pipeline
                </span>
              </button>
              <button
                onClick={() => setView('table')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === 'table'
                    ? 'bg-card-bg text-brand-navy shadow-sm'
                    : 'text-muted-text hover:text-body-text'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Table
                </span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-9 pr-3 py-1.5 border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="sm:ml-auto w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] sm:flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Application
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 flex-1">
          {applications.length === 0 ? (
            <EmptyState onAdd={() => setShowAddModal(true)} />
          ) : filteredApps.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border-gray rounded-xl bg-card-bg/30">
               <h3 className="text-sm font-medium text-brand-navy mb-1">No matches found</h3>
               <p className="text-xs text-muted-text">Try tweaking your search or category filters.</p>
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
              onRowClick={handleCardClick}
            />
          )}
        </div>

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
