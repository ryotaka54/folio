'use client';

import { STAGE_COLORS } from '@/lib/constants';
import { Sparkles } from 'lucide-react';

const GHOST_STAGES = ['Wishlist', 'Applied', 'OA / Online Assessment', 'Phone / Recruiter Screen', 'Offer'];

interface EmptyStateProps {
  onAdd: () => void;
  onAutofillUrl?: (url: string) => void;
  hideExtensionHint?: boolean;
}

export default function EmptyState({ onAdd, hideExtensionHint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 mt-4">

      {/* Ghost pipeline preview — desktop only */}
      <div className="hidden sm:flex gap-2 mb-8 w-full max-w-sm opacity-40 pointer-events-none" aria-hidden>
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

      {/* Mobile illustration */}
      <div className="sm:hidden mb-8 flex items-end gap-3 opacity-40 pointer-events-none" aria-hidden>
        {['#8B5CF6', '#2563EB', '#06B6D4', '#F59E0B', '#1D9E75'].map((color, i) => (
          <div
            key={i}
            className="w-8 rounded-lg"
            style={{ height: [48, 72, 56, 88, 40][i], backgroundColor: color, opacity: 0.6 }}
          />
        ))}
      </div>

      {/* Headline */}
      <h3 className="text-[20px] sm:text-[16px] font-bold mb-2 text-center" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
        Ready to start recruiting?
      </h3>
      <p className="text-[14px] sm:text-[13px] text-center max-w-xs mb-1" style={{ color: 'var(--muted-text)' }}>
        Add your first application and Applyd starts working for you.
      </p>

      {/* AI features teaser */}
      <div className="flex items-center gap-1.5 mb-7 mt-1">
        <Sparkles size={11} style={{ color: 'var(--accent-blue)' }} />
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          AI interview prep, follow-up emails &amp; coaching — automatically.
        </p>
      </div>

      {/* Primary CTA — full width on mobile */}
      <button
        onClick={onAdd}
        className="w-full sm:w-auto sm:px-6 rounded-xl sm:rounded-md font-semibold text-white transition-colors active:opacity-80"
        style={{ background: 'var(--accent-blue)', minHeight: 56, fontSize: 16 }}
      >
        Add Application
      </button>

      <p className="mt-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        Takes 30 seconds. No spreadsheet needed.
      </p>

      {!hideExtensionHint && (
        <p className="mt-6 text-[11px] text-center max-w-xs hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
          Already found jobs? The{' '}
          <a
            href="https://chromewebstore.google.com/detail/ggmjnghbacddpbgimenpickockijboao"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-compact"
            style={{ color: 'var(--muted-text)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Applyd extension
          </a>
          {' '}logs them directly from LinkedIn or Handshake in one click.
        </p>
      )}
    </div>
  );
}
