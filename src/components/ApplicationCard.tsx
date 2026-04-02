'use client';

import { Application } from '@/lib/types';

import { GripVertical } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
  muted?: boolean;
}

export default function ApplicationCard({ application, onClick, muted }: ApplicationCardProps) {
  const deadlineInfo = (() => {
    if (!application.deadline) return null;
    const d = new Date(application.deadline + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const red   = { background: 'var(--error-bg)',           color: 'var(--error-text)',   border: '1px solid var(--error-border)' };
    const amber = { background: 'rgba(217,119,6,0.10)',      color: 'var(--amber-warning)', border: '1px solid rgba(217,119,6,0.25)' };

    if (diffDays < 0)   return { label: 'Overdue',            style: red };
    if (diffDays === 0) return { label: 'Today',               style: red };
    if (diffDays <= 3)  return { label: `${diffDays}d left`,   style: red };
    if (diffDays <= 7)  return { label: `${diffDays}d left`,   style: amber };
    return null;
  })();

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-background border border-border-gray rounded-lg p-3 group relative hover:[border-color:var(--border-emphasis)] transition-colors"
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
              background: 'var(--surface-gray)',
              color: 'var(--text-tertiary)',
            }}
          >
            {application.category}
          </span>
        )}
        {deadlineInfo && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto whitespace-nowrap"
            style={deadlineInfo.style}
          >
            {deadlineInfo.label}
          </span>
        )}
      </div>
    </button>
  );
}
