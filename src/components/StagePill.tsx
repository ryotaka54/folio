'use client';

import { PipelineStage } from '@/lib/types';
import { STAGE_PILL_VARIANT, type PillVariant } from '@/lib/constants';

interface StagePillProps {
  stage: PipelineStage | string;
  size?: 'sm' | 'md';
}

export default function StagePill({ stage, size = 'md' }: StagePillProps) {
  const variant: PillVariant = STAGE_PILL_VARIANT[stage] ?? 'neutral';
  const fg = `var(--pill-${variant}-fg)`;
  const bg = `var(--pill-${variant}-bg)`;
  const dot = `var(--pill-${variant}-dot)`;

  const dotSize = 6;
  const fontSize = size === 'sm' ? 11 : 12;
  const padding = size === 'sm' ? '2px 7px 2px 6px' : '3px 9px 3px 8px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding,
      borderRadius: 999,
      fontSize,
      fontWeight: 500,
      letterSpacing: '-0.005em',
      color: fg,
      background: bg,
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      <span style={{
        width: dotSize,
        height: dotSize,
        borderRadius: 999,
        background: dot,
        flexShrink: 0,
      }} />
      {stage}
    </span>
  );
}
