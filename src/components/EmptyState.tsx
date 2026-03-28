'use client';

import { useState } from 'react';

interface EmptyStateProps {
  onAdd: () => void;
  onAutofillUrl?: (url: string) => void;
}

export default function EmptyState({ onAdd, onAutofillUrl }: EmptyStateProps) {
  const [url, setUrl] = useState('');

  const isValidUrl = (u: string) => { try { new URL(u); return true; } catch { return false; } };

  const handleAutofill = () => {
    if (isValidUrl(url) && onAutofillUrl) {
      onAutofillUrl(url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 mt-4 rounded-lg border border-dashed border-border-gray fade-in">
      {/* Ghost pipeline preview */}
      <div className="flex gap-2 mb-8 w-full max-w-sm opacity-40 pointer-events-none" aria-hidden>
        {['#8B5CF6', '#2563EB', '#06B6D4', '#F59E0B', '#1D9E75'].map((color, i) => (
          <div key={color} className="flex-1 rounded-lg border border-border-gray p-1.5" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="h-1.5 rounded flex-1" style={{ background: 'var(--surface-gray)' }} />
            </div>
            {Array.from({ length: i === 0 ? 2 : i === 1 ? 3 : 1 }).map((_, j) => (
              <div key={j} className="h-8 rounded border border-border-gray mb-1.5 last:mb-0" style={{ background: 'var(--background)' }} />
            ))}
          </div>
        ))}
      </div>

      <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
        Your pipeline is empty
      </h3>
      <p className="text-[13px] text-center max-w-xs mb-6" style={{ color: 'var(--muted-text)' }}>
        Paste a job link below to get started, or add an application manually.
      </p>

      {/* URL autofill input */}
      <div className="w-full max-w-sm mb-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAutofill(); }}
            placeholder="Paste a job URL to autofill →"
            className="flex-1 h-9 px-3 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary transition-colors"
          />
          <button
            onClick={handleAutofill}
            disabled={!isValidUrl(url)}
            className="h-9 px-3 text-[13px] font-medium text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-blue)' }}
          >
            Autofill
          </button>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="text-[13px] font-medium transition-colors hover:underline"
        style={{ color: 'var(--muted-text)' }}
      >
        or add manually
      </button>
    </div>
  );
}
