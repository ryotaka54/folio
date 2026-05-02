'use client';

import { Application, Tag } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import TagPill from '@/components/TagPill';

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  muted?: boolean;
  tags?: Tag[];
}

export default function ApplicationCard({ application, onClick, onContextMenu, muted, tags }: ApplicationCardProps) {
  const stageColor = STAGE_COLORS[application.status] || '#6B7280';

  const deadlineInfo = (() => {
    if (!application.deadline) return null;
    const d = new Date(application.deadline + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0)   return { label: 'Overdue',          urgent: true };
    if (diffDays === 0) return { label: 'Due today',         urgent: true };
    if (diffDays <= 3)  return { label: `${diffDays}d left`, urgent: true };
    if (diffDays <= 7)  return { label: `${diffDays}d left`, urgent: false };
    return null;
  })();

  const steps = application.interview_steps || [];
  const hasSteps = steps.length > 0;
  const completedCount = steps.filter(s => s.completed).length;
  const nextStep = steps.find(s => !s.completed);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e); } : undefined}
      className="w-full text-left group relative rounded-xl overflow-hidden select-none"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-gray)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${stageColor}55`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px ${stageColor}22`;
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-gray)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: muted ? 'var(--border-gray)' : stageColor,
          opacity: muted ? 0.4 : 1,
        }}
      />

      {/* Card body */}
      <div className="pl-4 pr-3 py-3">
        {/* Company + deadline row */}
        <div className="flex items-center justify-between gap-2">
          <div
            className="text-[13px] font-semibold leading-snug truncate"
            style={{ color: muted ? 'var(--text-tertiary)' : 'var(--brand-navy)' }}
          >
            {application.company}
          </div>
          {deadlineInfo && (
            <span
              className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none"
              style={deadlineInfo.urgent
                ? { background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }
                : { background: 'rgba(245,158,11,0.10)', color: 'var(--amber-warning)', border: '1px solid rgba(245,158,11,0.22)' }
              }
            >
              {deadlineInfo.label}
            </span>
          )}
        </div>

        {/* Role */}
        <div
          className="text-[12px] mt-0.5 truncate"
          style={{ color: 'var(--muted-text)' }}
        >
          {application.role}
        </div>

        {/* Interview progress */}
        {hasSteps && !muted && (
          <div className="mt-2.5">
            <div className="flex items-center gap-[4px]">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-full flex-shrink-0 transition-colors"
                  style={{
                    width: 6, height: 6,
                    backgroundColor: step.completed ? stageColor : 'transparent',
                    border: step.completed ? 'none' : `1.5px solid var(--border-emphasis)`,
                  }}
                  title={step.name}
                />
              ))}
              <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-tertiary)' }}>
                {completedCount}/{steps.length}
              </span>
            </div>
            {nextStep && (
              <div className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
                ↳ {nextStep.name}{nextStep.date ? ` · ${new Date(nextStep.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Category pill + tag pills */}
        {!muted && (application.category || (tags && tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {application.category && (
              <span
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-[2px] rounded-md"
                style={{
                  background: `${stageColor}12`,
                  color: stageColor,
                  border: `1px solid ${stageColor}28`,
                }}
              >
                {application.category}
              </span>
            )}
            {tags && tags.slice(0, 3).map(tag => (
              <TagPill key={tag.id} tag={tag} small />
            ))}
            {tags && tags.length > 3 && (
              <span style={{ fontSize: 10, color: 'var(--muted-text)' }}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
