'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { INTERNSHIP_STAGES, JOB_STAGES, CATEGORIES } from '@/lib/constants';
import { Application, PipelineStage, Category } from '@/lib/types';
import StatsBar from '@/components/StatsBar';
import PipelineView from '@/components/PipelineView';
import TableView from '@/components/TableView';
import AddApplicationModal from '@/components/AddApplicationModal';
import ApplicationDrawer from '@/components/ApplicationDrawer';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { applications, addApplication, updateApplication, deleteApplication } = useStore();
  const router = useRouter();

  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
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
      if (categoryFilter !== 'all' && app.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [applications, search, categoryFilter]);

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
    updateApplication(id, updates);
    // Refresh the selected app reference
    setSelectedApp(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-border-gray bg-white sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-blue flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-brand-navy tracking-tight">Folio</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="text-sm text-muted-text hidden md:block">Hi, {user.name}</span>
            )}
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
        {/* Stats */}
        <StatsBar applications={applications} />

        {/* Controls */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* View toggle */}
          <div className="flex bg-surface-gray rounded-lg p-0.5">
            <button
              onClick={() => setView('pipeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'pipeline'
                  ? 'bg-white text-brand-navy shadow-sm'
                  : 'text-muted-text hover:text-body-text'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Pipeline
              </span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'table'
                  ? 'bg-white text-brand-navy shadow-sm'
                  : 'text-muted-text hover:text-body-text'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Table
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
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

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface-gray text-muted-text hover:text-body-text'
              }`}
            >
              All
            </button>
            {CATEGORIES.slice(0, 4).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === c
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-gray text-muted-text hover:text-body-text'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors flex items-center gap-1.5 shadow-sm flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Application
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {view === 'pipeline' ? (
            <PipelineView
              applications={filteredApps}
              stages={stages as PipelineStage[]}
              onCardClick={handleCardClick}
            />
          ) : (
            <TableView
              applications={filteredApps}
              onRowClick={handleCardClick}
            />
          )}
        </div>
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
        onDelete={deleteApplication}
        stages={stages as PipelineStage[]}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace('/login');
    } else if (!loading && user && !user.onboarding_complete) {
      window.location.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user || !user.onboarding_complete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
