export type Mode = 'internship' | 'job';

export type InternshipStage =
  | 'Wishlist'
  | 'Applied'
  | 'OA / Online Assessment'
  | 'Phone / Recruiter Screen'
  | 'Final Round Interviews'
  | 'Offer'
  | 'Rejected';

export type JobStage =
  | 'Wishlist'
  | 'Applied'
  | 'Recruiter Screen'
  | 'Technical / Case Interview'
  | 'Final Round'
  | 'Offer — Negotiating'
  | 'Accepted'
  | 'Declined';

export type ShuukatsuStage =
  | 'エントリー'
  | '説明会'
  | 'ES提出'
  | 'SPI'
  | '一次面接'
  | '二次面接'
  | '最終面接'
  | '内々定'
  | '内定'
  | '承諾';

export type PipelineStage = InternshipStage | JobStage | ShuukatsuStage;

export interface InterviewStep {
  id: string;
  name: string;
  date: string | null;
  completed: boolean;
  notes: string;
}

export type Category =
  | 'Engineering'
  | 'Product Management'
  | 'Design'
  | 'Data Science'
  | 'Finance'
  | 'Accounting'
  | 'Consulting'
  | 'Marketing'
  | 'Sales & Business Development'
  | 'Human Resources'
  | 'Operations'
  | 'Supply Chain'
  | 'Research & Policy'
  | 'Communications & PR'
  | 'Legal'
  | 'Healthcare & Life Sciences'
  | 'Other';

export const TAG_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#3B82F6','#EC4899','#64748B'] as const;

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  category: Category | '';
  status: PipelineStage;
  deadline: string | null;
  job_link: string;
  notes: string;
  recruiter_name: string;
  recruiter_email: string;
  interview_steps: InterviewStep[];
  created_at: string;
  updated_at: string;
  ai_interview_prep?: unknown;
  ai_strength_signal?: unknown;
  ai_offer_intelligence?: unknown;
  google_calendar_event_id?: string | null;
  tags?: Tag[];
  salary_min?: number | null;
  salary_max?: number | null;
  equity_shares?: number | null;
  equity_cliff?: number | null;
  signing_bonus?: number | null;
  bonus_target?: number | null;
  offer_deadline?: string | null;
  offer_notes?: string;
}

export type RelationshipType = 'recruiter' | 'referral' | 'employee' | 'alumni' | 'other';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company: string;
  role: string;
  linkedin_url: string;
  email: string;
  phone: string;
  relationship_type: RelationshipType;
  notes: string;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
  application_ids?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  school: string;
  mode: Mode;
  school_year: string;
  career_level: string;
  recruiting_season: string;
  created_at: string;
  onboarding_complete: boolean;
  tutorial_completed?: boolean;
  pro?: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  pro_expires_at?: string | null;
  pipeline_type?: 'english' | 'shuukatsu';
  language_preference?: 'en' | 'ja';
  email_deadline_reminders?: boolean;
  email_weekly_digest?: boolean;
}
