'use client';

import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
  muted?: boolean;
}

export default function ApplicationCard({ application, onClick, muted }: ApplicationCardProps) {
  const isDeadlineSoon = (() => {
    if (!application.deadline) return false;
    const d = new Date(application.deadline);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= now && d <= sevenDays;
  })();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border border-border-gray rounded-xl p-3 shadow-sm hover:shadow-md hover:border-accent-blue/20 transition-all cursor-pointer group`}
    >
      <div className="text-sm font-medium text-brand-navy group-hover:text-accent-blue transition-colors truncate">
        {application.company}
      </div>
      <div className="text-xs text-muted-text mt-0.5 truncate">{application.role}</div>
      <div className="flex items-center gap-2 mt-2">
        {application.category && !muted && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${STAGE_COLORS[application.status] || '#6B7280'}15`,
              color: STAGE_COLORS[application.status] || '#6B7280',
            }}
          >
            {application.category}
          </span>
        )}
        {application.deadline && (
          <span className={`text-[10px] ml-auto ${isDeadlineSoon ? 'text-amber-warning font-medium' : 'text-muted-text'}`}>
            {formatDate(application.deadline)}
          </span>
        )}
      </div>
    </button>
  );
}
