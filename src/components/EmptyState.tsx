interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 mt-6 rounded-lg border border-border-gray fade-in">
      <div
        className="w-10 h-10 rounded-lg border border-border-gray flex items-center justify-center mb-5"
        style={{ background: 'var(--surface-gray)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
        No applications yet
      </h3>
      <p className="text-[13px] text-center max-w-xs mb-6" style={{ color: 'var(--muted-text)' }}>
        Add your first application to start tracking your job search.
      </p>
      <button
        onClick={onAdd}
        className="h-9 px-4 text-[13px] font-medium text-white rounded-md transition-colors flex items-center gap-1.5"
        style={{ background: 'var(--accent-blue)' }}
        onMouseEnter={e => ((e.target as HTMLElement).style.background = 'var(--accent-blue-hover)')}
        onMouseLeave={e => ((e.target as HTMLElement).style.background = 'var(--accent-blue)')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Application
      </button>
    </div>
  );
}
