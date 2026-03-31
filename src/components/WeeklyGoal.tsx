'use client';

import { useState, useEffect } from 'react';
import { getWeeklyGoal, setWeeklyGoal, appsAddedThisWeek } from '@/lib/recruiting';
import type { Application } from '@/lib/types';

interface Props {
  applications: Application[];
  onToast?: (msg: string) => void;
}

export default function WeeklyGoal({ applications, onToast }: Props) {
  const [goal, setGoalState] = useState<number | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [custom, setCustom] = useState('');
  const [celebratedGoal, setCelebratedGoal] = useState<number | null>(null);

  const applied = appsAddedThisWeek(applications);
  const isMonday = new Date().getDay() === 1;

  useEffect(() => {
    const stored = getWeeklyGoal();
    if (stored) {
      setGoalState(stored.goal);
    } else if (isMonday) {
      setShowPrompt(true);
    }
  }, [isMonday]);

  // Celebrate hitting the goal
  useEffect(() => {
    if (goal && applied >= goal && celebratedGoal !== goal) {
      setCelebratedGoal(goal);
      onToast?.(`Goal reached! You applied to ${applied} companies this week. 🎉`);
    }
  }, [applied, goal, celebratedGoal, onToast]);

  const pick = (n: number) => {
    setWeeklyGoal(n);
    setGoalState(n);
    setShowPrompt(false);
  };

  // Monday prompt
  if (showPrompt) {
    return (
      <div
        className="mb-4 p-4 rounded-lg border border-border-gray fade-in"
        style={{ background: 'var(--card-bg)' }}
      >
        <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--brand-navy)' }}>
          New week — how many applications do you want to submit this week?
        </p>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15].map(n => (
            <button
              key={n}
              onClick={() => pick(n)}
              className="h-8 px-3 text-[12px] font-medium border rounded-md transition-colors"
              style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', background: 'transparent' }}
            >
              {n} apps
            </button>
          ))}
          <form
            onSubmit={e => { e.preventDefault(); const n = parseInt(custom); if (n > 0) pick(n); }}
            className="flex gap-1"
          >
            <input
              type="number"
              min={1}
              max={50}
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Custom"
              className="h-8 w-20 px-2 text-[12px] border border-border-gray rounded-md bg-background focus:outline-none focus:border-accent-blue"
            />
            <button
              type="submit"
              className="h-8 px-3 text-[12px] font-medium text-white rounded-md bg-accent-blue hover:bg-accent-blue-hover transition-colors"
            >Set</button>
          </form>
          <button
            onClick={() => setShowPrompt(false)}
            className="h-8 px-2 text-[11px] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >Skip</button>
        </div>
      </div>
    );
  }

  if (!goal) return null;

  const pct = Math.min((applied / goal) * 100, 100);
  const done = applied >= goal;

  return (
    <div className="mb-4 fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px]" style={{ color: 'var(--muted-text)' }}>
          {done
            ? `🎉 Weekly goal hit — ${applied} of ${goal} applications`
            : `${applied} of ${goal} applications this week`}
        </span>
        <button
          onClick={() => { setGoalState(null); setShowPrompt(true); }}
          className="text-[11px] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          edit goal
        </button>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-gray)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: done ? '#16A34A' : 'var(--accent-blue)' }}
        />
      </div>
    </div>
  );
}
