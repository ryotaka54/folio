'use client';

import { useState, useRef } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface MobileCardListProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: PipelineStage) => void;
  onCardContextMenu?: (app: Application, e: React.MouseEvent) => void;
}

// Bottom sheet for picking a new stage
function StagePicker({
  app,
  stages,
  onPick,
  onClose,
}: {
  app: Application;
  stages: PipelineStage[];
  onPick: (stage: PipelineStage) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden"
        style={{ background: 'var(--card-bg)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--border-emphasis)' }} />

        <div className="px-4 py-3 border-b border-border-gray">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
            Move <span style={{ color: 'var(--accent-blue)' }}>{app.company}</span> to…
          </p>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {stages.map(stage => {
            const color = STAGE_COLORS[stage] || '#6B7280';
            const isCurrent = app.status === stage;
            return (
              <button
                key={stage}
                onClick={() => { if (!isCurrent) onPick(stage); onClose(); }}
                disabled={isCurrent}
                className="w-full flex items-center gap-3 px-4 tap-compact min-h-0 transition-colors active:bg-surface-gray"
                style={{ minHeight: 52, opacity: isCurrent ? 0.4 : 1, background: 'transparent' }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="flex-1 text-left text-[15px]" style={{ color: 'var(--brand-navy)' }}>
                  {stage}
                </span>
                {isCurrent && (
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>current</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
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
  if (diffDays < 0)        { label = 'Overdue'; urgent = true; }
  else if (diffDays === 0) { label = 'Today';   urgent = true; }
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
  stages,
  defaultOpen,
  onCardClick,
  onMoveRequest,
  onCardContextMenu,
}: {
  stage: PipelineStage;
  apps: Application[];
  stages: PipelineStage[];
  defaultOpen: boolean;
  onCardClick: (app: Application) => void;
  onMoveRequest: (app: Application) => void;
  onCardContextMenu?: (app: Application, e: React.MouseEvent) => void;
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
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
            {apps.length}
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {/* Cards */}
      {open && apps.length > 0 && (
        <div className="border-t border-border-gray divide-y divide-border-gray" style={{ opacity: isInactive ? 0.55 : 1 }}>
          {apps.map(app => (
            <div key={app.id} className="flex items-stretch">
              {/* Main card tap area */}
              <button
                onClick={() => onCardClick(app)}
                onContextMenu={onCardContextMenu ? (e) => { e.preventDefault(); onCardContextMenu(app, e); } : undefined}
                className="flex-1 text-left flex items-center gap-3 px-4 py-3 transition-colors active:bg-surface-gray min-w-0"
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
              </button>

              {/* Move button — vertical pill on the right */}
              <button
                onClick={() => onMoveRequest(app)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 border-l border-border-gray tap-compact min-h-0 active:bg-surface-gray transition-colors"
                style={{ minWidth: 44, background: 'transparent' }}
                aria-label={`Move ${app.company} to another stage`}
              >
                {/* Two horizontal arrows stacked = "move" icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                <span className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Move</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {open && apps.length === 0 && (
        <div className="border-t border-border-gray px-4 py-5 flex items-center gap-2">
          <div className="w-3 h-3 rounded border-[1.5px] border-dashed" style={{ borderColor: 'var(--border-gray)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No applications here yet</span>
        </div>
      )}
    </div>
  );
}

export default function MobileCardList({ applications, stages, onCardClick, onStatusChange, onCardContextMenu }: MobileCardListProps) {
  const [pickerApp, setPickerApp] = useState<Application | null>(null);
  const stageFilterRef = useRef<HTMLDivElement>(null);

  const scrollToStage = (stage: PipelineStage) => {
    const el = document.getElementById(`mobile-stage-${stage}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const section = document.getElementById(`mobile-section-${stage}`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePick = (newStage: PipelineStage) => {
    if (pickerApp && pickerApp.status !== newStage) {
      onStatusChange(pickerApp.id, newStage);
    }
    setPickerApp(null);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Stage filter pill row */}
        <div ref={stageFilterRef} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
                {count > 0 && <span className="text-[11px] font-semibold" style={{ color }}>{count}</span>}
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
                stages={stages}
                defaultOpen={stage !== 'Rejected' && stage !== 'Declined'}
                onCardClick={onCardClick}
                onMoveRequest={app => setPickerApp(app)}
                onCardContextMenu={onCardContextMenu}
              />
            </div>
          );
        })}
      </div>

      {/* Stage picker bottom sheet */}
      {pickerApp && (
        <StagePicker
          app={pickerApp}
          stages={stages}
          onPick={handlePick}
          onClose={() => setPickerApp(null)}
        />
      )}
    </>
  );
}
