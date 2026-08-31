import { InternshipStage, JobStage, ShuukatsuStage, Category } from './types';

export const INTERNSHIP_STAGES: InternshipStage[] = [
  'Wishlist',
  'Applied',
  'OA / Online Assessment',
  'Phone / Recruiter Screen',
  'Final Round Interviews',
  'Offer',
  'Rejected',
];

export const JOB_STAGES: JobStage[] = [
  'Wishlist',
  'Applied',
  'Recruiter Screen',
  'Technical / Case Interview',
  'Final Round',
  'Offer — Negotiating',
  'Accepted',
  'Declined',
];

export const CATEGORIES: Category[] = [
  'Engineering',
  'Product Management',
  'Design',
  'Data Science',
  'Finance',
  'Accounting',
  'Consulting',
  'Marketing',
  'Sales & Business Development',
  'Human Resources',
  'Operations',
  'Supply Chain',
  'Research & Policy',
  'Communications & PR',
  'Legal',
  'Healthcare & Life Sciences',
  'Other',
];

// ── Stage → color, single source of truth ──────────────────────────────────
// This used to be three independently-maintained copies (StagePill.tsx,
// PipelineBar.tsx, PipelineView.tsx) plus a fourth, differently-valued hex
// map here — they'd already drifted (e.g. "Technical / Case Interview" was
// red in this map but amber in the pill badges). Every pill/dot/column/bar
// in the app now derives from this one map.
export type PillVariant = 'neutral' | 'slate' | 'indigo' | 'violet' | 'amber' | 'green' | 'red' | 'pink';

export const STAGE_PILL_VARIANT: Record<string, PillVariant> = {
  // English internship/job stages
  'Wishlist':                   'neutral',
  'Applied':                    'slate',
  'OA / Online Assessment':     'indigo',
  'Phone / Recruiter Screen':   'violet',
  'Final Round Interviews':     'amber',
  'Offer':                      'green',
  'Rejected':                   'red',
  'Recruiter Screen':           'violet',
  'Technical / Case Interview': 'amber',
  'Final Round':                'amber',
  'Offer — Negotiating':        'green',
  'Accepted':                   'green',
  'Declined':                   'neutral',
  // Japanese shuukatsu stages
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
  '不採用':     'red',
  '辞退':       'neutral',
};

// Matches the --pill-{variant}-dot light-mode values in globals.css, so a
// solid-fill use (funnel bar) and a pill-badge use (StagePill) of the same
// stage are always the same color.
export const PILL_VARIANT_HEX: Record<PillVariant, string> = {
  neutral: '#8C8474',
  slate:   '#6B848C',
  indigo:  '#8760A0',
  violet:  '#3F9088',
  amber:   '#C08A2E',
  green:   '#6C8A54',
  red:     '#B85B3E',
  pink:    '#B9707F',
};

export const STAGE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(STAGE_PILL_VARIANT).map(([stage, variant]) => [stage, PILL_VARIANT_HEX[variant]]),
);

export const SCHOOL_YEARS = ['High school', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
export const RECRUITING_SEASONS = ['Spring 2026', 'Summer 2026', 'Fall 2026', 'Spring 2027'];
export const CAREER_LEVELS = ['New grad', 'Early career', 'Mid-career', 'Senior+'];

export const AI_FREE_DAILY_LIMIT = 3;
export const AI_PRO_DAILY_LIMIT = 20;

// ── Shuukatsu (Japanese Recruiting) Stages ──────────────────────────────────
export interface ShuukatsuStageConfig {
  id: ShuukatsuStage;
  label: string;
  color: string;
  order: number;
}

// Colors derive from PILL_VARIANT_HEX via STAGE_PILL_VARIANT (same lookup
// STAGE_COLORS uses above) so this JA-specific list can't drift from the
// pill-variant palette — previously this held its own independent hex per
// stage, an eighth copy of the same eight colors.
export const SHUUKATSU_STAGES: ShuukatsuStageConfig[] = [
  { id: 'エントリー',       label: 'エントリー',       color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['エントリー']], order: 1 },
  { id: '説明会',           label: '説明会',           color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['説明会']], order: 2 },
  { id: 'ES提出',           label: 'ES提出',           color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['ES提出']], order: 3 },
  { id: 'SPI',              label: 'SPI / 適性検査',   color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['SPI']], order: 4 },
  { id: '一次面接',         label: '一次面接',         color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['一次面接']], order: 5 },
  { id: '二次面接',         label: '二次面接',         color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['二次面接']], order: 6 },
  { id: '最終面接',         label: '最終面接',         color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['最終面接']], order: 7 },
  { id: '内々定',           label: '内々定',           color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['内々定']], order: 8 },
  { id: '内定',             label: '内定',             color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['内定']], order: 9 },
  { id: '承諾',             label: '承諾 / 辞退',      color: PILL_VARIANT_HEX[STAGE_PILL_VARIANT['承諾']], order: 10 },
];

export const SHUUKATSU_STAGE_COLORS: Record<string, string> = Object.fromEntries(
  SHUUKATSU_STAGES.map(({ id, color }) => [id, color]),
);
