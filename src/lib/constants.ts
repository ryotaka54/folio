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

export const STAGE_COLORS: Record<string, string> = {
  // English stages
  'Wishlist': '#8B5CF6',
  'Applied': '#2563EB',
  'OA / Online Assessment': '#06B6D4',
  'Phone / Recruiter Screen': '#F59E0B',
  'Final Round Interviews': '#EF4444',
  'Offer': '#1D9E75',
  'Rejected': '#9CA3AF',
  'Recruiter Screen': '#F59E0B',
  'Technical / Case Interview': '#EF4444',
  'Final Round': '#EC4899',
  'Offer — Negotiating': '#1D9E75',
  'Accepted': '#059669',
  'Declined': '#9CA3AF',
  // Japanese shuukatsu stages
  'エントリー': '#64748B',
  '説明会':     '#0EA5E9',
  'ES提出':     '#8B5CF6',
  'SPI':        '#F59E0B',
  '一次面接':   '#3B82F6',
  '二次面接':   '#6366F1',
  '最終面接':   '#EC4899',
  '内々定':     '#10B981',
  '内定':       '#22C55E',
  '承諾':       '#94A3B8',
  '不採用':     '#9CA3AF',
  '辞退':       '#9CA3AF',
};

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

export const SHUUKATSU_STAGES: ShuukatsuStageConfig[] = [
  { id: 'エントリー',       label: 'エントリー',       color: '#64748B', order: 1 },
  { id: '説明会',           label: '説明会',           color: '#0EA5E9', order: 2 },
  { id: 'ES提出',           label: 'ES提出',           color: '#8B5CF6', order: 3 },
  { id: 'SPI',              label: 'SPI / 適性検査',   color: '#F59E0B', order: 4 },
  { id: '一次面接',         label: '一次面接',         color: '#3B82F6', order: 5 },
  { id: '二次面接',         label: '二次面接',         color: '#6366F1', order: 6 },
  { id: '最終面接',         label: '最終面接',         color: '#EC4899', order: 7 },
  { id: '内々定',           label: '内々定',           color: '#10B981', order: 8 },
  { id: '内定',             label: '内定',             color: '#22C55E', order: 9 },
  { id: '承諾',             label: '承諾 / 辞退',      color: '#94A3B8', order: 10 },
];

export const SHUUKATSU_STAGE_COLORS: Record<string, string> = {
  'エントリー': '#64748B',
  '説明会':     '#0EA5E9',
  'ES提出':     '#8B5CF6',
  'SPI':        '#F59E0B',
  '一次面接':   '#3B82F6',
  '二次面接':   '#6366F1',
  '最終面接':   '#EC4899',
  '内々定':     '#10B981',
  '内定':       '#22C55E',
  '承諾':       '#94A3B8',
};
