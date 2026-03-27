'use client';

import { Application } from '@/lib/types';
import { TrendingUp, Zap, MessageSquare, Clock } from 'lucide-react';

interface StatsBarProps {
  applications: Application[];
}

export default function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const applied = applications.filter(a => a.status !== 'Wishlist');
  const pastApplied = applications.filter(a =>
    a.status !== 'Wishlist' && a.status !== 'Applied' && a.status !== 'Rejected' && a.status !== 'Declined'
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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const deadlinesSoon = applications.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
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
      subtext: thisWeek > 0 ? `+${thisWeek} this week` : 'none this week',
      icon: <TrendingUp size={16} className="text-muted-text" />,
      valueColor: 'text-brand-navy',
    },
    {
      label: 'Response Rate',
      value: responseRate !== null ? `${responseRate}%` : '—',
      subtext: responseRate === null ? `${5 - applied.length} more to unlock` : 'of applications replied',
      icon: <Zap size={16} className="text-muted-text" />,
      valueColor: 'text-brand-navy',
    },
    {
      label: 'Interviews',
      value: interviews.toString(),
      subtext: interviews === 0 ? 'Keep applying' : interviews === 1 ? "You're in the room" : "You're on a roll",
      icon: <MessageSquare size={16} className="text-muted-text" />,
      valueColor: interviews > 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-brand-navy',
    },
    {
      label: 'Act Now',
      value: deadlinesSoon.toString(),
      subtext: deadlinesSoon === 0 ? 'No urgent deadlines' : deadlinesSoon === 1 ? 'deadline this week' : 'deadlines this week',
      icon: <Clock size={16} className="text-muted-text" />,
      valueColor: deadlinesSoon > 0 ? 'text-[#D97706] dark:text-amber-400' : 'text-brand-navy',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-4 bg-surface-gray border border-border-gray"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="flex-shrink-0">{stat.icon}</span>
            <span className="text-xs text-muted-text font-medium">{stat.label}</span>
          </div>
          <span className={`text-2xl font-bold ${stat.valueColor}`}>
            {stat.value}
          </span>
          {stat.subtext && (
            <p className="text-[10px] text-muted-text/70 mt-0.5 leading-tight">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
