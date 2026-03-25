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

export type PipelineStage = InternshipStage | JobStage;

export type Category =
  | 'Engineering'
  | 'Product Management'
  | 'Design'
  | 'Data Science'
  | 'Finance'
  | 'Marketing'
  | 'Operations'
  | 'Other';

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  category: Category | '';
  status: PipelineStage;
  deadline: string | null;
  job_link: string;
  notes: string;
  recruiter_name: string;
  recruiter_email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  mode: Mode;
  school_year: string;
  career_level: string;
  recruiting_season: string;
  created_at: string;
  onboarding_complete: boolean;
}
