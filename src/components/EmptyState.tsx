import { FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 border-2 border-dashed border-border-gray rounded-2xl bg-surface-gray/30 fade-in">
      <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mb-6">
        <FolderPlus size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-brand-navy mb-2 tracking-tight">Your pipeline is empty</h3>
      <p className="text-sm text-muted-text text-center max-w-sm mb-8 leading-relaxed">
        You haven&apos;t tracked any applications yet. Add your first job or internship to start visualizing your success.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-accent-blue text-white text-sm font-medium rounded-xl hover:bg-accent-blue/90 shadow-sm transition-all transform hover:scale-[1.02] flex items-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Log First Application
      </button>
    </div>
  );
}
