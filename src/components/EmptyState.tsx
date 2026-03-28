'use client';

import { useState } from 'react';
import { STAGE_COLORS } from '@/lib/constants';
import { useExtensionStatus } from '@/lib/extension-status-context';

const GHOST_STAGES = ['Wishlist', 'Applied', 'OA / Online Assessment', 'Phone / Recruiter Screen', 'Offer'];

interface EmptyStateProps {
  onAdd: () => void;
  onAutofillUrl?: (url: string) => void;
  hideExtensionHint?: boolean;
}

export default function EmptyState({ onAdd, onAutofillUrl, hideExtensionHint }: EmptyStateProps) {
  const { isInstalled } = useExtensionStatus();
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
        {GHOST_STAGES.map((stage, i) => {
          const color = STAGE_COLORS[stage] || '#6B7280';
          return (
            <div key={stage} className="flex-1 rounded-lg border border-border-gray p-1.5" style={{ background: 'var(--card-bg)' }}>
              <div className="flex items-center gap-1 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="h-1.5 rounded flex-1" style={{ background: 'var(--surface-gray)' }} />
              </div>
              {Array.from({ length: i === 0 ? 2 : i === 1 ? 3 : 1 }).map((_, j) => (
                <div key={j} className="h-8 rounded border border-border-gray mb-1.5 last:mb-0" style={{ background: 'var(--background)' }} />
              ))}
            </div>
          );
        })}
      </div>

      <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
        Your pipeline is empty
      </h3>
      <p className="text-[13px] text-center max-w-xs mb-6" style={{ color: 'var(--muted-text)' }}>
        Paste a job link below to autofill the details, or add an application manually.
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
            className="h-9 px-3 text-[13px] font-medium text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-blue hover:bg-accent-blue-hover"
          >
            Autofill
          </button>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="h-8 px-3 text-[12px] font-medium rounded-md border border-border-gray transition-colors"
        style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
      >
        or add manually
      </button>

      {/* Extension hint — only if banner isn't already showing and extension not installed */}
      {!hideExtensionHint && !isInstalled && (
        <p className="mt-5 text-[11px] text-center max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
          Already found jobs to apply to? The{' '}
          <a
            href="https://chromewebstore.google.com/detail/applyd"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--muted-text)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Applyd extension
          </a>
          {' '}lets you log them directly from LinkedIn or Handshake in one click.
        </p>
      )}
    </div>
  );
}
