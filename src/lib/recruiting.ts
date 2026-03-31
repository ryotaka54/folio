import type { Application } from './types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function startOfWeekStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.toISOString().split('T')[0];
}

// ─── Streak ───────────────────────────────────────────────────────────────────

interface StreakData { count: number; lastSeen: string }

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem('applyd_streak');
    if (!raw) return { count: 0, lastSeen: '' };
    return JSON.parse(raw);
  } catch { return { count: 0, lastSeen: '' }; }
}

export function touchStreak(): StreakData {
  const today = todayStr();
  const existing = getStreak();

  if (existing.lastSeen === today) return existing;

  const diff = existing.lastSeen ? daysBetween(existing.lastSeen, today) : 999;
  const count = diff === 1 ? existing.count + 1 : 1;
  const data: StreakData = { count, lastSeen: today };
  localStorage.setItem('applyd_streak', JSON.stringify(data));
  return data;
}

export function getStreakMilestone(count: number): string | null {
  const milestones: Record<number, string> = {
    3: '3-day streak 🔥 You\'re building a habit.',
    7: '7-day streak 🔥 One week straight. Keep it up.',
    14: '14-day streak 🔥 Two weeks. You\'re serious about this.',
    30: '30-day streak 🔥 A full month. Unstoppable.',
  };
  return milestones[count] ?? null;
}

// ─── Weekly goal ──────────────────────────────────────────────────────────────

interface WeeklyGoalData { goal: number; weekStart: string }

export function getWeeklyGoal(): WeeklyGoalData | null {
  try {
    const raw = localStorage.getItem('applyd_weekly_goal');
    if (!raw) return null;
    const data: WeeklyGoalData = JSON.parse(raw);
    if (data.weekStart !== startOfWeekStr()) return null; // stale
    return data;
  } catch { return null; }
}

export function setWeeklyGoal(goal: number): void {
  localStorage.setItem('applyd_weekly_goal', JSON.stringify({ goal, weekStart: startOfWeekStr() }));
}

