'use client';

import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
  muted?: boolean;
}

export default function ApplicationCard({ application, onClick, muted }: ApplicationCardProps) {
  const deadlineInfo = (() => {
    if (!application.deadline) return null;
    const d = new Date(application.deadline);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Consistent hierarchy: Overdue → Xd left (≤7d) → "Apr 10" (>7d)
    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    if (diffDays === 0) return { label: 'Due today', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };

    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: formatted, color: 'text-muted-text bg-surface-gray border-border-gray' };
  })();

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card-bg border border-border-gray rounded-xl p-3 shadow-sm hover:shadow-md hover:border-accent-blue/20 transition-all cursor-pointer group"
    >
      <div className="text-[13px] font-semibold text-brand-navy group-hover:text-accent-blue transition-colors truncate leading-tight">
        {application.company}
      </div>
      <div className="text-[11px] text-muted-text mt-0.5 truncate font-normal">{application.role}</div>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {application.category && !muted && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
            style={{
              backgroundColor: `${STAGE_COLORS[application.status] || '#6B7280'}10`,
              color: STAGE_COLORS[application.status] || '#6B7280',
              borderColor: `${STAGE_COLORS[application.status] || '#6B7280'}25`,
            }}
          >
            {application.category}
          </span>
        )}
        {deadlineInfo && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ml-auto ${deadlineInfo.color}`}>
            {deadlineInfo.label}
          </span>
        )}
      </div>
    </button>
  );
}
