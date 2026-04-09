'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import ProGate from '@/components/ProGate';

interface StrengthData {
  score: number;
  label: 'Strong' | 'Competitive' | 'Fair' | 'Challenging';
  summary: string;
  strengths: string[];
  gaps: string[];
  tip: string;
}

interface StrengthSignalProps {
  userId: string;
  applicationId?: string;
  company: string;
  role: string;
  category?: string;
  location?: string;
  isPro: boolean;
  cached?: StrengthData | null;
  onUpgrade: () => void;
}

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  Strong: { bg: '#D1FAE5', text: '#065F46' },
  Competitive: { bg: '#DBEAFE', text: '#1E40AF' },
  Fair: { bg: '#FEF3C7', text: '#92400E' },
  Challenging: { bg: '#FEE2E2', text: '#991B1B' },
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-gray)' }}>
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{
          width: `${score}%`,
          background: score >= 75 ? '#10B981' : score >= 50 ? '#3B82F6' : score >= 30 ? '#F59E0B' : '#EF4444',
        }}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2 p-3 rounded-lg border border-border-gray">
      <div className="flex items-center justify-between">
        <div className="h-3 rounded w-32" style={{ background: 'var(--surface-gray)' }} />
        <div className="h-5 rounded w-20" style={{ background: 'var(--surface-gray)' }} />
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-4/5" style={{ background: 'var(--surface-gray)' }} />
    </div>
  );
}

export default function StrengthSignal({
  userId, applicationId, company, role, category, location, isPro, cached, onUpgrade,
}: StrengthSignalProps) {
  const [data, setData] = useState<StrengthData | null>(cached ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!company.trim() || !role.trim() || triggered || data) return;
    setTriggered(true);
    setLoading(true);
    fetch('/api/ai/strength-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, applicationId, company, role, category, location }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json.result);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [company, role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!company.trim() || !role.trim()) return null;

  const labelColors = data ? LABEL_COLORS[data.label] ?? LABEL_COLORS.Fair : null;

  return (
    <ProGate isPro={isPro} onUpgrade={onUpgrade} label="AI Strength Signal — Pro">
      <div>
        {loading && <Skeleton />}
        {error && (
          <div className="px-3 py-2 rounded-lg border border-border-gray text-[12px] flex items-center gap-2" style={{ color: 'var(--muted-text)' }}>
            <Sparkles size={11} />
            AI signal unavailable
          </div>
        )}
        {data && (
          <div className="p-3 rounded-lg border border-border-gray space-y-2" style={{ background: 'var(--surface-gray)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-text)' }}>Application Strength</span>
              </div>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: labelColors!.bg, color: labelColors!.text }}
              >
                {data.label}
              </span>
            </div>
            <ScoreBar score={data.score} />
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--brand-navy)' }}>{data.summary}</p>
            {data.tip && (
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
                <span className="font-semibold">Tip:</span> {data.tip}
              </p>
            )}
          </div>
        )}
      </div>
    </ProGate>
  );
}
