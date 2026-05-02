'use client';

import { useState, useMemo } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import CompanyAvatar from './CompanyAvatar';
import CategoryTag from './CategoryTag';
import TagPill from './TagPill';
import {
  DndContext, DragEndEvent, DragStartEvent,
  useDraggable, useDroppable,
  PointerSensor, TouchSensor, useSensor, useSensors,
  DragOverlay,
} from '@dnd-kit/core';

// Stage → pill CSS variable prefix
const STAGE_VARIANT: Record<string, string> = {
  'Wishlist':                   'neutral',
  'Applied':                    'slate',
  'OA / Online Assessment':     'indigo',
  'Phone / Recruiter Screen':   'violet',
  'Recruiter Screen':           'violet',
  'Final Round Interviews':     'amber',
  'Final Round':                'amber',
  'Technical / Case Interview': 'amber',
  'Offer':                      'green',
  'Offer — Negotiating':        'green',
  'Rejected':                   'red',
  'Declined':                   'neutral',
  'エントリー': 'neutral',
  '説明会':     'slate',
  'ES提出':     'indigo',
  'SPI':        'violet',
  '一次面接':   'violet',
  '二次面接':   'amber',
  '最終面接':   'amber',
  '内々定':     'green',
  '内定':       'green',
  '承諾':       'neutral',
};

const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);

function stageVars(stage: string) {
  const v = STAGE_VARIANT[stage] ?? 'neutral';
  return {
    dot: `var(--pill-${v}-dot)`,
    bg:  `var(--pill-${v}-bg)`,
    fg:  `var(--pill-${v}-fg)`,
  };
}

function fmtDeadline(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const urgent = diff >= 0 && diff <= 3;
  let label: string;
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff < 0) label = `${-diff}d ago`;
  else if (diff < 7) label = `in ${diff}d`;
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, urgent };
}

// ── KanbanCard ───────────────────────────────────────────────────────────────
function KanbanCard({
  app, onClick, isDragging,
}: {
  app: Application;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const deadline = fmtDeadline(app.deadline);

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        borderRadius: 10,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        transition: 'transform 0.08s, box-shadow 0.08s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(16,24,40,0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(16,24,40,0.04)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <CompanyAvatar company={app.company} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: 'var(--text)',
          }}>
            {app.company}
          </div>
          <div style={{
            fontSize: 11.5, color: 'var(--muted)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {app.role}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {app.category && <CategoryTag category={app.category} />}
        {app.tags && app.tags.slice(0, 2).map(tag => (
          <TagPill key={tag.id} tag={tag} small />
        ))}
        {app.tags && app.tags.length > 2 && (
          <span style={{ fontSize: 10, color: 'var(--muted-text)' }}>+{app.tags.length - 2}</span>
        )}
        {deadline && (
          <span style={{
            fontSize: 10.5, padding: '2px 6px', borderRadius: 4,
            color: deadline.urgent ? 'var(--warn)' : 'var(--muted)',
            background: deadline.urgent ? 'var(--warn-bg)' : 'var(--bg-soft)',
            fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {deadline.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ── DraggableCard ────────────────────────────────────────────────────────────
function DraggableCard({ app, onClick }: { app: Application; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });
  return (
    <div ref={setNodeRef} className="touch-none" {...attributes} {...listeners}>
      <KanbanCard app={app} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ── DroppableColumn ──────────────────────────────────────────────────────────
function DroppableColumn({
  stage, apps, onCardClick,
}: {
  stage: PipelineStage;
  apps: Application[];
  onCardClick: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const sv = stageVars(stage);

  return (
    <div style={{
      background: isOver ? sv.bg : 'var(--bg-soft)',
      borderRadius: 12,
      border: `1px solid ${isOver ? sv.dot : 'var(--border)'}`,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 280,
      transition: 'background 0.12s, border-color 0.12s',
    }}>
      {/* Column header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: sv.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em', color: 'var(--text)' }}>
            {stage}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--muted)',
            fontFamily: 'var(--mono, ui-monospace)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {apps.length}
          </span>
        </div>
        <button
          onClick={() => {}}
          style={{
            color: 'var(--muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 2, display: 'flex',
            borderRadius: 4,
          }}
          title={`Add to ${stage}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '0 8px 10px', flex: 1,
        }}
      >
        {apps.map(app => (
          <DraggableCard
            key={app.id}
            app={app}
            onClick={() => onCardClick(app)}
          />
        ))}
        {apps.length === 0 && (
          <div style={{
            padding: '22px 10px',
            border: '1px dashed var(--border)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--muted-2)',
            textAlign: 'center',
          }}>
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

// ── PipelineView ─────────────────────────────────────────────────────────────
interface PipelineViewProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: PipelineStage) => void;
  onCardContextMenu?: (app: Application, e: React.MouseEvent) => void;
}

export default function PipelineView({
  applications, stages, onCardClick, onStatusChange,
}: PipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeStages = stages.filter(s => !TERMINAL.has(s));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const grouped = useMemo(() => {
    const g: Record<string, Application[]> = {};
    activeStages.forEach(s => { g[s] = []; });
    applications.forEach(a => { if (g[a.status]) g[a.status].push(a); });
    return g;
  }, [applications, activeStages]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const app = applications.find(a => a.id === active.id);
    if (app && app.status !== over.id) {
      onStatusChange(active.id as string, over.id as PipelineStage);
    }
  };

  const activeApp = activeId ? applications.find(a => a.id === activeId) : null;

  return (
    <DndContext
      id="applyd-dnd-context"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ padding: '20px 24px 80px', overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeStages.length}, minmax(260px, 1fr))`,
          gap: 14,
          minWidth: 'min-content',
        }}>
          {activeStages.map(stage => (
            <DroppableColumn
              key={stage}
              stage={stage as PipelineStage}
              apps={grouped[stage] || []}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp && (
          <div style={{ transform: 'rotate(1.5deg)', opacity: 0.95 }}>
            <KanbanCard app={activeApp} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
