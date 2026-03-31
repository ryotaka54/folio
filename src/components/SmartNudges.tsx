'use client';

import { useState, useEffect, useCallback } from 'react';
import { computeNudges, dismissNudge, type Nudge } from '@/lib/recruiting';
import type { Application } from '@/lib/types';

interface Props {
  applications: Application[];
  onAddApp?: () => void;
  onOpenApp?: (id: string) => void;
}

export default function SmartNudges({ applications, onAddApp, onOpenApp }: Props) {
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    setNudges(computeNudges(applications));
  }, [applications]);

  const dismiss = useCallback((id: string) => {
    dismissNudge(id);
    setNudges(prev => prev.filter(n => n.id !== id));
  }, []);

  if (nudges.length === 0) return null;

  return (
    <div className="mb-4 space-y-2 fade-in">
      {nudges.map(nudge => (
        <div
          key={nudge.id}
          className="flex items-start gap-3 px-4 py-3 rounded-lg border"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>💡</span>
          <p className="flex-1 text-[12px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
            {nudge.message}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {nudge.action && (
              <button
                onClick={() => { nudge.appId ? onOpenApp?.(nudge.appId) : onAddApp?.(); dismiss(nudge.id); }}
                className="text-[11px] font-medium underline underline-offset-2 transition-colors"
                style={{ color: 'var(--accent-blue)' }}
              >
                {nudge.action}
              </button>
            )}
            {nudge.appId && !nudge.action && (
              <button
                onClick={() => { onOpenApp?.(nudge.appId!); dismiss(nudge.id); }}
                className="text-[11px] font-medium underline underline-offset-2 transition-colors"
                style={{ color: 'var(--accent-blue)' }}
              >
                View
              </button>
            )}
            <button
              onClick={() => dismiss(nudge.id)}
              className="text-[13px] leading-none transition-opacity hover:opacity-60"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
