'use client';

import { PipelineStage } from '@/lib/types';

type PillVariant = 'neutral' | 'slate' | 'indigo' | 'violet' | 'amber' | 'green' | 'red' | 'pink';

const STAGE_PILL: Record<string, PillVariant> = {
  // Internship stages
  'Wishlist':                  'neutral',
  'Applied':                   'slate',
  'OA / Online Assessment':    'indigo',
  'Phone / Recruiter Screen':  'violet',
  'Final Round Interviews':    'amber',
  'Offer':                     'green',
  'Rejected':                  'red',
  // Job stages
  'Recruiter Screen':          'violet',
  'Technical / Case Interview':'amber',
  'Final Round':               'amber',
  'Offer — Negotiating':       'green',
  'Accepted':                  'green',
  'Declined':                  'neutral',
  // Shuukatsu stages
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

interface StagePillProps {
  stage: PipelineStage | string;
  size?: 'sm' | 'md';
}

export default function StagePill({ stage, size = 'md' }: StagePillProps) {
  const variant: PillVariant = STAGE_PILL[stage] ?? 'neutral';
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
