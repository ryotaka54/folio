'use client';

import { useMemo } from 'react';
import { Application, PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface PipelineBarProps {
  applications: Application[];
  stages: PipelineStage[];
  activeStage: PipelineStage | 'all';
  onStageClick: (stage: PipelineStage | 'all') => void;
}

// Stages considered terminal / not worth showing in the funnel bar
const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);

type PillVariant = 'neutral' | 'slate' | 'indigo' | 'violet' | 'amber' | 'green' | 'red';

const STAGE_PILL_VARIANT: Record<string, PillVariant> = {
  'Wishlist':                  'neutral',
  'Applied':                   'slate',
  'OA / Online Assessment':    'indigo',
  'Phone / Recruiter Screen':  'violet',
  'Final Round Interviews':    'amber',
  'Offer':                     'green',
  'Rejected':                  'red',
  'Recruiter Screen':          'violet',
  'Technical / Case Interview':'amber',
  'Final Round':               'amber',
  'Offer — Negotiating':       'green',
  'Accepted':                  'green',
  'Declined':                  'neutral',
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

export default function PipelineBar({ applications, stages, activeStage, onStageClick }: PipelineBarProps) {
  const activeStages = stages.filter(s => !TERMINAL.has(s));

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    stages.forEach(s => { c[s] = 0; });
    applications.forEach(a => { if (c[a.status] !== undefined) c[a.status]++; });
    return c;
  }, [applications, stages]);

  const total = activeStages.reduce((sum, s) => sum + (counts[s] || 0), 0);

  return (
    <div style={{
      padding: '12px 24px 14px',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-gray)',
    }}>
      {/* Proportional stacked bar */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'var(--surface-gray)',
        border: '1px solid var(--border-gray)',
        marginBottom: 12,
      }}>
        {total === 0 ? (
          <div style={{ flex: 1, background: 'var(--surface-gray)' }} />
        ) : activeStages.map(stage => {
          const count = counts[stage] || 0;
          if (count === 0) return null;
          const color = STAGE_COLORS[stage] || '#6B7280';
          const isActive = activeStage === 'all' || activeStage === stage;
          return (
            <button
              key={stage}
              onClick={() => onStageClick(stage)}
              title={`${stage} · ${count}`}
              style={{
                flex: count,
                background: color,
                opacity: isActive ? 1 : 0.3,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'opacity 0.15s ease',
              }}
            />
          );
        })}
      </div>

      {/* Stage chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* "All" chip */}
        <StageChip
          label="All"
          count={applications.length}
          active={activeStage === 'all'}
          color={null}
          variant={null}
          onClick={() => onStageClick('all')}
          isAll
        />
        <div style={{ width: 1, height: 18, background: 'var(--border-gray)', margin: '0 4px' }} />
        {activeStages.map(stage => (
          <StageChip
            key={stage}
            label={stage}
            count={counts[stage] || 0}
            active={activeStage === stage}
            color={STAGE_COLORS[stage] || '#6B7280'}
            variant={STAGE_PILL_VARIANT[stage] ?? 'neutral'}
            onClick={() => onStageClick(stage)}
          />
        ))}
      </div>
    </div>
  );
}

function StageChip({
  label, count, active, color, variant, onClick, isAll,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string | null;
  variant: PillVariant | null;
  onClick: () => void;
  isAll?: boolean;
}) {
  const activeFg = variant ? `var(--pill-${variant}-fg)` : 'var(--brand-navy)';
  const activeBg = variant ? `var(--pill-${variant}-bg)` : 'var(--surface-gray)';
  const activeDot = variant ? `var(--pill-${variant}-dot)` : undefined;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 9px',
        borderRadius: 999,
        border: '1px solid var(--border-gray)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: active
          ? (isAll ? 'var(--brand-navy)' : activeBg)
          : 'var(--card-bg)',
        color: active
          ? (isAll ? 'var(--background)' : activeFg)
          : 'var(--muted-text)',
        borderColor: active && !isAll ? 'transparent' : 'var(--border-gray)',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
      }}
    >
      {!isAll && color && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: active ? activeDot : color,
          flexShrink: 0,
        }} />
      )}
      <span>{label}</span>
      <span style={{
        fontFamily: 'var(--mono, ui-monospace)',
        fontSize: 11,
        fontWeight: 500,
        padding: '0 5px',
        borderRadius: 999,
        background: active
          ? 'rgba(255,255,255,0.18)'
          : 'var(--surface-gray)',
        color: active ? 'currentColor' : 'var(--text-tertiary)',
        minWidth: 18,
        textAlign: 'center',
      }}>
        {count}
      </span>
    </button>
  );
}
