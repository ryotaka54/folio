'use client';

import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface MobileCardListProps {
  applications: Application[];
  onCardClick: (app: Application) => void;
}

export default function MobileCardList({ applications, onCardClick }: MobileCardListProps) {
  return (
    <div className="space-y-2">
      {applications.map(app => {
        const color = STAGE_COLORS[app.status] || '#6B7280';
        const isInactive = app.status === 'Rejected' || app.status === 'Declined';

        const deadlineInfo = (() => {
          if (!app.deadline) return null;
          const d = new Date(app.deadline + 'T00:00:00');
          const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0)  return { label: 'Overdue', style: { background: '#FEF2F2', color: '#991B1B' } };
          if (diffDays === 0) return { label: 'Today',  style: { background: '#FEF2F2', color: '#991B1B' } };
          if (diffDays <= 3)  return { label: `${diffDays}d`, style: { background: '#FEF3C7', color: '#92400E' } };
          return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), style: { background: 'var(--surface-gray)', color: 'var(--text-tertiary)' } };
        })();

        return (
          <button
            key={app.id}
            onClick={() => onCardClick(app)}
            className="w-full text-left rounded-xl border border-border-gray p-4 flex items-center gap-3 transition-colors active:opacity-80"
            style={{ background: 'var(--card-bg)', opacity: isInactive ? 0.5 : 1 }}
          >
            {/* Stage color dot */}
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
                  {app.company}
                </span>
                {deadlineInfo && (
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0" style={deadlineInfo.style}>
                    {deadlineInfo.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] truncate" style={{ color: 'var(--muted-text)' }}>{app.role}</span>
              </div>
              <div className="mt-1.5">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color }}
                >
                  {app.status}
                </span>
              </div>
            </div>

            {/* Chevron */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
