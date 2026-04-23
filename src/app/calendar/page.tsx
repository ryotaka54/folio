'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Lightbulb,
  X, ExternalLink, CheckCircle, LayoutDashboard, Mic, Home,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { INTERNSHIP_STAGES, JOB_STAGES } from '@/lib/constants';
import { Application, PipelineStage } from '@/lib/types';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import { isPro } from '@/lib/pro';

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'overdue' | 'interview' | 'oa' | 'offer' | 'deadline';

interface CalEvent {
  id: string;
  type: EventType;
  company: string;
  role: string;
  date: string; // YYYY-MM-DD
  application: Application;
}

// ── Constants ────────────────────────────────────────────────────────────────

const INTERVIEW_STAGES = new Set([
  'Phone / Recruiter Screen', 'Final Round Interviews',
  'Recruiter Screen', 'Technical / Case Interview', 'Final Round',
]);
const OA_STAGES = new Set(['OA / Online Assessment']);
const OFFER_STAGES = new Set(['Offer', 'Offer — Negotiating']);
const DONE_STAGES = new Set(['Offer', 'Offer — Negotiating', 'Accepted', 'Declined', 'Rejected']);

const EVENT_STYLE: Record<EventType, { bg: string; color: string }> = {
  overdue:   { bg: 'rgba(220,38,38,0.13)',  color: '#DC2626' },
  interview: { bg: 'rgba(37,99,235,0.13)',  color: '#2563EB' },
  oa:        { bg: 'rgba(124,58,237,0.13)', color: '#7C3AED' },
  offer:     { bg: 'rgba(22,163,74,0.13)',  color: '#16A34A' },
  deadline:  { bg: 'rgba(217,119,6,0.13)',  color: '#D97706' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayYMD(): string { return toYMD(new Date()); }

function classifyEvent(app: Application): EventType | null {
  if (!app.deadline) return null;
  const today = todayYMD();
  const isOverdue = app.deadline < today && !DONE_STAGES.has(app.status);
  if (isOverdue) return 'overdue';
  if (INTERVIEW_STAGES.has(app.status)) return 'interview';
  if (OA_STAGES.has(app.status)) return 'oa';
  if (OFFER_STAGES.has(app.status)) return 'offer';
  return 'deadline';
}

function buildEvents(apps: Application[]): CalEvent[] {
  const events: CalEvent[] = [];
  for (const app of apps) {
    if (!app.deadline) continue;
    const type = classifyEvent(app);
    if (!type) continue;
    events.push({ id: app.id, type, company: app.company, role: app.role, date: app.deadline, application: app });
  }
  return events;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const days: Date[] = [];
  for (let i = first.getDay() - 1; i >= 0; i--)
    days.push(new Date(year, month, -i));
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++)
    days.push(new Date(year, month, d));
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++)
    days.push(new Date(year, month + 1, d));
  return days;
}

// ── ICS generation ───────────────────────────────────────────────────────────

function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = '';
  while (line.length > 75) { out += line.slice(0, 75) + '\r\n '; line = line.slice(75); }
  return out + line;
}

