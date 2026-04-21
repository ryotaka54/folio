'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Application } from '@/lib/types';
import { appsAddedThisWeek, getWeeklyGoal } from '@/lib/recruiting';
import CompanyAvatar from './CompanyAvatar';
import StagePill from './StagePill';
import { Clock, Flame, Trophy, Target, Mail, Sparkles, Calendar } from 'lucide-react';

interface TodayViewProps {
  applications: Application[];
  userName?: string;
  onOpenApp: (app: Application) => void;
}

const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);
const WIN_STAGES = new Set([
  'Phone / Recruiter Screen', 'Recruiter Screen',
  'Final Round Interviews', 'Technical / Case Interview', 'Final Round',
  'Offer', 'Offer — Negotiating', 'Accepted',
  '一次面接', '二次面接', '最終面接', '内々定', '内定',
]);

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

function AnimatedStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--brand-navy)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 1 }}>{label}</div>
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

function downloadIcs(app: Application) {
  if (!app.deadline) return;
  const dateStr = app.deadline.replace(/-/g, '');
  const uid = `${app.id}@applyd`;
  const summary = `${app.company} — ${app.role} Deadline`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Applyd//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:Application deadline for ${app.role} at ${app.company}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${app.company.toLowerCase().replace(/\s+/g, '-')}-deadline.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TodayView({ applications, userName, onOpenApp }: TodayViewProps) {
  const today = todayStr();
  const router = useRouter();

  const prepWithAI = useCallback((app: Application) => {
    router.push(`/interview?company=${encodeURIComponent(app.company)}&role=${encodeURIComponent(app.role)}`);
  }, [router]);

  const actionable = useMemo(() =>
    applications
      .filter(a => a.deadline && !TERMINAL.has(a.status) && daysBetween(a.deadline, today) >= 0)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 8),
    [applications, today]
  );

  const nextUp = actionable[0];
  const onDeck = actionable.slice(1, 7);

  const stuck = useMemo(() =>
    applications
      .filter(a => {
        if (a.status !== 'Applied') return false;
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
  const prevWeekCount = useMemo(() => {
    const sun = new Date();
    sun.setDate(sun.getDate() - sun.getDay());
    sun.setHours(0, 0, 0, 0);
    const prevSun = new Date(sun.getTime() - 7 * 86400000);
    return applications.filter(a => {
      if (!a.created_at) return false;
      const d = new Date(a.created_at);
      return d >= prevSun && d < sun;
    }).length;
  }, [applications]);

  const weeklyDelta = weeklyCount - prevWeekCount;

  const streak = useMemo(() => {
    let s = 0;
    for (let i = activity.length - 1; i >= 0; i--) {
      if (activity[i].count > 0) s++; else break;
    }
    return s;
  }, [activity]);

  const responseRate = useMemo(() => {
    const applied = applications.filter(a => a.status !== 'Wishlist').length;
    const responded = applications.filter(a =>
      ['OA / Online Assessment', 'Phone / Recruiter Screen', 'Recruiter Screen',
        'Final Round Interviews', 'Technical / Case Interview', 'Final Round',
        'Offer', 'Offer — Negotiating', 'Accepted',
        '一次面接', '二次面接', '最終面接', '内々定', '内定',
      ].includes(a.status)
    ).length;
    return applied >= 5 ? Math.round((responded / applied) * 100) : null;
  }, [applications]);

  const weeklyGoalData = getWeeklyGoal();
  const weeklyGoal = weeklyGoalData?.goal ?? 10;
  const goalPct = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100));

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2, color: 'var(--brand-navy)' }}>
          {userName ? `Morning, ${userName}.` : 'Good morning.'}{' '}
          <span style={{ color: 'var(--muted-text)' }}>Here's where things stand.</span>
        </h1>
      </div>

      {applications.length === 0 ? (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          border: '1px dashed var(--border-gray)',
          borderRadius: 14,
        }}>
          <p style={{ fontSize: 15, color: 'var(--muted-text)', margin: '0 0 8px' }}>No applications yet.</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>Add your first application to see your command center here.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
          gap: 20,
        }}
          className="today-grid"
        >
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Next-up hero */}
            {nextUp ? (
              <div className="next-up-hero" style={{ padding: 24, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
                <div className="next-up-badge" style={{
                  position: 'absolute', top: 16, right: 16,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <Target size={11} /> Next up
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
                        <Clock size={11} /> Deadline {fmtDate(nextUp.deadline!)}
                      </span>
                    </div>
                    {nextUp.notes && (
                      <div className="next-up-note" style={{
                        marginTop: 12, padding: '10px 12px', borderRadius: 8,
                        fontSize: 13, lineHeight: 1.5,
                      }}>
                        <span className="next-up-note-label" style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 6 }}>Note</span>
                        {nextUp.notes}
                      </div>
                    )}
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onOpenApp(nextUp)}
                        className="next-up-btn-primary"
                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Open
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
                        <Sparkles size={13} /> Prep with AI
                      </button>
                      {nextUp.deadline && (
                        <button
                          onClick={() => downloadIcs(nextUp)}
                          className="next-up-btn-secondary"
                          title="Add to calendar"
                          style={{
                            padding: '7px 12px', borderRadius: 8,
                            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <Calendar size={13} /> Add to calendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 24, borderRadius: 14,
                border: '1px dashed var(--border-gray)',
                background: 'var(--card-bg)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: 'var(--muted-text)', margin: '0 0 4px' }}>No upcoming deadlines</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Add deadlines to applications to see them here.</p>
              </div>
            )}

            {/* On deck */}
            {onDeck.length > 0 && (
              <Section title="On deck" subtitle={`${actionable.length} with upcoming deadlines`}>
                <div style={{
                  border: '1px solid var(--border-gray)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--card-bg)',
                }}>
                  {onDeck.map((a, i) => {
                    const days = daysBetween(a.deadline!, today);
                    const urgent = days <= 3;
                    return (
                      <div
                        key={a.id}
                        onClick={() => onOpenApp(a)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && onOpenApp(a)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px',
                          borderBottom: i < onDeck.length - 1 ? '1px solid var(--border-gray)' : 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-gray)'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                      >
                        {/* Day countdown chip */}
                        <div style={{
                          width: 44, textAlign: 'center', padding: '4px 0', borderRadius: 6, flexShrink: 0,
                          background: urgent ? 'var(--warn-bg, rgba(217,119,6,0.08))' : 'var(--surface-gray)',
                          color: urgent ? 'var(--amber-warning)' : 'var(--muted-text)',
                          fontSize: 11, fontWeight: 500,
                          border: '1px solid var(--border-gray)',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{days === 0 ? 'Now' : days}</div>
                          {days !== 0 && <div style={{ fontSize: 9, marginTop: 1, opacity: 0.8 }}>{days === 1 ? 'day' : 'days'}</div>}
                        </div>
                        <CompanyAvatar company={a.company} size={28} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</div>
                        </div>
                        <StagePill stage={a.status} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Nudge these */}
            {stuck.length > 0 && (
              <Section title="Nudge these" subtitle="Applied 2+ weeks ago, no movement">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {stuck.map(a => {
                    const ref = a.updated_at || a.created_at;
                    const days = ref ? daysBetween(today, ref.split('T')[0]) : 0;
                    return (
                      <button
                        key={a.id}
                        onClick={() => onOpenApp(a)}
                        style={{
                          padding: 14, borderRadius: 10,
                          border: '1px solid var(--border-gray)',
                          background: 'var(--card-bg)',
                          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                          color: 'var(--brand-navy)',
                          display: 'flex', alignItems: 'center', gap: 12,
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-bg)'}
                      >
                        <CompanyAvatar company={a.company} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted-text)' }}>Applied {days}d ago · no movement</div>
                        </div>
                        <span style={{
                          fontSize: 11, color: 'var(--accent-blue)',
                          background: 'var(--light-accent)',
                          padding: '3px 7px', borderRadius: 5, fontWeight: 500, flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <Mail size={10} /> Follow up
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Momentum card */}
            <div style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-gray)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--warn-bg, rgba(217,119,6,0.08))',
                    color: 'var(--amber-warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Flame size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)' }}>Momentum</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-text)' }}>Last 4 weeks</div>
                  </div>
                </div>
                {weeklyDelta !== 0 && (
                  <span style={{
                    fontSize: 11, padding: '3px 7px', borderRadius: 5, fontWeight: 500,
                    color: weeklyDelta > 0 ? 'var(--green-success)' : 'var(--danger)',
                    background: weeklyDelta > 0 ? 'var(--success-bg)' : 'var(--error-bg)',
                  }}>
                    {weeklyDelta > 0 ? '+' : ''}{weeklyDelta} vs last week
                  </span>
                )}
              </div>
              <ActivityStrip data={activity} />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 12, paddingTop: 12,
                borderTop: '1px solid var(--border-gray)',
              }}>
                <AnimatedStat value={streak} label="day streak" />
                <AnimatedStat value={weeklyCount} label="this week" />
                <AnimatedStat value={responseRate !== null ? `${responseRate}%` : '—'} label="response rate" />
              </div>
            </div>

            {/* Moving forward */}
            {recentWins.length > 0 && (
              <div style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-gray)', background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--success-bg)',
                    color: 'var(--green-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={14} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)' }}>Moving forward</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentWins.map(a => (
                    <button
                      key={a.id}
                      onClick={() => onOpenApp(a)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        fontFamily: 'inherit', color: 'var(--brand-navy)', textAlign: 'left',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
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

            {/* Weekly goal */}
            <div style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-gray)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-navy)' }}>Weekly goal</div>
                <div style={{ fontSize: 12, color: 'var(--muted-text)', fontFamily: 'var(--mono, ui-monospace)', fontVariantNumeric: 'tabular-nums' }}>
                  {weeklyCount} / {weeklyGoal}
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-gray)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${goalPct}%`,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-blue-hover))',
                  transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted-text)', lineHeight: 1.5 }}>
                {weeklyCount >= weeklyGoal
                  ? '🎉 Goal hit — great week.'
                  : `${weeklyGoal - weeklyCount} more to hit your goal this week.`}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .today-grid { grid-template-columns: 1fr !important; }
        }

        /* Next Up hero — light mode */
        .next-up-hero {
          background: var(--card-bg);
          border: 1px solid var(--border-gray);
        }
        .next-up-badge { color: var(--accent-blue); }
        .next-up-company { color: var(--brand-navy); }
        .next-up-role { color: var(--muted-text); }
        .next-up-deadline {
          color: var(--amber-warning);
          background: var(--warn-bg, rgba(217,119,6,0.08));
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

        /* Next Up hero — dark mode */
        .dark .next-up-hero {
          background: var(--card-bg);
          border: 1px solid var(--border-gray);
        }
        .dark .next-up-badge { color: #60A5FA; }
        .dark .next-up-company { color: #fff; }
        .dark .next-up-role { color: rgba(255,255,255,0.5); }
        .dark .next-up-deadline {
          color: #F59E0B;
          background: rgba(180,100,0,0.35);
        }
        .dark .next-up-note {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
        }
        .dark .next-up-note-label { color: rgba(255,255,255,0.4); }
        .dark .next-up-btn-primary { background: #fff; color: #111827; }
        .dark .next-up-btn-secondary {
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  );
}
