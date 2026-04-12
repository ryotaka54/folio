'use client';

import { useState, useRef, useEffect } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface MobileCardListProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-tertiary)', flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function DeadlineInfo({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const d = new Date(deadline + 'T00:00:00');
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  let label: string;
  let urgent: boolean;
  if (diffDays < 0)   { label = 'Overdue'; urgent = true; }
  else if (diffDays === 0) { label = 'Today'; urgent = true; }
  else if (diffDays <= 3)  { label = `${diffDays}d`; urgent = true; }
  else if (diffDays <= 7)  { label = `${diffDays}d`; urgent = false; }
  else return null;

  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={urgent
        ? { background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }
        : { background: 'rgba(245,158,11,0.12)', color: 'var(--amber-warning)', border: '1px solid rgba(245,158,11,0.25)' }
      }
    >
      {label}
    </span>
  );
}

function StageSection({
  stage,
  apps,
  defaultOpen,
  onCardClick,
}: {
  stage: PipelineStage;
  apps: Application[];
  defaultOpen: boolean;
  onCardClick: (app: Application) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color = STAGE_COLORS[stage] || '#6B7280';
  const isInactive = stage === 'Rejected' || stage === 'Declined';

  return (
    <div className="rounded-xl overflow-hidden border border-border-gray" style={{ background: 'var(--card-bg)' }}>
      {/* Stage header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 tap-compact min-h-0 h-[52px]"
        style={{ background: open ? `${color}08` : 'transparent' }}
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="flex-1 text-left text-[14px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
          {stage}
        </span>
        {apps.length > 0 && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color }}
          >
            {apps.length}
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {/* Cards */}
      {open && apps.length > 0 && (
        <div className="border-t border-border-gray divide-y divide-border-gray" style={{ opacity: isInactive ? 0.55 : 1 }}>
          {apps.map(app => (
            <button
              key={app.id}
              onClick={() => onCardClick(app)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 tap-compact min-h-0 transition-colors active:bg-surface-gray"
              style={{ minHeight: 72, background: 'transparent' }}
            >
              {/* Left accent */}
              <div className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
                    {app.company}
                  </span>
                  <DeadlineInfo deadline={app.deadline} />
                </div>
                <div className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--muted-text)' }}>
                  {app.role}
                </div>
                {app.category && (
                  <span
                    className="inline-flex mt-1 text-[10px] font-medium px-1.5 py-[2px] rounded-md"
                    style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}
                  >
                    {app.category}
                  </span>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--border-emphasis)', flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Empty state for this stage */}
      {open && apps.length === 0 && (
        <div className="border-t border-border-gray px-4 py-5 flex items-center gap-2">
          <div className="w-3 h-3 rounded border-[1.5px] border-dashed" style={{ borderColor: 'var(--border-gray)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No applications here yet</span>
        </div>
      )}
    </div>
  );
}

export default function MobileCardList({ applications, stages, onCardClick }: MobileCardListProps) {
  const stageFilterRef = useRef<HTMLDivElement>(null);

  // Scroll stage filter pill into view
  const scrollToStage = (stage: PipelineStage) => {
    const el = document.getElementById(`mobile-stage-${stage}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const section = document.getElementById(`mobile-section-${stage}`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-3">
      {/* Stage filter pill row */}
      <div
        ref={stageFilterRef}
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {stages.map(stage => {
          const color = STAGE_COLORS[stage] || '#6B7280';
          const count = applications.filter(a => a.status === stage).length;
          return (
            <button
              key={stage}
              id={`mobile-stage-${stage}`}
              onClick={() => scrollToStage(stage)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border flex-shrink-0 tap-compact min-h-0"
              style={{ background: 'var(--surface-gray)', borderColor: 'var(--border-gray)', minHeight: 36 }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: 'var(--muted-text)' }}>{stage}</span>
              {count > 0 && (
                <span className="text-[11px] font-semibold" style={{ color }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapsible stage sections */}
      {stages.map(stage => {
        const stageApps = applications.filter(a => a.status === stage);
        return (
          <div key={stage} id={`mobile-section-${stage}`}>
            <StageSection
              stage={stage}
              apps={stageApps}
              defaultOpen={stage !== 'Rejected' && stage !== 'Declined'}
              onCardClick={onCardClick}
            />
          </div>
        );
      })}
    </div>
  );
}