function generateICS(events: CalEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Applyd//Applyd Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Applyd Recruiting',
  ];
  for (const ev of events) {
    const d = ev.date.replace(/-/g, '');
    const nd = toYMD(new Date(new Date(ev.date + 'T00:00:00').getTime() + 86400000)).replace(/-/g, '');
    const label = ev.type === 'interview' ? 'Interview' : ev.type === 'oa' ? 'Online Assessment' : ev.type === 'offer' ? 'Offer Deadline' : ev.type === 'overdue' ? 'Overdue' : 'Application Deadline';
    lines.push(
      'BEGIN:VEVENT',
      fold(`UID:${ev.id}-${ev.type}@useapplyd.com`),
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${nd}`,
      fold(`SUMMARY:Applyd — ${ev.company} — ${label}`),
      fold(`DESCRIPTION:Manage this application in Applyd: https://useapplyd.com`),
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY',
      fold(`DESCRIPTION:Tomorrow: ${ev.company} ${label}`),
      'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY',
      fold(`DESCRIPTION:In 1 hour: ${ev.company} ${label}`),
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadICS(events: CalEvent[]) {
  const blob = new Blob([generateICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Applyd-Calendar.ics'; a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EventPill({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  const s = EVENT_STYLE[ev.type];
  const label = ev.type === 'overdue' ? `Overdue · ${ev.company}` : ev.company;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="w-full text-left truncate rounded"
      style={{
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 500,
        height: 22, lineHeight: '22px',
        padding: '0 6px', borderRadius: 4,
        display: 'block',
      }}
      title={`${ev.company} — ${ev.role}`}
    >
      {label}
    </button>
  );
}

function DayCell({
  date, events, isCurrentMonth, isToday,
  onEventClick, onMoreClick,
}: {
  date: Date;
  events: CalEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onEventClick: (app: Application) => void;
  onMoreClick: (date: string, events: CalEvent[]) => void;
}) {
  const isPast = toYMD(date) < todayYMD() && !isToday;
  const maxPills = 3;
  const visible = events.slice(0, events.length > maxPills ? 2 : maxPills);
  const overflow = events.length > maxPills ? events.length - 2 : 0;

  return (
    <div
      className="relative border-r border-b flex flex-col"
      style={{
        borderColor: 'var(--border-gray)',
        minHeight: 120,
        background: isPast && isCurrentMonth
          ? 'var(--surface-gray)'
          : 'var(--background)',
        opacity: isCurrentMonth ? 1 : 0.45,
      }}
    >
      {/* Date number */}
      <div className="pt-1.5 px-2 pb-1 flex-shrink-0">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium"
          style={isToday ? {
            background: 'rgba(37,99,235,0.15)',
            color: 'var(--accent-blue)',
            outline: '1.5px solid var(--accent-blue)',
            fontWeight: 600,
          } : {
            color: isPast ? 'var(--text-tertiary)' : 'var(--brand-navy)',
          }}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Event pills */}
      <div className="px-1 flex-1 space-y-0.5 overflow-hidden">
        {visible.map(ev => (
          <EventPill key={ev.id + ev.type} ev={ev} onClick={() => onEventClick(ev.application)} />
        ))}
        {overflow > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onMoreClick(toYMD(date), events); }}
            className="text-[10px] font-medium pl-1 transition-colors"
            style={{ color: 'var(--muted-text)' }}
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

// ── Day detail popover ───────────────────────────────────────────────────────

function DayPopover({
  date, events, onClose, onEventClick,
}: {
  date: string; events: CalEvent[]; onClose: () => void; onEventClick: (app: Application) => void;
}) {
  const d = new Date(date + 'T00:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="rounded-2xl border p-5 w-full max-w-sm"
        style={{ background: 'var(--background)', borderColor: 'var(--border-gray)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{label}</span>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}><X size={15} /></button>
        </div>
        <div className="space-y-1.5">
          {events.map(ev => {
            const s = EVENT_STYLE[ev.type];
            const typeLabel = ev.type === 'interview' ? 'Interview' : ev.type === 'oa' ? 'OA' : ev.type === 'offer' ? 'Offer' : ev.type === 'overdue' ? 'Overdue' : 'Deadline';
            return (
              <button
                key={ev.id}
                onClick={() => { onEventClick(ev.application); onClose(); }}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)' }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-navy)' }}>{ev.company}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--muted-text)' }}>{ev.role}</div>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}>{typeLabel}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Google Calendar modal ────────────────────────────────────────────────────

function GoogleCalendarModal({
  onClose, isConnected, connectedEmail, userId, onConnect, onDisconnect,
}: {
  onClose: () => void;
  isConnected: boolean;
  connectedEmail: string | null;
  userId: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleConnect = () => {
    // TODO: Replace with your Google OAuth client ID from Google Cloud Console.
    // Required scopes: https://www.googleapis.com/auth/calendar.events
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      alert('Google Calendar integration requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set. See supabase/functions/google-oauth-callback/index.ts for setup instructions.');
      return;
    }
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback`,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: userId,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="rounded-2xl border p-6 w-full max-w-md"
        style={{ background: 'var(--background)', borderColor: 'var(--border-gray)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-gray)' }}>
              <Calendar size={16} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <span className="text-[16px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              Connect Google Calendar
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}><X size={16} /></button>
        </div>

        {isConnected ? (
          <div>
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
              style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#16A34A' }}>Connected</p>
                {connectedEmail && (
                  <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>{connectedEmail}</p>
                )}
              </div>
            </div>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--muted-text)' }}>
              Your Applyd deadlines and interviews are automatically syncing to Google Calendar. New applications are added instantly.
            </p>
            <button
              onClick={onDisconnect}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium border transition-colors"
              style={{ borderColor: 'var(--error-border)', color: 'var(--error-text)', background: 'var(--error-bg)' }}
            >
              Disconnect Google Calendar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--muted-text)' }}>
              Sync your Applyd deadlines and interviews to Google Calendar. They&apos;ll appear as events so you never miss anything — even when you&apos;re not in Applyd.
            </p>
            <ul className="space-y-2 mb-5">
              {[
                'Deadlines appear as all-day events',
                '24-hour and 1-hour reminders added automatically',
                'Updates when you change a deadline',
                'Removed when you delete an application',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--muted-text)' }}>
                  <CheckCircle size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={handleConnect}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              <Calendar size={15} />
              Connect Google Calendar
            </button>
            <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-tertiary)' }}>
              Only calendar.events scope is requested. We never read your existing events.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Upcoming sidebar ─────────────────────────────────────────────────────────

function UpcomingSidebar({ events, onEventClick }: { events: CalEvent[]; onEventClick: (app: Application) => void }) {
  const today = todayYMD();
  const in30 = toYMD(new Date(Date.now() + 30 * 86400000));

  const overdue = events.filter(e => e.date < today && e.type !== 'overdue' ? false : e.type === 'overdue');
  const upcoming = events
    .filter(e => e.date >= today && e.date <= in30)
    .sort((a, b) => a.date.localeCompare(b.date));

  const groups: { label: string; evs: CalEvent[] }[] = [];
  if (overdue.length > 0) groups.push({ label: 'Overdue', evs: overdue });

  const byDate: Record<string, CalEvent[]> = {};
  for (const ev of upcoming) {
    (byDate[ev.date] = byDate[ev.date] || []).push(ev);
  }
  for (const [date, evs] of Object.entries(byDate)) {
    const d = new Date(date + 'T00:00:00');
    const diff = Math.round((d.getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    groups.push({ label, evs });
  }

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 rounded-2xl border overflow-hidden"
      style={{ width: 280, background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-gray)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>
          Coming up
        </p>
      </div>
      <div className="overflow-y-auto flex-1 pb-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Nothing in the next 30 days</p>
          </div>
        ) : groups.map(group => (
          <div key={group.label}>
            <div
              className="px-4 py-1.5 sticky top-0 flex items-center gap-2"
              style={{
                background: group.label === 'Overdue' ? 'var(--error-bg)' : 'var(--card-bg)',
                borderLeft: group.label === 'Overdue' ? '3px solid var(--error-text)' : undefined,
              }}
            >
              <span
                className="text-[10px] font-semibold"
                style={{ color: group.label === 'Overdue' ? 'var(--error-text)' : 'var(--muted-text)' }}
              >
                {group.label}
              </span>
            </div>
            {group.evs.map(ev => {
              const s = EVENT_STYLE[ev.type];
              const typeLabel = ev.type === 'interview' ? 'Interview' : ev.type === 'oa' ? 'OA' : ev.type === 'offer' ? 'Offer' : ev.type === 'overdue' ? 'Overdue' : 'Deadline';
              return (
                <button
                  key={ev.id}
                  onClick={() => onEventClick(ev.application)}
                  className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors"
                  style={{ borderBottom: '1px solid var(--border-gray)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-gray)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-navy)' }}>{ev.company}</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--muted-text)' }}>{ev.role}</div>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {typeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Calendar grid ────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '4%' : '-4%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-4%' : '4%', opacity: 0 }),
};

function CalendarGrid({
  year, month, direction, eventsByDate, onEventClick, onMoreClick, isJa,
}: {
  year: number; month: number; direction: number;
  eventsByDate: Record<string, CalEvent[]>;
  onEventClick: (app: Application) => void;
  onMoreClick: (date: string, events: CalEvent[]) => void;
  isJa?: boolean;
}) {
  const gridDays = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = todayYMD();
  const dayHeaders = isJa ? JA_DAYS : DAYS_OF_WEEK;

  return (
    <div className="rounded-2xl border overflow-hidden flex-1" style={{ borderColor: 'var(--border-gray)' }}>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}>
        {dayHeaders.map(d => (
          <div key={d} className="text-center py-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: isJa ? '0.02em' : '0.07em', color: 'var(--text-tertiary)', textTransform: isJa ? undefined : 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Animated grid */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={`${year}-${month}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-7 border-l"
          style={{ borderColor: 'var(--border-gray)' }}
        >
          {gridDays.map((date, i) => {
            const ymd = toYMD(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = ymd === today;
            const events = eventsByDate[ymd] || [];
            return (
              <DayCell
                key={i}
                date={date}
                events={events}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                onEventClick={onEventClick}
                onMoreClick={onMoreClick}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Mobile week view ─────────────────────────────────────────────────────────

function MobileWeekView({
  weekStart, eventsByDate, onEventClick, onMoreClick,
}: {
  weekStart: Date;
  eventsByDate: Record<string, CalEvent[]>;
  onEventClick: (app: Application) => void;
  onMoreClick: (date: string, events: CalEvent[]) => void;
}) {
  const today = todayYMD();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekEvents: CalEvent[] = [];
  for (const d of days) {
    const ymd = toYMD(d);
    weekEvents.push(...(eventsByDate[ymd] || []));
  }
  weekEvents.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      {/* 7-day mini grid */}
      <div className="grid grid-cols-7 rounded-2xl border overflow-hidden mb-4" style={{ borderColor: 'var(--border-gray)' }}>
        {days.map((d, i) => {
          const ymd = toYMD(d);
          const isToday = ymd === today;
          const evs = eventsByDate[ymd] || [];
          return (
            <div
              key={i}
              className="flex flex-col items-center py-2 border-r last:border-r-0"
              style={{ borderColor: 'var(--border-gray)', background: 'var(--background)' }}
            >
              <span className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {DAYS_OF_WEEK[d.getDay()]}
              </span>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium"
                style={isToday ? {
                  background: 'rgba(37,99,235,0.15)',
                  color: 'var(--accent-blue)',
                  outline: '1.5px solid var(--accent-blue)',
                  fontWeight: 700,
                } : { color: 'var(--brand-navy)' }}
              >
                {d.getDate()}
              </span>
              {evs.length > 0 && (
                <div className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: EVENT_STYLE[evs[0].type].color }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Event list for the week */}
      {weekEvents.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          No events this week
        </div>
      ) : (
        <div className="space-y-1.5">
          {weekEvents.map(ev => {
            const s = EVENT_STYLE[ev.type];
            const d = new Date(ev.date + 'T00:00:00');
            const diff = Math.round((d.getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
            const dateLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev.application)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-navy)' }}>{ev.company}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--muted-text)' }}>{ev.role}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-semibold" style={{ color: s.color }}>{dateLabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main content ─────────────────────────────────────────────────────────────

const JA_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const JA_DAYS = ['日','月','火','水','木','金','土'];

function CalendarContent() {
  const { user, signOut } = useAuth();
  const userIsPro = isPro(user);
  const [isJa, setIsJa] = useState(false);
  useEffect(() => {
    const cookiePref = document.cookie.match(/locale_preference=([^;]+)/)?.[1];
    setIsJa(
      cookiePref === 'ja' ||
      (cookiePref === undefined && user?.pipeline_type === 'shuukatsu')
    );
  }, [user]);
  const { applications, loading, updateApplication, deleteApplication } = useStore();
  const router = useRouter();

  // Month state
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [direction, setDirection] = useState(0);

  // Mobile week state
  const [weekStart, setWeekStart] = useState(() => {
    const n = new Date(); const d = new Date(n);
    d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
  });
  const [mobileView, setMobileView] = useState<'week' | 'list'>('week');

  // UI state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [popover, setPopover] = useState<{ date: string; events: CalEvent[] } | null>(null);
  const [showGCalModal, setShowGCalModal] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gCalEmail, setGCalEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const stages = user?.mode === 'job' ? JOB_STAGES : INTERNSHIP_STAGES;

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Check Google Calendar connection
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_integrations')
      .select('connected_at, provider_email')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setIsGCalConnected(true); setGCalEmail((data as { provider_email?: string }).provider_email ?? null); }
      });
  }, [user]);

  // Check for Google OAuth callback ?connected=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setIsGCalConnected(true);
      showToast('Google Calendar connected successfully');
      router.replace('/calendar');
    }
  }, [router, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft'  && !e.metaKey) { e.preventDefault(); prevMonth(); }
      if (e.key === 'ArrowRight' && !e.metaKey) { e.preventDefault(); nextMonth(); }
      if (e.key === 't' || e.key === 'T') goToday();
      if (e.key === 'g' || e.key === 'G') setShowGCalModal(true);
      if (e.key === 'Escape') {
        setShowDrawer(false); setPopover(null); setShowGCalModal(false);
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setDirection(1);
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToday = useCallback(() => {
    const n = new Date();
    const target = new Date(n.getFullYear(), n.getMonth(), 1);
    setDirection(target > currentDate ? 1 : -1);
    setCurrentDate(target);
  }, [currentDate]);

  // Computed events
  const events = useMemo(() => buildEvents(applications), [applications]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const ev of events) {
      (map[ev.date] = map[ev.date] || []).push(ev);
    }
    return map;
  }, [events]);

  const today = todayYMD();
  const in7 = toYMD(new Date(Date.now() + 7 * 86400000));
  const statCounts = useMemo(() => ({
    upcoming: events.filter(e => e.date >= today).length,
    thisWeek: events.filter(e => e.date >= today && e.date <= in7).length,
    interviews: events.filter(e => e.type === 'interview' && e.date >= today).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [events, today, in7]);

  const handleCardClick = useCallback((app: Application) => {
    setSelectedApp(app);
    setShowDrawer(true);
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Application>) => {
    updateApplication(id, updates).catch(() => {});
    setSelectedApp(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  }, [updateApplication]);

  const handleDelete = useCallback(async (id: string) => {
    setShowDrawer(false); setSelectedApp(null);
    await deleteApplication(id);
    showToast('Application removed');
  }, [deleteApplication, showToast]);

  const handleDisconnect = useCallback(async () => {
    if (!user) return;
    await supabase.from('user_integrations').delete().eq('user_id', user.id).eq('provider', 'google_calendar');
    setIsGCalConnected(false); setGCalEmail(null);
    showToast('Google Calendar disconnected');
  }, [user, showToast]);

  // Empty state
  const hasEvents = events.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]" style={isJa ? { fontFamily: "'Noto Sans JP', sans-serif" } : undefined}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-4">
            <Link href={isJa ? '/ja' : '/'} className="flex items-center gap-2 flex-shrink-0">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="text-[15px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            </Link>
            {/* View switcher pill — same as dashboard */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border-gray" style={{ background: 'var(--surface-gray)' }}>
              {[
                { label: isJa ? '今日' : 'Today',    href: isJa ? '/ja/dashboard' : '/dashboard',              icon: <Home size={12} aria-hidden /> },
                { label: isJa ? 'パイプライン' : 'Pipeline', href: isJa ? '/ja/dashboard?view=pipeline' : '/dashboard?view=pipeline', icon: <LayoutDashboard size={12} aria-hidden /> },
                { label: isJa ? 'リスト' : 'List',   href: isJa ? '/ja/dashboard?view=table' : '/dashboard?view=table',     icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
              ].map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-1.5 px-2.5 h-7 text-[12px] font-medium rounded-md transition-all"
                  style={{ background: 'transparent', color: 'var(--muted-text)' }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
            {/* Page links */}
            <div className="flex items-center gap-0.5 border-l border-border-gray pl-4">
              {[
                { href: '/calendar', label: isJa ? 'カレンダー' : 'Calendar', icon: <Calendar size={13} aria-hidden />, active: true },
                ...(!isJa ? [{ href: '/interview', label: 'Interview', icon: <Mic size={13} aria-hidden />, active: false }] : []),
              ].map(({ href, label, icon, active }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  style={{ color: active ? 'var(--accent-blue)' : 'var(--muted-text)', background: active ? 'rgba(37,99,235,0.08)' : 'transparent' }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => signOut()} className="text-[12px] transition-colors" style={{ color: 'var(--muted-text)' }}>
              {isJa ? 'ログアウト' : 'Log out'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col gap-5 w-full">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: title + stat pills */}
          <div className="flex-1 min-w-0" style={isJa ? { fontFamily: "'Noto Sans JP', sans-serif" } : undefined}>
            <h1 className="text-[22px] font-semibold leading-none mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.025em' }}>
              {isJa ? 'カレンダー' : 'Calendar'}
            </h1>
            <p className="text-[13px] mb-3" style={{ color: 'var(--muted-text)' }}>
              {isJa ? '就活の締め切りと面接をひとつの画面で。' : 'Your recruiting timeline at a glance.'}
            </p>
            {/* Stat pills */}
            <div className="flex flex-wrap gap-2">
              {(isJa ? [
                { label: '件予定', count: statCounts.upcoming, style: { background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)' } },
                { label: '件今週', count: statCounts.thisWeek, style: { background: 'rgba(217,119,6,0.10)', color: 'var(--amber-warning)' } },
                { label: '件面接', count: statCounts.interviews, style: { background: 'rgba(22,163,74,0.10)', color: 'var(--green-success)' } },
              ] : [
                { label: 'upcoming', count: statCounts.upcoming, style: { background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)' } },
                { label: 'this week', count: statCounts.thisWeek, style: { background: 'rgba(217,119,6,0.10)', color: 'var(--amber-warning)' } },
                { label: 'interviews', count: statCounts.interviews, style: { background: 'rgba(22,163,74,0.10)', color: 'var(--green-success)' } },
              ]).map(p => (
                <span key={p.label} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={p.style}>
                  {p.count} {p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: month nav + Google sync */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {/* Month navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)', background: 'var(--surface-gray)' }}
                aria-label="Previous month"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={goToday}
                className="px-3 h-8 rounded-lg border text-[12px] font-medium transition-colors"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--brand-navy)', background: 'var(--surface-gray)' }}
              >
                {isJa ? '今日' : 'Today'}
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)', background: 'var(--surface-gray)' }}
                aria-label="Next month"
              >
                <ChevronRight size={15} />
              </button>
              <span className="text-[17px] font-semibold ml-1 tabular-nums" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', minWidth: 148 }}>
                {isJa ? `${year}年${JA_MONTHS[month]}` : `${MONTHS[month]} ${year}`}
              </span>
            </div>

            {/* Google Calendar + ICS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadICS(events.filter(e => e.date >= today))}
                className="text-[11px] transition-colors"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                {isJa ? 'ICSエクスポート' : 'Export ICS'}
              </button>
              <button
                onClick={() => setShowGCalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all"
                style={{
                  borderColor: isGCalConnected ? 'rgba(22,163,74,0.4)' : 'var(--border-gray)',
                  color: isGCalConnected ? '#16A34A' : 'var(--brand-navy)',
                  background: isGCalConnected ? 'rgba(22,163,74,0.07)' : 'var(--surface-gray)',
                }}
              >
                <Calendar size={13} />
                <span className="hidden sm:inline">
                  {isJa
                    ? (isGCalConnected ? '✓ Google Calendar' : 'Googleカレンダーと同期')
                    : (isGCalConnected ? '✓ Google Calendar' : 'Sync with Google Calendar')}
                </span>
                <span className="sm:hidden"><ExternalLink size={12} /></span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile view toggle ───────────────────────────────────────── */}
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; }); }}
              className="w-7 h-7 rounded-lg border flex items-center justify-center"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => { const n = new Date(); const d = new Date(n); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); setWeekStart(d); }}
              className="px-2.5 h-7 rounded-lg border text-[11px] font-medium"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--brand-navy)', background: 'var(--surface-gray)' }}
            >
              {isJa ? '今週' : 'This week'}
            </button>
            <button
              onClick={() => { setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; }); }}
              className="w-7 h-7 rounded-lg border flex items-center justify-center"
              style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}>
            {(['week', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setMobileView(v)}
                className="px-3 py-1 rounded-md text-[11px] font-medium transition-all capitalize"
                style={mobileView === v
                  ? { background: 'var(--background)', color: 'var(--brand-navy)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: 'var(--muted-text)' }}
              >
                {isJa ? (v === 'week' ? '週' : 'リスト') : v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        {!hasEvents && !loading ? (
          // Empty state
          <div className="flex flex-col items-center justify-center flex-1 py-20" style={isJa ? { fontFamily: "'Noto Sans JP', sans-serif" } : undefined}>
            <Calendar size={48} style={{ color: 'var(--border-emphasis)', marginBottom: 16 }} />
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              {isJa ? 'まだイベントがありません' : 'No events yet'}
            </h2>
            <p className="text-[13px] mb-6 text-center max-w-xs" style={{ color: 'var(--muted-text)' }}>
              {isJa
                ? '選考に締め切りを設定すると、ここに自動で表示されます。'
                : 'Add deadlines to your applications and they\'ll appear here automatically.'}
            </p>
            <Link
              href={isJa ? '/ja/dashboard' : '/dashboard'}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              {isJa ? 'ダッシュボードへ' : 'Go to Dashboard'}
            </Link>
          </div>
        ) : (
          <div className="flex gap-5 flex-1 min-h-0">
            {/* Desktop grid */}
            <div className="hidden lg:flex flex-1 min-w-0">
              <CalendarGrid
                year={year} month={month} direction={direction}
                eventsByDate={eventsByDate}
                onEventClick={handleCardClick}
                onMoreClick={(date, evs) => setPopover({ date, events: evs })}
                isJa={isJa}
              />
            </div>

            {/* Mobile view */}
            <div className="flex-1 lg:hidden">
              {mobileView === 'week' ? (
                <>
                  <MobileWeekView
                    weekStart={weekStart}
                    eventsByDate={eventsByDate}
                    onEventClick={handleCardClick}
                    onMoreClick={(date, evs) => setPopover({ date, events: evs })}
                  />
                  {/* Upcoming — next events beyond the visible week */}
                  {(() => {
                    const weekEndDate = new Date(weekStart);
                    weekEndDate.setDate(weekEndDate.getDate() + 7);
                    const weekEnd = toYMD(weekEndDate);
                    const upcoming = events
                      .filter(e => e.date >= weekEnd)
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 6);
                    if (upcoming.length === 0) return null;
                    return (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] mb-2 px-1" style={{ color: 'var(--text-tertiary)' }}>Coming up</p>
                        <div className="space-y-1.5">
                          {upcoming.map(ev => {
                            const s = EVENT_STYLE[ev.type];
                            const d = new Date(ev.date + 'T00:00:00');
                            const diff = Math.round((d.getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
                            const dateLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow'
                              : diff < 7 ? d.toLocaleDateString('en-US', { weekday: 'short' })
                              : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return (
                              <button
                                key={ev.id}
                                onClick={() => handleCardClick(ev.application)}
                                className="w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors"
                                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-navy)' }}>{ev.company}</div>
                                  <div className="text-[11px] truncate" style={{ color: 'var(--muted-text)' }}>
                                    {{ overdue: 'Overdue', interview: 'Interview', oa: 'Online Assessment', offer: 'Offer', deadline: 'Deadline' }[ev.type]}
                                  </div>
                                </div>
                                <div className="text-[10px] font-semibold flex-shrink-0" style={{ color: s.color }}>{dateLabel}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-1.5">
                  {events
                    .filter(e => e.date >= today)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(ev => {
                      const s = EVENT_STYLE[ev.type];
                      const d = new Date(ev.date + 'T00:00:00');
                      return (
                        <button
                          key={ev.id}
                          onClick={() => handleCardClick(ev.application)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-xl border"
                          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-navy)' }}>{ev.company}</div>
                            <div className="text-[11px] truncate" style={{ color: 'var(--muted-text)' }}>{ev.role}</div>
                          </div>
                          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <UpcomingSidebar events={events} onEventClick={handleCardClick} />
          </div>
        )}

        {/* ── Keyboard shortcut bar ────────────────────────────────────── */}
        <p className="text-center text-[10px] pb-2" style={{ color: 'var(--text-tertiary)' }}>
          {isJa
            ? '← → 月切替 · T 今日 · G Googleカレンダー · Esc 閉じる'
            : '← → navigate months · T today · G sync Google Calendar · Esc close'}
        </p>
      </main>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <ApplicationDrawer
        application={selectedApp}
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedApp(null); }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        stages={stages as PipelineStage[]}
      />

      <AnimatePresence>
        {popover && (
          <DayPopover
            date={popover.date}
            events={popover.events}
            onClose={() => setPopover(null)}
            onEventClick={handleCardClick}
          />
        )}
        {showGCalModal && user && (
          <GoogleCalendarModal
            onClose={() => setShowGCalModal(false)}
            isConnected={isGCalConnected}
            connectedEmail={gCalEmail}
            userId={user.id}
            onConnect={() => setIsGCalConnected(true)}
            onDisconnect={handleDisconnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page wrapper (auth guard + StoreProvider) ────────────────────────────────

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <StoreProvider userId={user.id}>
      <CalendarContent />
    </StoreProvider>
  );
}
