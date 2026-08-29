'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AILoadingStateProps {
  /** A static status label, or a list to cycle through (e.g. "Researching…", "Drafting…"). */
  label?: string | string[];
  /** Number of shimmer content lines to render below the label. 0 = label only. */
  lines?: number;
  className?: string;
}

/**
 * Shared loading treatment for every AI-generation surface (interview
 * questions, follow-up emails, strength signal, offer intel, weekly coach).
 * Replaces five independently-duplicated `Skeleton()` pulse-bar functions
 * and gives the user real context instead of a bare spinner, per the
 * "no spinners with no context" rule.
 */
export function AILoadingState({ label, lines = 3, className }: AILoadingStateProps) {
  const messages = Array.isArray(label) ? label : label ? [label] : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 1400);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className={cn('flex flex-col gap-3', className)} role="status" aria-live="polite">
      {messages.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] font-medium text-muted">
          <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-accent animate-pulse" aria-hidden />
          {messages[idx]}
        </div>
      )}
      {lines > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-3"
              style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