export function appsAddedThisWeek(applications: Application[]): number {
  const weekStart = startOfWeekStr();
  return applications.filter(a => {
    if (!a.created_at) return false;
    return a.created_at.split('T')[0] >= weekStart && a.status !== 'Wishlist';
  }).length;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

const INTERVIEW_STATUSES = [
  'OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews',
  'Recruiter Screen', 'Technical / Case Interview', 'Final Round',
];
const OFFER_STATUSES = ['Offer', 'Offer — Negotiating'];

interface GreetingContext {
  name: string;
  applications: Application[];
}

export function computeGreeting({ name, applications }: GreetingContext): string {
  const first = name.split(' ')[0];
  const hour = new Date().getHours();
  const dow = new Date().getDay(); // 0=Sun, 1=Mon, ..., 5=Fri
  const today = todayStr();

  const totalApps = applications.length;
  const interviews = applications.filter(a => INTERVIEW_STATUSES.includes(a.status));
  const offers = applications.filter(a => OFFER_STATUSES.includes(a.status));
  const todayDeadlines = applications.filter(a => a.deadline === today);
  const appliedCount = applications.filter(a => a.status !== 'Wishlist').length;
  const weekApps = appsAddedThisWeek(applications);

  // Priority: offer > deadline today > final round > interviews > Monday > Friday > default
  if (offers.length > 0) {
    const msg = `${first}, you have an offer on the table. This is what all the work was for.`;
    return msg;
  }

  if (todayDeadlines.length > 0) {
    const co = todayDeadlines[0].company;
    return `${first}, you have a deadline TODAY${todayDeadlines.length > 1 ? ` (${todayDeadlines.length} of them)` : ` — ${co}`}. Don't let this one slip.`;
  }

  if (interviews.length > 0) {
    const msgs = [
      `${first}, you have ${interviews.length} interview${interviews.length !== 1 ? 's' : ''} in play. Stay sharp.`,
      `${interviews.length} active interview${interviews.length !== 1 ? 's' : ''}, ${first}. You're close — keep the momentum.`,
    ];
    return pickMessage('greeting_interview', msgs);
  }

  if (totalApps === 0) {
    return `${first}, ready to start your recruiting journey? Add your first application and let's go.`;
  }

  // Monday kickoff
  if (dow === 1) {
    const msgs = [
      `New week, ${first}. Here's where your search stands — keep pushing.`,
      `Fresh week ahead, ${first}. You applied to ${weekApps} companies last week. Let's build on that.`,
    ];
    return pickMessage('greeting_monday', msgs);
  }

  // Friday recap
  if (dow === 5) {
    const msgs = [
      `End of the week, ${first}. You've applied to ${weekApps} compan${weekApps === 1 ? 'y' : 'ies'} this week. Keep the momentum going.`,
      `Week's almost done, ${first}. ${appliedCount} total applications out — strong work.`,
    ];
    return pickMessage('greeting_friday', msgs);
  }

  // Time-of-day defaults
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const defaultMsgs = [
    `${timeGreeting}, ${first}. You have ${appliedCount} application${appliedCount !== 1 ? 's' : ''} out. Keep pushing.`,
    `${timeGreeting}, ${first}. ${appliedCount} compan${appliedCount !== 1 ? 'ies' : 'y'} could be looking at your resume right now.`,
    `${first}, you have ${appliedCount} application${appliedCount !== 1 ? 's' : ''} out. Have you followed up on any recently?`,
  ];
  return pickMessage('greeting_default', defaultMsgs);
}

function pickMessage(key: string, msgs: string[]): string {
  try {
    const stored = localStorage.getItem(`applyd_last_msg_${key}`);
    const storedDate = localStorage.getItem(`applyd_last_msg_date_${key}`);
    const today = todayStr();
    let idx = 0;
    if (storedDate === today && stored !== null) {
      idx = parseInt(stored, 10);
    } else {
      const prev = parseInt(stored ?? '-1', 10);
      idx = (prev + 1) % msgs.length;
      localStorage.setItem(`applyd_last_msg_${key}`, String(idx));
      localStorage.setItem(`applyd_last_msg_date_${key}`, today);
    }
    return msgs[idx];
  } catch {
    return msgs[0];
  }
}

// ─── Momentum score ───────────────────────────────────────────────────────────

export type MomentumLabel = 'Cold' | 'Warming Up' | 'Active' | 'On Fire' | 'Unstoppable';

export interface MomentumScore {
  score: number;
  label: MomentumLabel;
  color: string;
}

export function computeMomentum(applications: Application[]): MomentumScore {
  const weekApps = appsAddedThisWeek(applications);
  const activeApps = applications.filter(a =>
    !['Wishlist', 'Rejected', 'Declined'].includes(a.status)
  ).length;
  const interviewApps = applications.filter(a =>
    INTERVIEW_STATUSES.includes(a.status)
  ).length;
  const hasDeadlines = applications.filter(a => a.deadline).length;

  // Score components (0–100)
  const weekScore = Math.min(weekApps * 8, 40);       // up to 40pts
  const activeScore = Math.min(activeApps * 2, 25);    // up to 25pts
  const interviewScore = Math.min(interviewApps * 5, 20); // up to 20pts
  const orgScore = Math.min(hasDeadlines * 1, 15);     // up to 15pts

  const raw = weekScore + activeScore + interviewScore + orgScore;
  const score = Math.min(Math.round(raw), 100);

  let label: MomentumLabel;
  let color: string;
  if (score >= 80) { label = 'Unstoppable'; color = '#16A34A'; }
  else if (score >= 60) { label = 'On Fire'; color = '#16A34A'; }
  else if (score >= 40) { label = 'Active'; color = '#2563EB'; }
  else if (score >= 20) { label = 'Warming Up'; color = '#D97706'; }
  else { label = 'Cold'; color = '#9CA3AF'; }

  return { score, label, color };
}

// ─── Nudges ───────────────────────────────────────────────────────────────────

export interface Nudge {
  id: string;
  message: string;
  action?: string;
  appId?: string;
}

const DISMISS_KEY = 'applyd_dismissed_nudges';
const DISMISS_TTL = 48 * 60 * 60 * 1000; // 48h

function getDismissed(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '{}'); } catch { return {}; }
}

export function dismissNudge(id: string): void {
  const dismissed = getDismissed();
  dismissed[id] = Date.now();
  // Prune old dismissals
  const now = Date.now();
  for (const k of Object.keys(dismissed)) {
    if (now - dismissed[k] > DISMISS_TTL) delete dismissed[k];
  }
  localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed));
}

