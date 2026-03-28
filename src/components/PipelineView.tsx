'use client';

import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import ApplicationCard from './ApplicationCard';
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';

interface PipelineViewProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: PipelineStage) => void;
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
    <div id={`pipeline-col-${stage}`} className="min-w-[192px] w-[192px] flex-shrink-0 flex flex-col snap-center">
      {/* Column header — Linear style */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate"
          style={{ color: 'var(--muted-text)' }}
        >
          {stage}
        </span>
        <span
          className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border"
          style={{
            background: 'var(--surface-gray)',
            color: 'var(--text-tertiary)',
            borderColor: 'var(--border-gray)',
          }}
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

export default function PipelineView({ applications, stages, onCardClick, onStatusChange }: PipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
      {/* Mobile stage summary — tap to scroll column into view */}
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
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted-text)' }}>{count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x-mandatory" style={{ minHeight: 400 }}>
        {stages.map((stage) => {
          const stageApps = applications.filter(a => a.status === stage);
          const color = STAGE_COLORS[stage] || '#6B7280';
          const isRejected = stage === 'Rejected' || stage === 'Declined';

          return (
            <DroppableColumn key={stage} stage={stage} count={stageApps.length} color={color} isRejected={isRejected}>
              {stageApps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 pointer-events-none gap-1">
                  <div
                    className="w-4 h-4 rounded border-2 border-dashed"
                    style={{ borderColor: 'var(--border-gray)' }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    Drop here
                  </span>
                </div>
              )}
              {stageApps.map(app => (
                <DraggableCard
                  key={app.id}
                  application={app}
                  onClick={() => onCardClick(app)}
                  muted={isRejected}
                />
              ))}
            </DroppableColumn>
          );
        })}
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
