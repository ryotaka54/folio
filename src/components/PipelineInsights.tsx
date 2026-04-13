'use client';

import { useMemo, useState } from 'react';
import type { Application } from '@/lib/types';
import { AlertTriangle, Clock, Zap, X, Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  applications: Application[];
  onOpenApp: (id: string) => void;
  onFollowUp: (app: Application) => void;
}

const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);
const STALE_DAYS = 14;
const DEADLINE_WARN_DAYS = 3;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((d.getTime() - Date.now()) / 86_400_000) + 1;
}

type InsightCard =
  | { kind: 'stale'; app: Application; days: number }
  | { kind: 'deadline'; app: Application; days: number }
  | { kind: 'no-activity'; daysSinceAny: number };

export default function PipelineInsights({ applications, onOpenApp, onFollowUp }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = useMemo<InsightCard[]>(() => {
    const active = applications.filter(a => !TERMINAL.has(a.status));
    const cards: InsightCard[] = [];

    // Upcoming deadlines (within DEADLINE_WARN_DAYS)
    for (const app of active) {
      if (!app.deadline) continue;
      const days = daysUntil(app.deadline);
      if (days >= 0 && days <= DEADLINE_WARN_DAYS) {
        cards.push({ kind: 'deadline', app, days });
      }
    }

    // Stale applications
    for (const app of active) {
      const ref = app.updated_at || app.created_at;
      if (!ref) continue;
      const days = daysSince(ref);
      if (days >= STALE_DAYS) {
        cards.push({ kind: 'stale', app, days });
      }
    }

    // No activity at all in STALE_DAYS days (only if there are active apps)
    if (active.length > 0 && cards.length === 0) {
      const mostRecent = active.reduce((latest, a) => {
        const ref = a.updated_at || a.created_at;
        return ref > latest ? ref : latest;
      }, '');
      const daysSinceAny = mostRecent ? daysSince(mostRecent) : 0;
      if (daysSinceAny >= 7) {
        cards.push({ kind: 'no-activity', daysSinceAny });
      }
    }

    // Max 4 cards (deadline-first), deduplicate
    const sorted = [
      ...cards.filter(c => c.kind === 'deadline').sort((a, b) =>
        (a as { days: number }).days - (b as { days: number }).days
      ),
      ...cards.filter(c => c.kind === 'stale').sort((a, b) =>
        (b as { days: number }).days - (a as { days: number }).days
      ),
      ...cards.filter(c => c.kind === 'no-activity'),
    ];

    return sorted.slice(0, 4);
  }, [applications]);

  const visible = insights.filter(card => {
    const key = card.kind === 'no-activity' ? '__no_activity__' : card.app.id + card.kind;
    return !dismissed.has(key);
  });

  if (visible.length === 0) return null;

  const dismiss = (key: string) => setDismissed(prev => new Set([...prev, key]));

  return (
    <div className="mb-4 space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.map(card => {
          const key = card.kind === 'no-activity' ? '__no_activity__' : card.app.id + card.kind;
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {card.kind === 'deadline' && (
                <DeadlineCard
                  app={card.app}
                  days={card.days}
                  onOpen={() => onOpenApp(card.app.id)}
                  onDismiss={() => dismiss(key)}
                />
              )}
              {card.kind === 'stale' && (
                <StaleCard
                  app={card.app}
                  days={card.days}
                  onOpen={() => onOpenApp(card.app.id)}
                  onFollowUp={() => onFollowUp(card.app)}
                  onDismiss={() => dismiss(key)}
                />
              )}
              {card.kind === 'no-activity' && (
                <NoActivityCard
                  days={card.daysSinceAny}
                  onDismiss={() => dismiss(key)}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function DeadlineCard({ app, days, onOpen, onDismiss }: {
  app: Application; days: number; onOpen: () => void; onDismiss: () => void;
}) {
  const urgent = days <= 1;
  const color = urgent ? 'var(--danger)' : 'var(--amber-warning)';
  const bg = urgent ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.06)';
  const border = urgent ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)';

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
      style={{ background: bg, borderColor: border }}
    >
      <Clock size={14} style={{ color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium leading-snug" style={{ color }}>
          {days === 0 ? 'Deadline today' : days === 1 ? 'Deadline tomorrow' : `Deadline in ${days} days`}
          {' — '}
          <span style={{ color: 'var(--body-text)' }}>{app.company}</span>
          <span style={{ color: 'var(--muted-text)' }}> · {app.role}</span>
        </p>
      </div>
      <button
        onClick={onOpen}
        className="flex items-center gap-1 text-[11px] font-semibold flex-shrink-0 transition-opacity hover:opacity-70"
        style={{ color }}
      >
        View <ChevronRight size={11} />
      </button>
      <button onClick={onDismiss} className="text-[12px] opacity-40 hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: 'var(--muted-text)' }}>
        <X size={12} />
      </button>
    </div>
  );
}

function StaleCard({ app, days, onOpen, onFollowUp, onDismiss }: {
  app: Application; days: number; onOpen: () => void; onFollowUp: () => void; onDismiss: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
    >
      <Zap size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] leading-snug" style={{ color: 'var(--muted-text)' }}>
          <span className="font-medium" style={{ color: 'var(--body-text)' }}>{app.company}</span>
          {' hasn\'t moved in '}
          <span className="font-medium" style={{ color: 'var(--accent-blue)' }}>{days} days</span>
          {' — ready to follow up?'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onFollowUp}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md text-white transition-opacity hover:opacity-85"
          style={{ background: 'var(--accent-blue)' }}
        >
          <Mail size={10} /> Follow up
        </button>
        <button
          onClick={onOpen}
          className="text-[11px] font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--muted-text)' }}
        >
          View
        </button>
        <button onClick={onDismiss} className="opacity-40 hover:opacity-70 transition-opacity" style={{ color: 'var(--muted-text)' }}>
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function NoActivityCard({ days, onDismiss }: { days: number; onDismiss: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
    >
      <AlertTriangle size={14} style={{ color: 'var(--amber-warning)', flexShrink: 0 }} />
      <p className="flex-1 text-[12px] leading-snug" style={{ color: 'var(--muted-text)' }}>
        No pipeline activity in <span className="font-medium" style={{ color: 'var(--body-text)' }}>{days} days</span> — recruiting seasons move fast. Time to apply somewhere new?
      </p>
      <button onClick={onDismiss} className="opacity-40 hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: 'var(--muted-text)' }}>
        <X size={12} />
      </button>
    </div>
  );
}
