'use client';

import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import { GripVertical } from 'lucide-react';

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
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0)  return { label: 'Overdue',     style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' } };
    if (diffDays === 0) return { label: 'Due today',  style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' } };
    if (diffDays <= 3)  return { label: `${diffDays}d left`, style: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' } };
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: formatted, style: { background: 'var(--surface-gray)', color: 'var(--text-tertiary)', border: '1px solid var(--border-gray)' } };
  })();

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-background border border-border-gray rounded-lg p-3 group relative"
      style={{ transition: 'border-color 0.15s ease, background-color 0.15s ease' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-emphasis)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-gray)';
      }}
    >
      {/* Drag handle — visible on hover */}
      <div
        className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <GripVertical size={13} />
      </div>

      <div
        className="text-[14px] font-semibold truncate leading-tight pr-5"
        style={{
          color: 'var(--brand-navy)',
          opacity: muted ? 0.5 : 1,
        }}
      >
        {application.company}
      </div>
      <div
        className="text-[13px] truncate mt-0.5"
        style={{ color: 'var(--muted-text)', opacity: muted ? 0.5 : 1 }}
      >
        {application.role}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {application.category && !muted && (
          <span
            className="text-[11px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: `${STAGE_COLORS[application.status] || '#6B7280'}12`,
              color: STAGE_COLORS[application.status] || '#6B7280',
            }}
          >
            {application.category}
          </span>
        )}
        {deadlineInfo && (
          <span
            className="text-[11px] px-1.5 py-0.5 rounded font-medium ml-auto"
            style={deadlineInfo.style}
          >
            {deadlineInfo.label}
          </span>
        )}
      </div>
    </button>
  );
}
