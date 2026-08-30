'use client';

import { useState, useMemo } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import { STAGE_PILL_VARIANT } from '@/lib/constants';
import CompanyAvatar from './CompanyAvatar';
import { GripVertical } from 'lucide-react';
import {
  DndContext, DragEndEvent, DragStartEvent,
  useDraggable, useDroppable,
  PointerSensor, TouchSensor, useSensor, useSensors,
  DragOverlay,
} from '@dnd-kit/core';

const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);

function stageVars(stage: string) {
  const v = STAGE_PILL_VARIANT[stage] ?? 'neutral';
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
// Trimmed to the fields that actually drive a decision — company, role,
// deadline/urgency. Category and tags are still visible in the detail
// drawer; keeping them off the card face was the single biggest source of
// clutter here.
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
      className="kanban-card"
      style={{
        padding: 12,
        borderRadius: 10,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: 'var(--shadow-sm)',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Grab-state affordance — reveals on hover so it's clear the whole
            card is draggable, without narrowing the actual drag hit-area to
            a tiny handle (dnd-kit already disambiguates click vs. drag by
            pointer-move distance on the card itself). */}
        <div className="kanban-grip" style={{ color: 'var(--muted-2)', flexShrink: 0, marginTop: 2, opacity: 0, transition: 'opacity 0.12s' }} aria-hidden>
          <GripVertical size={13} />
        </div>
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
      {deadline && (
        <div style={{ marginTop: 9 }}>
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
        </div>
      )}
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
  stage, apps, onCardClick, onAddToStage, justDropped,
}: {
  stage: PipelineStage;
  apps: Application[];
  onCardClick: (app: Application) => void;
  onAddToStage?: (stage: PipelineStage) => void;
  justDropped?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const sv = stageVars(stage);

  return (
    <div
      className={justDropped ? 'column-drop-flash' : undefined}
      style={{
        // Subtle always-on stage tint (not a full-color fill) so each column
        // has a whisper of identity even at rest, with a stronger tint only
        // while something is actively dragged over it.
        background: isOver ? sv.bg : `color-mix(in oklch, ${sv.dot} 4%, var(--bg-soft))`,
        borderRadius: 12,
        border: `1px solid ${isOver ? sv.dot : 'var(--border)'}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 280,
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      {/* Column header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: sv.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em', color: 'var(--text)' }}>
            {stage}
          </span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, color: sv.fg,
            background: sv.bg, borderRadius: 999, padding: '1px 6px',
            fontFamily: 'var(--mono, ui-monospace)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {apps.length}
          </span>
        </div>
        <button
          onClick={() => onAddToStage?.(stage)}
          className="hover:bg-bg hover:text-text"
          style={{
            color: 'var(--muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 2, display: 'flex',
            borderRadius: 4,
          }}
          title={`Add to ${stage}`}
          aria-label={`Add application to ${stage}`}
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
  onAddToStage?: (stage: PipelineStage) => void;
}

export default function PipelineView({
  applications, stages, onCardClick, onStatusChange, onAddToStage,
}: PipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [justDropped, setJustDropped] = useState<string | null>(null);
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
      // Brief highlight on the destination column — the only feedback a
      // successful drop gets otherwise is the card silently reappearing.
      const dest = over.id as string;
      setJustDropped(dest);
      setTimeout(() => setJustDropped(d => (d === dest ? null : d)), 500);
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
              onAddToStage={onAddToStage}
              justDropped={justDropped === stage}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeApp && (
          <div style={{ opacity: 0.95 }}>
            <KanbanCard app={activeApp} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>

      <style>{`
        .kanban-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); transition: box-shadow 0.1s, transform 0.1s; }
        .kanban-card:hover .kanban-grip { opacity: 1; }
        @keyframes column-drop-flash {
          0%   { box-shadow: inset 0 0 0 2px var(--accent); }
          100% { box-shadow: inset 0 0 0 2px transparent; }
        }
        .column-drop-flash { animation: column-drop-flash 0.5s ease-out; }
      `}</style>
    </DndContext>
  );
}
