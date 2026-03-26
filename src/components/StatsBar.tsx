'use client';

import { Application } from '@/lib/types';
import { ClipboardList, BarChart2, Target, Clock } from 'lucide-react';

interface StatsBarProps {
  applications: Application[];
}

export default function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const appliedOrBeyond = applications.filter(a =>
    a.status !== 'Wishlist' && a.status !== 'Rejected' && a.status !== 'Declined'
  );
  const pastApplied = applications.filter(a =>
    a.status !== 'Wishlist' && a.status !== 'Applied' && a.status !== 'Rejected' && a.status !== 'Declined'
  );
  const applied = applications.filter(a => a.status !== 'Wishlist');
  const responseRate = applied.length > 0
    ? Math.round((pastApplied.length / applied.length) * 100)
    : 0;

  const interviewStages = ['OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews',
    'Recruiter Screen', 'Technical / Case Interview', 'Final Round'];
  const interviews = applications.filter(a => interviewStages.includes(a.status)).length;

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deadlinesSoon = applications.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
    return d >= now && d <= sevenDays;
  }).length;

  const stats = [
    { label: 'Total Applications', value: total.toString(), icon: <ClipboardList size={16} className="text-accent-blue" />, highlight: false },
    { label: 'Response Rate', value: `${responseRate}%`, icon: <BarChart2 size={16} className="text-brand-navy" />, highlight: false },
    { label: 'Interviews', value: interviews.toString(), icon: <Target size={16} className="text-amber-warning" />, highlight: false },
    { label: 'Deadlines Soon', value: deadlinesSoon.toString(), icon: <Clock size={16} className="text-red-500" />, highlight: deadlinesSoon > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl p-4 transition-colors ${
            stat.highlight ? 'bg-amber-50 border border-amber-200' : 'bg-surface-gray'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="flex-shrink-0">{stat.icon}</span>
            <span className="text-xs text-muted-text font-medium">{stat.label}</span>
          </div>
          <span className={`text-2xl font-semibold ${stat.highlight ? 'text-amber-warning' : 'text-brand-navy'}`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
