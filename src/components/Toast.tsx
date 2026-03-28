'use client';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  onUndo?: () => void;
}

export default function Toast({ message, onDismiss, onUndo }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border-gray shadow-lg fade-in pointer-events-auto"
      style={{ background: 'var(--brand-navy)', color: '#fff' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-[13px] font-medium">{message}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          className="text-[12px] font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
