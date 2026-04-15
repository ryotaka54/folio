'use client';

import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import ApplicationCard from './ApplicationCard';
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';

const COLUMN_CAP = 6; // Max visible cards before "Show more"

interface PipelineViewProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: PipelineStage) => void;
}

// ── Priority sort: urgent deadlines first, then soonest deadline, then newest ─
function sortByPriority(apps: Application[]): Application[] {
  const now = Date.now();
  return [...apps].sort((a, b) => {
    const scoreA = priorityScore(a, now);
    const scoreB = priorityScore(b, now);
    return scoreA - scoreB; // lower score = higher priority (top of column)
  });
}

function priorityScore(app: Application, now: number): number {
  if (app.deadline) {
    const dMs = new Date(app.deadline + 'T00:00:00').getTime();
    const daysLeft = Math.ceil((dMs - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return -2000 + daysLeft;   // overdue: highest priority
    if (daysLeft <= 7) return -1000 + daysLeft;   // this week: second priority
    return daysLeft;                               // future deadline
  }
  // No deadline: sort by newest first (negative ts = earlier in list)
  const ts = app.created_at ? new Date(app.created_at).getTime() : 0;
  return 10000 - ts / 1e10;
}

function DraggableCard({ application, onClick, muted }: { application: Application; onClick: () => void; muted?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.25 : undefined }}
      {...attributes}
      {...listeners}
      className={`touch-none draggable-card select-none ${isDragging ? 'draggable-active' : ''}`}
    >
      <ApplicationCard application={application} onClick={onClick} muted={muted} />
    </div>
  );
}

function DroppableColumn({ stage, count, color, isRejected, children }: {
  stage: string; count: number; color: string; isRejected: boolean; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });

  return (
    <div id={`pipeline-col-${stage}`} className={`flex flex-col flex-shrink-0 ${isRejected ? 'w-[160px]' : 'flex-1 min-w-[120px]'}`}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
          {stage}
        </span>
        <span
          className="ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
        >
          {count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-1.5 overflow-y-auto pipeline-column rounded-lg p-1.5 transition-colors ${isRejected ? 'opacity-50' : ''}`}
        style={{
          background: isOver ? `${color}08` : 'var(--card-bg)',
          border: isOver ? `1px solid ${color}40` : '1px solid var(--border-gray)',
          minHeight: 120,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Column content with priority sort + card cap ───────────────────────────
function ColumnContent({
  stage, apps, isRejected, onCardClick, firstCardTaggedRef,
}: {
  stage: string;
  apps: Application[];
  isRejected: boolean;
  onCardClick: (app: Application) => void;
  firstCardTaggedRef: { current: boolean };
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = sortByPriority(apps);
  const hidden = sorted.length - COLUMN_CAP;
  const visible = expanded ? sorted : sorted.slice(0, COLUMN_CAP);

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 pointer-events-none">
        <div className="w-8 h-8 rounded-lg border border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-gray)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>
    );
  }

  return (
    <>
      {visible.map(app => {
        const isFirst = !firstCardTaggedRef.current;
        if (isFirst) firstCardTaggedRef.current = true;
        return (
          <div key={app.id} {...(isFirst ? { 'data-tutorial-id': 'first-card' } : {})}>
            <DraggableCard application={app} onClick={() => onCardClick(app)} muted={isRejected} />
          </div>
        );
      })}

      {/* Show more / Show less toggle */}
      {sorted.length > COLUMN_CAP && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
          style={{
            background: 'var(--surface-gray)',
            color: 'var(--muted-text)',
            border: '1px dashed var(--border-gray)',
          }}
        >
          {expanded
            ? `↑ Show less`
            : `↓ Show ${hidden} more`}
        </button>
      )}
    </>
  );
}

export default function PipelineView({ applications, stages, onCardClick, onStatusChange }: PipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const firstCardTaggedRef = { current: false };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const app = applications.find(a => a.id === active.id);
    if (app && app.status !== over.id) {
      onStatusChange(active.id as string, over.id as PipelineStage);
    }
  };

  return (
    <DndContext id="applyd-dnd-context" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Mobile stage summary */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        {stages.map((stage) => {
          const count = applications.filter(a => a.status === stage).length;
          const color = STAGE_COLORS[stage] || '#6B7280';
          return (
            <button
              key={stage}
              onClick={() => document.getElementById(`pipeline-col-${stage}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-gray flex-shrink-0 transition-colors"
              style={{ background: 'var(--surface-gray)' }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-medium max-w-[80px] truncate" style={{ color: 'var(--muted-text)' }}>{stage}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        <div className="flex gap-2" style={{ minHeight: 400 }}>
          {/* Active stages */}
          <div className="flex gap-2 flex-shrink-0" style={{ width: '100%', minHeight: 400 }}>
            {stages.filter(s => s !== 'Rejected' && s !== 'Declined').map((stage) => {
              const stageApps = applications.filter(a => a.status === stage);
              const color = STAGE_COLORS[stage] || '#6B7280';
              return (
                <DroppableColumn key={stage} stage={stage} count={stageApps.length} color={color} isRejected={false}>
                  <ColumnContent
                    stage={stage}
                    apps={stageApps}
                    isRejected={false}
                    onCardClick={onCardClick}
                    firstCardTaggedRef={firstCardTaggedRef}
                  />
                </DroppableColumn>
              );
            })}
          </div>

          {/* Rejected / Declined */}
          {stages.filter(s => s === 'Rejected' || s === 'Declined').map((stage) => {
            const stageApps = applications.filter(a => a.status === stage);
            const color = STAGE_COLORS[stage] || '#6B7280';
            return (
              <DroppableColumn key={stage} stage={stage} count={stageApps.length} color={color} isRejected={true}>
                <ColumnContent
                  stage={stage}
                  apps={stageApps}
                  isRejected={true}
                  onCardClick={onCardClick}
                  firstCardTaggedRef={firstCardTaggedRef}
                />
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null} className="draggable-active select-none">
        {activeId ? (
          <div style={{ transform: 'rotate(1.5deg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 8 }}>
            <ApplicationCard application={applications.find(a => a.id === activeId)!} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
