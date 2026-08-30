'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Application } from '@/lib/types';
import { appsAddedThisWeek, getWeeklyGoal } from '@/lib/recruiting';
import CompanyAvatar from './CompanyAvatar';
import StagePill from './StagePill';
import EmptyState from './EmptyState';
import WeeklyCoach from './ai/WeeklyCoach';
import { Clock, TrendingUp, Trophy, Target, Mail, Sparkles } from 'lucide-react';

interface TodayViewProps {
  applications: Application[];
  userName?: string;
  onOpenApp: (app: Application) => void;
  locale?: 'ja';
  prepRoute?: string; // defaults to '/interview'
  /** Empty-state ("no applications yet") wiring — omit to fall back to a plain message. */
  onAdd?: () => void;
  onAutofillUrl?: (url: string) => void;
  hideExtensionHint?: boolean;
  /** Weekly Coach — English only for now (its UI copy isn't localized yet). */
  isPro?: boolean;
  onUpgrade?: () => void;
}

const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);
const WIN_STAGES = new Set([
  'Phone / Recruiter Screen', 'Recruiter Screen',
  'Final Round Interviews', 'Technical / Case Interview', 'Final Round',
  'Offer', 'Offer — Negotiating', 'Accepted',
  '一次面接', '二次面接', '最終面接', '内々定', '内定',
]);
const URGENT_DAYS = 3;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr: string, refStr: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(refStr).getTime()) / 86400000);
}