export function computeNudges(applications: Application[]): Nudge[] {
  const dismissed = getDismissed();
  const now = Date.now();
  const today = todayStr();
  const nudges: Nudge[] = [];

  const notDismissed = (id: string) => !dismissed[id] || now - dismissed[id] > DISMISS_TTL;

  // Nudge 1: No apps in 5 days
  const latestApp = applications
    .filter(a => a.created_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (latestApp && notDismissed('no_apps_5d')) {
    const daysSince = daysBetween(latestApp.created_at.split('T')[0], today);
    if (daysSince >= 5) {
      nudges.push({
        id: 'no_apps_5d',
        message: `You haven't logged any applications in ${daysSince} days. Recruiting season waits for no one.`,
        action: 'Add application',
      });
    }
  }

  // Nudge 2: OA > 5 days old, no deadline
  const oaApps = applications.filter(a =>
    a.status === 'OA / Online Assessment' && !a.deadline && a.created_at
  );
  for (const app of oaApps.slice(0, 2)) {
    const id = `oa_${app.id}`;
    if (notDismissed(id)) {
      const days = daysBetween(app.created_at.split('T')[0], today);
      if (days >= 5) {
        nudges.push({
          id,
          message: `Have you completed the OA for ${app.company}? It's been ${days} days — update your status to stay on track.`,
          appId: app.id,
        });
      }
    }
  }

  // Nudge 3: Interview > 3 days, no follow up noted
  const interviewApps = applications.filter(a =>
    ['Phone / Recruiter Screen', 'Final Round Interviews', 'Recruiter Screen', 'Technical / Case Interview', 'Final Round'].includes(a.status) &&
    a.created_at && !a.notes?.toLowerCase().includes('follow')
  );
  for (const app of interviewApps.slice(0, 2)) {
    const id = `followup_${app.id}`;
    if (notDismissed(id)) {
      const days = daysBetween(app.updated_at?.split('T')[0] ?? app.created_at.split('T')[0], today);
      if (days >= 3) {
        nudges.push({
          id,
          message: `Did you follow up with ${app.company} after your interview? A thank you email can make the difference.`,
          appId: app.id,
        });
      }
    }
  }

  // Nudge 4: Final Round > 7 days, no update
  const finalApps = applications.filter(a =>
    ['Final Round Interviews', 'Final Round'].includes(a.status) && a.updated_at
  );
  for (const app of finalApps.slice(0, 1)) {
    const id = `final_${app.id}`;
    if (notDismissed(id)) {
      const days = daysBetween(app.updated_at.split('T')[0], today);
      if (days >= 7) {
        nudges.push({
          id,
          message: `It's been ${days} days since your final round with ${app.company}. Have you heard back? Update your status.`,
          appId: app.id,
        });
      }
    }
  }

  return nudges.slice(0, 3);
}

// ─── Season ───────────────────────────────────────────────────────────────────

export interface SeasonInfo {
  name: string;
  daysLeft: number;
  urgent: boolean;
}

// Maps a recruiting_season profile value like "Summer 2026" to its offer-deadline end date.
// Season strings match RECRUITING_SEASONS in constants.ts.
function seasonEndDate(recruitingSeason: string): string {
  const [term, yearStr] = recruitingSeason.trim().split(' ');
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) return '';
  switch (term) {
    case 'Spring':  return `${year}-04-15`; // spring offer deadlines cluster mid-April
    case 'Summer':  return `${year}-04-01`; // summer internship offer deadlines ~April
    case 'Fall':    return `${year}-08-15`; // fall recruiting wraps mid-August
    case 'Winter':  return `${year}-12-15`;
    default:        return `${year}-06-01`;
  }
}

export function getSeasonInfo(recruitingSeason?: string | null): SeasonInfo {
  const today = todayStr();

  if (recruitingSeason) {
    const endDate = seasonEndDate(recruitingSeason);
    if (endDate) {
      const daysLeft = daysBetween(today, endDate);
      return {
        name: recruitingSeason,
        daysLeft: Math.max(0, daysLeft),
        urgent: daysLeft <= 30,
      };
    }
  }

  // Fallback: infer from current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let name: string, endDate: string;
  if (month <= 4)  { name = `Summer ${year}`;       endDate = `${year}-04-01`; }
  else if (month <= 7) { name = `Fall ${year}`;     endDate = `${year}-08-15`; }
  else if (month <= 10){ name = `Summer ${year+1}`; endDate = `${year+1}-04-01`; }
  else             { name = `Spring ${year+1}`;     endDate = `${year+1}-04-15`; }

  const daysLeft = daysBetween(today, endDate);
  return { name, daysLeft: Math.max(0, daysLeft), urgent: daysLeft <= 30 };
}

