interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 mt-8 rounded-2xl bg-gradient-to-b from-accent-blue/5 to-transparent border border-accent-blue/10 fade-in">
      <div className="w-14 h-14 rounded-2xl bg-accent-blue flex items-center justify-center mb-6 shadow-lg shadow-accent-blue/20">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h3 className="text-2xl font-semibold text-brand-navy mb-2 tracking-tight">Your offer starts here</h3>
      <p className="text-sm text-muted-text text-center max-w-xs mb-8 leading-relaxed">
        Every offer begins with a single application. Add yours and Applyd will map your path to getting hired.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-accent-blue text-white text-sm font-semibold rounded-xl hover:bg-accent-blue/90 shadow-md shadow-accent-blue/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Start Your Journey
      </button>
      <p className="text-xs text-muted-text/50 mt-4">Takes 30 seconds to add your first application</p>
    </div>
  );
}
