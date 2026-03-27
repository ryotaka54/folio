import { InternshipStage, JobStage, Category } from './types';

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
  'Finance',
  'Data Science',
  'Product Management',
  'Design',
  'Marketing',
  'Consulting',
  'Operations',
  'Other',
];

export const STAGE_COLORS: Record<string, string> = {
  'Wishlist': '#8B5CF6',
  'Applied': '#4361EE',
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
};

export const SCHOOL_YEARS = ['High school', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
export const RECRUITING_SEASONS = ['Spring 2026', 'Summer 2026', 'Fall 2026', 'Spring 2027'];
export const CAREER_LEVELS = ['New grad', 'Early career', 'Mid-career', 'Senior+'];