// ─── Seasonal tips ────────────────────────────────────────────────────────────

const SEASONAL_TIPS: Record<number, string[]> = {
  1: ['January is peak finance and consulting recruiting. If you applied in November, now is the time to follow up.', 'Return offer decisions happen in Jan–Feb. If you did a co-op or internship, check your inbox.'],
  2: ['Offer deadline season starts now. Collect your options and compare carefully before committing.', 'Spring OCI (On Campus Interviewing) is in full swing. Check your career center\'s recruiting calendar.'],
  3: ['Offer deadlines cluster in March–April. Exploding offers are common — don\'t let one pressure you into a bad decision.', 'Late spring recruiting is your chance to catch roles that opened after fall season. Don\'t stop applying.'],
  4: ['April is when many companies finalize their summer intern classes. Positions are still being filled.', 'If you have competing offers, now is the time to negotiate. Research market rates and don\'t leave money on the table.'],
  5: ['Summer internship season is winding down for applications. Lock in your plans if you haven\'t already.', 'Start prepping for fall full-time recruiting if you\'re graduating. Summer is the time to network.'],
  6: ['Use summer to build projects, get referrals, and prep LeetCode for fall recruiting season starting in August.', 'Many companies open full-time applications in August. Start researching and updating your resume now.'],
  7: ['Fall recruiting for tech starts in weeks. Polish your resume, line up references, and prep your behavioral answers.', 'July is the last calm month before the storm. Set your company list and prioritize applications.'],
  8: ['August is when most large tech companies open internship applications. Apply now — positions fill fast.', 'Software engineering roles at Google, Meta, and Amazon open this month. Get your applications in early.'],
  9: ['September is peak recruiting for tech, finance, and consulting simultaneously. Prioritize your target list.', 'Finance superdays and consulting case interview rounds begin in September. Practice daily.'],
  10: ['Mid-October is when most tech companies are deep in interview loops. Follow up on applications from August.', 'If you applied in August and haven\'t heard back, a polite follow up email to the recruiter is appropriate.'],
  11: ['November is peak finance recruiting. Goldman, Morgan Stanley, and JPMorgan rounds are happening now.', 'Many tech companies pause recruiting in November–December. Don\'t panic — applications resume in January.'],
  12: ['December is a slow month for new applications. Focus on interview prep and staying warm with recruiters.', 'Use the holiday break to prep LeetCode, refine your resume, and set goals for the new year.'],
};

export function getSeasonalTip(): string {
  const month = new Date().getMonth() + 1;
  const tips = SEASONAL_TIPS[month] ?? ['Keep applying — consistency is the key to landing offers.'];

  try {
    const weekKey = `applyd_tip_week_${getISOWeek()}`;
    const stored = localStorage.getItem('applyd_last_tip_week');
    const storedTipIdx = localStorage.getItem('applyd_last_tip_idx');
    const currentWeek = String(getISOWeek());

    let idx = 0;
    if (stored === currentWeek && storedTipIdx !== null) {
      idx = parseInt(storedTipIdx, 10);
    } else {
      const prev = parseInt(storedTipIdx ?? '-1', 10);
      idx = (prev + 1) % tips.length;
      localStorage.setItem('applyd_last_tip_week', currentWeek);
      localStorage.setItem('applyd_last_tip_idx', String(idx));
    }
    void weekKey;
    return tips[idx];
  } catch {
    return tips[0];
  }
}

function getISOWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// ─── Company research ─────────────────────────────────────────────────────────

export interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  hasOA: boolean;
  applicationWindow: string;
  timeline: string;
  tip: string;
}

let _companiesCache: CompanyInfo[] | null = null;

export async function lookupCompany(query: string): Promise<CompanyInfo | null> {
  if (!query.trim() || query.length < 2) return null;
  if (!_companiesCache) {
    try {
      const data = await import('@/data/companies.json');
      _companiesCache = data.companies as CompanyInfo[];
    } catch { return null; }
  }
  const q = query.toLowerCase();
  return _companiesCache.find(c =>
    c.name.toLowerCase() === q ||
    (c as unknown as { aliases: string[] }).aliases?.some((a: string) => a === q || q.includes(a) || a.includes(q))
  ) ?? null;
}
