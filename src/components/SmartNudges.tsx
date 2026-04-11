'use client';

import { useState, useEffect, useCallback } from 'react';
import { computeNudges, dismissNudge, type Nudge } from '@/lib/recruiting';
import type { Application } from '@/lib/types';
import { Lightbulb } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  applications: Application[];
  onAddApp?: () => void;
  onOpenApp?: (id: string) => void;
}

export default function SmartNudges({ applications, onAddApp, onOpenApp }: Props) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    setNudges(computeNudges(applications));
  }, [applications]);

  const dismiss = useCallback((id: string) => {
    dismissNudge(id);
    setNudges(prev => prev.filter(n => n.id !== id));
  }, []);

  if (nudges.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <AnimatePresence mode="sync">
        {nudges.map((nudge, i) => (
          <motion.div
            key={nudge.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 8 }}
            transition={reduce
              ? { duration: 0.01 }
              : { duration: 0.24, delay: i * 0.08, ease: 'easeOut' }
            }
            className="flex items-start gap-3 px-4 py-3 rounded-lg border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
          >
            <Lightbulb size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }} />
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
