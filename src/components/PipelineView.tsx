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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application }
  });

  const style = {
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`touch-none draggable-card ${isDragging ? 'draggable-active' : ''} select-none`}
    >
      <div className={isDragging ? 'shadow-xl scale-105 transition-transform' : ''}>
        <ApplicationCard application={application} onClick={onClick} muted={muted} />
      </div>
    </div>
  );
}

function DroppableColumn({ stage, count, color, isRejected, children }: { stage: string, count: number, color: string, isRejected: boolean, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage }
  });

  return (
    <div className="min-w-[180px] w-[180px] flex-shrink-0 flex flex-col snap-center">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-muted-text truncate">{stage}</span>
        <span className="text-xs text-muted-text/50 ml-auto flex-shrink-0">{count}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto pipeline-column rounded-lg p-1.5 transition-colors ${
          isRejected ? 'opacity-60' : ''
        } ${isOver ? 'ring-2 ring-accent-blue/50' : ''}`}
        style={{ borderLeft: `2px solid ${color}20`, backgroundColor: isOver ? `${color}15` : `${color}05` }}
      >
        {children}
      </div>
    </div>
  );
}

export default function PipelineView({ applications, stages, onCardClick, onStatusChange }: PipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag distance before activating, allowing easy native clicks
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms hold to activate dragging on mobile, otherwise it natively scrolls
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const appId = active.id as string;
    const newStage = over.id as PipelineStage;
    
    const app = applications.find(a => a.id === appId);
    if (app && app.status !== newStage) {
      onStatusChange(appId, newStage);
    }
  };

  return (
    <DndContext id="applyd-dnd-context" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x-mandatory" style={{ minHeight: '400px' }}>
        {stages.map((stage) => {
          const stageApps = applications.filter(a => a.status === stage);
          const color = STAGE_COLORS[stage] || '#6B7280';
          const isRejected = stage === 'Rejected' || stage === 'Declined';

          return (
            <DroppableColumn
              key={stage}
              stage={stage}
              count={stageApps.length}
              color={color}
              isRejected={isRejected}
            >
              {stageApps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-1.5 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-text/30">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-xs text-muted-text/40 text-center">No applications yet</span>
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
          <div className="scale-105 shadow-2xl">
            <ApplicationCard
              application={applications.find(a => a.id === activeId)!}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
