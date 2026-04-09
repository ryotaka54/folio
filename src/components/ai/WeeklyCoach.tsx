'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import ProGate from '@/components/ProGate';

interface CoachData {
  headline: string;
  assessment: string;
  priorities: string[];
  insight: string;
  encouragement: string;
}

interface WeeklyCoachProps {
  userId: string;
  isPro: boolean;
  onUpgrade: () => void;
}

function shouldShowCoach(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon ... 5=Fri
  const hour = now.getHours();
  // Show Monday 8am through Friday 11:59pm
  if (day === 0 || day === 6) return false; // weekend: no
  if (day === 1 && hour < 8) return false;  // Monday before 8am: no
  return true;
}

function getDismissKey(): string {
  const now = new Date();
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  return `weekly_coach_dismissed_${week}`;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 rounded-xl border border-border-gray">
      <div className="flex items-center gap-2">
        <div className="h-3 rounded w-6" style={{ background: 'var(--surface-gray)' }} />
        <div className="h-3 rounded w-40" style={{ background: 'var(--surface-gray)' }} />
      </div>
      <div className="h-3 rounded w-full" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-4/5" style={{ background: 'var(--surface-gray)' }} />
    </div>
  );
}

export default function WeeklyCoach({ userId, isPro, onUpgrade }: WeeklyCoachProps) {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(getDismissKey())) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!isPro || dismissed || !shouldShowCoach()) return;
    setLoading(true);
    fetch('/api/ai/weekly-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json.result);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isPro, dismissed, userId]);

  const handleDismiss = () => {
    localStorage.setItem(getDismissKey(), '1');
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!shouldShowCoach() && !loading && !data) return null;

  const content = (
    <>
      {loading && <Skeleton />}
      {error && null}
      {data && !loading && (
        <div
          className="rounded-xl border p-4 space-y-3 relative"
          style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(37,99,235,0.01) 100%)', borderColor: 'rgba(37,99,235,0.2)' }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-surface-gray transition-colors"
            style={{ color: 'var(--muted-text)' }}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-blue)' }}>Weekly Recruiting Coach</span>
          </div>

          <p className="text-[14px] font-semibold pr-6" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>{data.headline}</p>

          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--brand-navy)' }}>{data.assessment}</p>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted-text)' }}>This Week&apos;s Priorities</p>
            <ul className="space-y-1">
              {data.priorities.map((p, i) => (
                <li key={i} className="text-[12px] flex gap-2" style={{ color: 'var(--brand-navy)' }}>
                  <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {data.insight && (
            <p className="text-[11px] px-3 py-2 rounded-md" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
              <span className="font-semibold">Insight:</span> {data.insight}
            </p>
          )}

          <p className="text-[12px] italic" style={{ color: 'var(--muted-text)' }}>{data.encouragement}</p>
        </div>
      )}
    </>
  );

  if (!isPro) {
    return (
      <ProGate isPro={false} onUpgrade={onUpgrade} label="Weekly AI Recruiting Coach — Pro">
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--border-gray)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Weekly Recruiting Coach</span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--muted-text)' }}>Get personalized recruiting advice every Monday based on your pipeline.</p>
        </div>
      </ProGate>
    );
  }

  return content;
}
