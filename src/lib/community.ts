// ── Community challenge constants & helpers ────────────────────────────────

/** Day 1 of the 100-day challenge. Update this once — everything else is automatic. */
export const CHALLENGE_START_DATE = new Date('2026-04-03');

export type IdeaStatus = 'pending' | 'winning' | 'building' | 'live' | 'rejected';

export interface CommunityIdea {
  id: string;
  idea_text: string;
  tiktok_username: string | null;
  vote_count: number;
  date_submitted: string;
  status: IdeaStatus;
  day_number: number | null;
  feature_name: string | null;
  feature_description: string | null;
  built_date: string | null;
  screenshot_url: string | null;
}

export interface ChallengeConfig {
  id: number;
  challenge_start_date: string;
  current_day_winner_id: string | null;
  challenge_active: boolean;
}

/** Returns the current challenge day (1-indexed). Day 1 = CHALLENGE_START_DATE. */
export function getChallengeDay(): number {
  const now = new Date();
  const start = new Date(CHALLENGE_START_DATE);
  const diffMs = now.getTime() - start.getTime();
  const diff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

/** localStorage key for a vote — resets automatically each day. */
function voteKey(ideaId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `applyd_vote_${ideaId}_${today}`;
}

export function hasVotedToday(ideaId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(voteKey(ideaId)) === '1';
}

export function markVotedToday(ideaId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(voteKey(ideaId), '1');
}

/** Seconds until local midnight. Used for the countdown timer. */
export function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}