function fmtDate(iso: string): string {
  const today = todayStr();
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return `in ${diff}d`;
  if (diff < 0 && diff > -14) return `${-diff}d ago`;
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateJa(iso: string): string {
  const today = todayStr();
  const diff = daysBetween(iso, today);
  if (diff === 0) return '今日';
  if (diff === 1) return '明日';
  if (diff === -1) return '昨日';
  if (diff > 0 && diff < 7) return `${diff}日後`;
  if (diff < 0 && diff > -14) return `${-diff}日前`;
  const d = new Date(iso + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function build28DayActivity(applications: Application[]) {
  const result: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = applications.filter(a => a.created_at?.startsWith(dateStr)).length;
    result.push({ date: dateStr, count });
  }
  return result;
}

function ActivityStrip({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
      {data.map(d => {
        const intensity = d.count / max;
        const h = Math.round(4 + intensity * 26);
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.count}`}
            style={{
              width: 11,
              height: h,
              borderRadius: 2,
              background: d.count === 0
                ? 'var(--surface-gray)'
                : `color-mix(in oklch, var(--accent-blue) ${Math.round(30 + intensity * 70)}%, var(--surface-gray))`,
              alignSelf: 'flex-end',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function Section({ title, subtitle, action, onAction, children }: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', margin: 0, color: 'var(--brand-navy)' }}>{title}</h3>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--muted-text)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action && (
          <button
            onClick={onAction}
            className="hover:text-text"
            style={{ fontSize: 12, color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {action} ↗
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function DeckRow({ a, days, urgent, locale, onOpenApp }: {
  a: Application; days: number; urgent: boolean; locale?: 'ja'; onOpenApp: (a: Application) => void;
}) {
  return (
    <div
      onClick={() => onOpenApp(a)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenApp(a)}
      className="hover:bg-surface-gray"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 44, textAlign: 'center', padding: '4px 0', borderRadius: 6, flexShrink: 0,
        background: urgent ? 'var(--warn-bg)' : 'var(--surface-gray)',
        color: urgent ? 'var(--amber-warning)' : 'var(--muted-text)',
        fontSize: 11, fontWeight: 500,
        border: '1px solid var(--border-gray)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{days === 0 ? (locale === 'ja' ? '今日' : 'Now') : days}</div>
        {days !== 0 && <div style={{ fontSize: 9, marginTop: 1, opacity: 0.8 }}>{locale === 'ja' ? '日' : (days === 1 ? 'day' : 'days')}</div>}
      </div>
      <CompanyAvatar company={a.company} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</div>
      </div>
      <StagePill stage={a.status} size="sm" />
    </div>
  );
}

export default function TodayView({
  applications, userName, onOpenApp, locale, prepRoute = '/interview',
  onAdd, onAutofillUrl, hideExtensionHint, isPro, onUpgrade,
}: TodayViewProps) {
  const today = todayStr();
  const router = useRouter();

  const prepWithAI = useCallback((app: Application) => {
    router.push(`${prepRoute}?company=${encodeURIComponent(app.company)}&role=${encodeURIComponent(app.role)}`);
  }, [router, prepRoute]);

  const actionable = useMemo(() =>
    applications
      .filter(a => a.deadline && !TERMINAL.has(a.status) && daysBetween(a.deadline, today) >= 0)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 8),
    [applications, today]
  );

  const nextUp = actionable[0];
  const rest = actionable.slice(1, 7);
  // Split the remaining deck into "needs attention" (due within URGENT_DAYS)
  // and a calmer "this week" group — the brief asked for a real priority
  // zone at the top, not one flat list where urgency only shows up as a
  // per-row chip color.
  const needsAttention = rest.filter(a => daysBetween(a.deadline!, today) <= URGENT_DAYS);
  const thisWeek = rest.filter(a => daysBetween(a.deadline!, today) > URGENT_DAYS);

  const stuck = useMemo(() =>
    applications
      .filter(a => {
        if (a.status !== 'Applied' && a.status !== 'エントリー') return false;
        const ref = a.updated_at || a.created_at;
        if (!ref) return false;
        return daysBetween(today, ref.split('T')[0]) >= 14;
      })
      .slice(0, 4),
    [applications, today]
  );

  const recentWins = useMemo(() =>
    applications.filter(a => WIN_STAGES.has(a.status)).slice(0, 4),
    [applications]
  );

  const activity = useMemo(() => build28DayActivity(applications), [applications]);

  const weeklyCount = appsAddedThisWeek(applications);

  const RESPONDED_STAGES = useMemo(() => new Set([
    'OA / Online Assessment', 'Phone / Recruiter Screen', 'Recruiter Screen',
    'Final Round Interviews', 'Technical / Case Interview', 'Final Round',
    'Offer', 'Offer — Negotiating', 'Accepted',
    'OA', '一次面接', '二次面接', '最終面接', '内々定', '内定',
  ]), []);

  const responseRate = useMemo(() => {
    const applied = applications.filter(a => a.status !== 'Wishlist').length;
    const responded = applications.filter(a => RESPONDED_STAGES.has(a.status)).length;
    return applied >= 5 ? Math.round((responded / applied) * 100) : null;
  }, [applications, RESPONDED_STAGES]);

  // Outcome-oriented momentum, not raw activity: how many applications are
  // sitting in a responded-or-further stage, grouped by when they last moved
  // there. A raw "day streak" punishes any gap in daily activity — this
  // tracks progress toward the thing that actually matters (a response),
  // and a slow week just shows a flat/lower number, never a broken streak.
  const monthlyResponses = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const responded = applications.filter(a => RESPONDED_STAGES.has(a.status) && a.updated_at);
    const thisMonth = responded.filter(a => new Date(a.updated_at!) >= thisMonthStart).length;
    const lastMonth = responded.filter(a => {
      const d = new Date(a.updated_at!);
      return d >= lastMonthStart && d < thisMonthStart;
    }).length;
    return { thisMonth, lastMonth };
  }, [applications, RESPONDED_STAGES]);

  const weeklyGoalData = getWeeklyGoal();
  const weeklyGoal = weeklyGoalData?.goal ?? 10;
  const goalPct = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100));

  const dateLabel = locale === 'ja'
    ? new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Real status summary instead of a decorative greeting — but only escalate
  // tone for genuinely imminent deadlines (within URGENT_DAYS, ~48-72h), not
  // just because a "next up" item exists somewhere on the calendar. A deadline
  // three weeks out is not urgent, and a calm dashboard shouldn't read like one.
  const nextUpIsUrgent = !!nextUp && daysBetween(nextUp.deadline!, today) <= URGENT_DAYS;
  const urgentCount = (nextUpIsUrgent ? 1 : 0) + needsAttention.length;
  const dueToday = actionable.filter(a => daysBetween(a.deadline!, today) === 0).length;
  const statusLine = locale === 'ja'
    ? (urgentCount === 0
        ? 'すぐに対応が必要な選考はありません。順調です。'
        : dueToday > 0
          ? `本日締め切りが${dueToday}件あります。`
          : `${urgentCount}件、まもなく締め切りです。`)
    : (urgentCount === 0
        ? "Nothing urgent right now — you're in good shape."
        : dueToday > 0
          ? `${dueToday} deadline${dueToday === 1 ? '' : 's'} today.`
          : `${urgentCount} deadline${urgentCount === 1 ? '' : 's'} coming up soon.`);

  return (
    <div style={{ padding: '28px 24px 80px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 12, color: 'var(--muted-text)',
          fontFamily: 'var(--mono, ui-monospace)',
          letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          {dateLabel}
        </div>
        <h1
          className={locale === 'ja' ? '' : 'font-display'}
          style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2, color: 'var(--brand-navy)', fontFamily: locale === 'ja' ? "'Noto Sans JP', sans-serif" : undefined }}
        >
          {locale === 'ja'
            ? (userName ? `${userName}さん、` : 'こんにちは。')
            : (userName ? `Morning, ${userName}.` : 'Good morning.')}
        </h1>
        <p style={{ fontSize: 14, margin: '4px 0 0', color: urgentCount > 0 ? 'var(--amber-warning)' : 'var(--muted-text)', fontWeight: urgentCount > 0 ? 500 : 400 }}>
          {statusLine}
        </p>
      </div>

      {applications.length === 0 ? (
        onAdd ? (
          <EmptyState onAdd={onAdd} onAutofillUrl={onAutofillUrl} hideExtensionHint={hideExtensionHint} locale={locale} />
        ) : (
          <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px dashed var(--border-gray)', borderRadius: 'var(--radius-2xl, 12px)' }}>
            <p style={{ fontSize: 15, color: 'var(--muted-text)', margin: 0 }}>
              {locale === 'ja' ? 'まだ選考を追加していません。' : 'No applications yet.'}
            </p>
          </div>
        )
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
          gap: 20,
        }}
          className="today-grid"
        >
          {/* ── LEFT COLUMN — needs attention now, then this week ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Next-up hero */}
            {nextUp ? (
              <div className="next-up-hero" style={{ padding: 24, borderRadius: 'var(--radius-2xl, 12px)', position: 'relative', overflow: 'hidden' }}>
                <div className="next-up-badge" style={{
                  position: 'absolute', top: 16, right: 16,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <Target size={11} /> {locale === 'ja' ? '次の期限' : 'Next up'}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <CompanyAvatar company={nextUp.company} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="next-up-company" style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      {nextUp.company}
                    </div>
                    <div className="next-up-role" style={{ fontSize: 14, marginTop: 2 }}>{nextUp.role}</div>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <StagePill stage={nextUp.status} />
                      <span className="next-up-deadline" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500,
                        padding: '4px 10px', borderRadius: 6,
                      }}>
                        <Clock size={11} /> {locale === 'ja' ? `締め切り ${fmtDateJa(nextUp.deadline!)}` : `Deadline ${fmtDate(nextUp.deadline!)}`}
                      </span>
                    </div>
                    {nextUp.notes && (
                      <div className="next-up-note" style={{
                        marginTop: 12, padding: '10px 12px', borderRadius: 8,
                        fontSize: 13, lineHeight: 1.5,
                      }}>
                        <span className="next-up-note-label" style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 6 }}>{locale === 'ja' ? 'メモ' : 'Note'}</span>
                        {nextUp.notes}
                      </div>
                    )}
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onOpenApp(nextUp)}
                        className="next-up-btn-primary"
                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {locale === 'ja' ? '開く' : 'Open'}
                      </button>
                      <button
                        onClick={() => prepWithAI(nextUp)}
                        className="next-up-btn-secondary"
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Sparkles size={13} /> {locale === 'ja' ? 'AIで面接対策' : 'Prep with AI'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 24, borderRadius: 'var(--radius-2xl, 12px)',
                border: '1px dashed var(--border-gray)',
                background: 'var(--card-bg)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: 'var(--muted-text)', margin: '0 0 4px' }}>
                  {locale === 'ja' ? '期限のある選考はありません' : 'No upcoming deadlines'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                  {locale === 'ja' ? '締め切りを設定すると、ここに表示されます。' : 'Add deadlines to applications to see them here.'}
                </p>
              </div>
            )}

            {/* Moving forward — proof the effort is working. This is the
                psychologically load-bearing section for an anxious job
                searcher and belongs above anything stalled/urgent, not
                buried in a side column beneath it. */}
            {recentWins.length > 0 && (
              <div style={{ padding: 20, borderRadius: 'var(--radius-2xl, 12px)', border: '1px solid var(--success-border)', background: 'var(--success-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--card-bg)',
                    color: 'var(--green-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{locale === 'ja' ? '選考が進んでいます' : 'Moving forward'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>
                      {locale === 'ja'
                        ? `${recentWins.length}件が面接・内定など次の段階に進んでいます。`
                        : `${recentWins.length} application${recentWins.length === 1 ? '' : 's'} in active interview or offer stages.`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentWins.map(a => (
                    <button
                      key={a.id}
                      onClick={() => onOpenApp(a)}
                      className="hover:bg-surface-gray"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        fontFamily: 'inherit', color: 'var(--brand-navy)', textAlign: 'left',
                      }}
                    >
                      <CompanyAvatar company={a.company} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</div>
                      </div>
                      <StagePill stage={a.status} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Needs attention — everything else due within URGENT_DAYS */}
            {needsAttention.length > 0 && (
              <Section
                title={locale === 'ja' ? '対応が必要' : 'Needs attention'}
                subtitle={locale === 'ja' ? `あと${URGENT_DAYS}日以内` : `Due within ${URGENT_DAYS} days`}
              >
                <div style={{
                  border: '1px solid color-mix(in oklch, var(--warn) 35%, transparent)',
                  borderRadius: 'var(--radius-lg, 8px)', overflow: 'hidden', background: 'var(--card-bg)',
                }}>
                  {needsAttention.map((a, i) => (
                    <div key={a.id} style={{ borderBottom: i < needsAttention.length - 1 ? '1px solid var(--border-gray)' : 'none' }}>
                      <DeckRow a={a} days={daysBetween(a.deadline!, today)} urgent locale={locale} onOpenApp={onOpenApp} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* This week — calmer, no urgency styling */}
            {thisWeek.length > 0 && (
              <Section
                title={locale === 'ja' ? '今週の予定' : 'This week'}
                subtitle={locale === 'ja' ? `締め切りまで${actionable.length}件` : `${actionable.length} with upcoming deadlines`}
              >
                <div style={{
                  border: '1px solid var(--border-gray)',
                  borderRadius: 'var(--radius-lg, 8px)',
                  overflow: 'hidden',
                  background: 'var(--card-bg)',
                }}>
                  {thisWeek.map((a, i) => (
                    <div key={a.id} style={{ borderBottom: i < thisWeek.length - 1 ? '1px solid var(--border-gray)' : 'none' }}>
                      <DeckRow a={a} days={daysBetween(a.deadline!, today)} urgent={false} locale={locale} onOpenApp={onOpenApp} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Nudge these */}
            {stuck.length > 0 && (
              <Section title={locale === 'ja' ? 'フォローアップ' : 'Nudge these'} subtitle={locale === 'ja' ? '2週間以上動きなし' : 'Applied 2+ weeks ago, no movement'}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {stuck.map(a => {
                    const ref = a.updated_at || a.created_at;
                    const days = ref ? daysBetween(today, ref.split('T')[0]) : 0;
                    return (
                      <button
                        key={a.id}
                        onClick={() => onOpenApp(a)}
                        className="hover:bg-surface-gray"
                        style={{
                          padding: 14, borderRadius: 'var(--radius-lg, 8px)',
                          border: '1px solid var(--border-gray)',
                          background: 'var(--card-bg)',
                          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                          color: 'var(--brand-navy)',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}
                      >
                        <CompanyAvatar company={a.company} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted-text)' }}>{locale === 'ja' ? `${days}日前に応募・進展なし` : `Applied ${days}d ago · no movement`}</div>
                        </div>
                        <span style={{
                          fontSize: 11, color: 'var(--accent-blue)',
                          background: 'var(--light-accent)',
                          padding: '3px 7px', borderRadius: 5, fontWeight: 500, flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <Mail size={10} /> {locale === 'ja' ? '連絡する' : 'Follow up'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* ── RIGHT COLUMN — calm summary strip ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Weekly Coach — English only for now, self-hides when not applicable */}
            {locale !== 'ja' && isPro !== undefined && onUpgrade && (
              <WeeklyCoach isPro={isPro} onUpgrade={onUpgrade} />
            )}

            {/* Progress — outcome-oriented framing instead of a raw activity
                streak. A quiet week just shows a flat/lower number here,
                never a "broken streak"; the response-rate line adds a
                typical-range so a low-seeming number can be read in context
                instead of assumed to be a personal failure. */}
            <div style={{ padding: 20, borderRadius: 'var(--radius-2xl, 12px)', border: '1px solid var(--border-gray)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--light-accent)',
                  color: 'var(--accent-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)' }}>{locale === 'ja' ? '進捗' : 'Progress'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>{locale === 'ja' ? '過去4週間の活動' : 'Activity, last 4 weeks'}</div>
                </div>
              </div>
              <ActivityStrip data={activity} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', gap: 12,
                marginTop: 14, paddingTop: 14,
                borderTop: '1px solid var(--border-gray)',
              }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--brand-navy)', fontVariantNumeric: 'tabular-nums' }}>
                    {monthlyResponses.thisMonth}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 1 }}>
                    {locale === 'ja' ? '今月の返信・選考進展' : 'responses this month'}
                  </div>
                  {monthlyResponses.lastMonth > 0 && (
                    <div style={{ fontSize: 10.5, marginTop: 2, color: monthlyResponses.thisMonth >= monthlyResponses.lastMonth ? 'var(--green-success)' : 'var(--muted-text)' }}>
                      {locale === 'ja'
                        ? `先月は${monthlyResponses.lastMonth}件`
                        : `${monthlyResponses.lastMonth} last month`}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--brand-navy)', fontVariantNumeric: 'tabular-nums' }}>
                    {responseRate !== null ? `${responseRate}%` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 1 }}>{locale === 'ja' ? '回答率' : 'response rate'}</div>
                  {responseRate !== null && (
                    <div style={{ fontSize: 10.5, marginTop: 2, color: 'var(--text-tertiary)' }}>
                      {locale === 'ja' ? '目安：15〜30%' : 'Typical range: 15–30%'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly goal — optional pace tracker, never a red/empty bar
                implying failure. Copy stays encouraging at every count,
                including zero. */}
            <div style={{ padding: 20, borderRadius: 'var(--radius-2xl, 12px)', border: '1px solid var(--border-gray)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)' }}>{locale === 'ja' ? '週間ペース' : "This week's pace"}</div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{locale === 'ja' ? '（任意）' : '(optional)'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-text)', fontFamily: 'var(--mono, ui-monospace)', fontVariantNumeric: 'tabular-nums' }}>
                  {weeklyCount} / {weeklyGoal}
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-gray)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(goalPct, weeklyCount > 0 ? 4 : 0)}%`,
                  borderRadius: 3,
                  background: 'var(--accent-blue)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted-text)', lineHeight: 1.5 }}>
                {weeklyCount >= weeklyGoal
                  ? (locale === 'ja' ? '目標達成 — 素晴らしい週でした。' : 'Goal hit — nice pace this week.')
                  : weeklyCount === 0
                    ? (locale === 'ja' ? 'この週はまだこれから。ペースにプレッシャーは不要です。' : "This week's still open — no pressure on pace. Quality over quantity.")
                    : (locale === 'ja' ? `今週は${weeklyCount}社。ペースに関わらず、一つひとつが積み重ねになります。` : `${weeklyCount} so far this week — every application counts, whatever the pace.`)}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .today-grid { grid-template-columns: 1fr !important; }
        }

        /* Next Up hero — CSS custom properties already swap value under
           .dark on the root, so one set of rules covers both themes; the
           old hardcoded .dark overrides here (literal #60A5FA/#F59E0B/etc.)
           predated the token system and were silently fighting it. */
        .next-up-hero {
          background: var(--card-bg);
          border: 1px solid var(--border-gray);
        }
        .next-up-badge { color: var(--accent-blue); }
        .next-up-company { color: var(--brand-navy); }
        .next-up-role { color: var(--muted-text); }
        .next-up-deadline {
          color: var(--amber-warning);
          background: var(--warn-bg);
        }
        .next-up-note {
          background: var(--surface-gray);
          border: 1px solid var(--border-gray);
          color: var(--muted-text);
        }
        .next-up-note-label { color: var(--brand-navy); }
        .next-up-btn-primary { background: var(--brand-navy); color: var(--background); }
        .next-up-btn-secondary {
          border: 1px solid var(--border-gray);
          background: transparent;
          color: var(--brand-navy);
        }
      `}</style>
    </div>
  );
}
