'use client';

import { Application } from '@/lib/types';
import { TrendingUp, Zap, MessageSquare, Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface StatsBarProps {
  applications: Application[];
}

export default function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const applied = applications.filter(a => a.status !== 'Wishlist');
  const pastApplied = applications.filter(a =>
    !['Wishlist', 'Applied', 'Rejected', 'Declined'].includes(a.status)
  );
  const responseRate = applied.length >= 5
    ? Math.round((pastApplied.length / applied.length) * 100)
    : null;

  const interviewStages = [
    'OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews',
    'Recruiter Screen', 'Technical / Case Interview', 'Final Round', 'Offer — Negotiating',
  ];
  const interviews = applications.filter(a => interviewStages.includes(a.status)).length;

  const now = new Date();
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const deadlinesSoon = applications.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline + 'T00:00:00');
    return d >= now && d <= sevenDaysAhead;
  }).length;

  const thisWeek = applications.filter(a => {
    if (!a.created_at) return false;
    return new Date(a.created_at) >= sevenDaysAgo;
  }).length;

  const stats = [
    {
      label: 'Total',
      value: total.toString(),
      subtext: total === 0 ? 'Add your first' : thisWeek > 0 ? `+${thisWeek} this week` : 'no new this week',
      icon: <TrendingUp size={14} />,
      accent: null,
    },
    {
      label: 'Response Rate',
      value: responseRate !== null ? `${responseRate}%` : '—',
      subtext: responseRate === null
        ? `Track ${Math.max(0, 5 - applied.length)} more to see`
        : responseRate >= 35
          ? 'Above average — keep going'
          : responseRate >= 20
            ? 'Industry avg: 20–30%'
            : 'Keep applying — it adds up',
      icon: <Zap size={14} />,
      accent: null,
    },
    {
      label: 'Interviews',
      value: interviews.toString(),
      subtext: interviews === 0 ? 'Keep applying' : interviews === 1 ? "You're in the room" : "You're on a roll",
      icon: <MessageSquare size={14} />,
      accent: 'green' as const,
    },
    {
      label: 'Act Now',
      value: deadlinesSoon.toString(),
      subtext: deadlinesSoon === 0 ? 'No urgent deadlines' : deadlinesSoon === 1 ? 'deadline this week' : 'deadlines this week',
      icon: <Clock size={14} />,
      accent: 'amber' as const,
    },
  ];

  const reduce = useReducedMotion();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="rounded-lg p-4 bg-card-bg border border-border-gray relative overflow-hidden"
          style={stat.accent === 'green'
            ? { borderLeft: '3px solid var(--green-success)' }
            : stat.accent === 'amber'
            ? { borderLeft: '3px solid var(--amber-warning)' }
            : { borderLeft: '3px solid var(--border-gray)' }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.28, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-text-tertiary">{stat.icon}</span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.05em]"
              style={{ color: 'var(--muted-text)' }}
            >
              {stat.label}
            </span>
          </div>
          <div
            className="text-[28px] font-semibold leading-none mb-1"
            style={{
              color: stat.accent === 'green'
                ? 'var(--green-success)'
                : stat.accent === 'amber'
                ? 'var(--amber-warning)'
                : 'var(--brand-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            {stat.value}
          </div>
          {stat.subtext && (
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{stat.subtext}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
