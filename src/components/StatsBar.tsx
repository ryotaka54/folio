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
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deadlinesSoon = applications.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
    return d >= now && d <= sevenDays;
  }).length;

  const stats = [
    {
      label: 'In Progress',
      value: total.toString(),
      subtext: total === 0 ? 'Add your first' : total === 1 ? 'Great start' : `${applied.length} submitted`,
      icon: <TrendingUp size={16} className="text-accent-blue" />,
      highlight: false,
    },
    {
      label: 'Getting Noticed',
      value: responseRate !== null ? `${responseRate}%` : '—',
      subtext: responseRate === null ? `${5 - applied.length} more to unlock` : 'response rate',
      icon: <Zap size={16} className="text-amber-500" />,
      highlight: false,
    },
    {
      label: 'Interviews',
      value: interviews.toString(),
      subtext: interviews === 0 ? 'Keep applying' : interviews === 1 ? "You're in the room" : 'You\'re on a roll',
      icon: <MessageSquare size={16} className="text-emerald-500" />,
      highlight: interviews > 0,
    },
    {
      label: 'Act Now',
      value: deadlinesSoon.toString(),
      subtext: deadlinesSoon === 0 ? 'No urgent deadlines' : deadlinesSoon === 1 ? 'deadline this week' : 'deadlines this week',
      icon: <Clock size={16} className="text-red-500" />,
      highlight: deadlinesSoon > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl p-4 transition-colors ${
            stat.highlight
              ? stat.label === 'Interviews'
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-amber-50 border border-amber-200'
              : 'bg-surface-gray'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="flex-shrink-0">{stat.icon}</span>
            <span className="text-xs text-muted-text font-medium">{stat.label}</span>
          </div>
          <span className={`text-2xl font-semibold ${
            stat.highlight
              ? stat.label === 'Interviews' ? 'text-emerald-600' : 'text-amber-500'
              : 'text-brand-navy'
          }`}>
            {stat.value}
          </span>
          {stat.subtext && (
            <p className="text-[10px] text-muted-text/60 mt-0.5 leading-tight">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
