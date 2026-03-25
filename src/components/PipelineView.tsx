'use client';

import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import ApplicationCard from './ApplicationCard';

interface PipelineViewProps {
  applications: Application[];
  stages: PipelineStage[];
  onCardClick: (app: Application) => void;
}

export default function PipelineView({ applications, stages, onCardClick }: PipelineViewProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2" style={{ minHeight: '400px' }}>
      {stages.map((stage) => {
        const stageApps = applications.filter(a => a.status === stage);
        const color = STAGE_COLORS[stage] || '#6B7280';
        const isRejected = stage === 'Rejected' || stage === 'Declined';

        return (
          <div
            key={stage}
            className="min-w-[220px] w-[220px] flex-shrink-0 flex flex-col"
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-muted-text truncate">{stage}</span>
              <span className="text-xs text-muted-text/50 ml-auto flex-shrink-0">{stageApps.length}</span>
            </div>

            {/* Cards container */}
            <div
              className={`flex-1 space-y-2 overflow-y-auto pipeline-column rounded-lg p-1.5 ${
                isRejected ? 'opacity-60' : ''
              }`}
              style={{ borderLeft: `2px solid ${color}20`, backgroundColor: `${color}05` }}
            >
              {stageApps.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <span className="text-xs text-muted-text/40">No applications</span>
                </div>
              )}
              {stageApps.map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onClick={() => onCardClick(app)}
                  muted={isRejected}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
