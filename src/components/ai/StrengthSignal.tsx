'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import ProGate from '@/components/ProGate';
import { authFetch } from '@/lib/auth-fetch';
import { AILoadingState } from '@/components/ui/ai-loading-state';

interface StrengthData {
  score: number;
  label: 'Strong' | 'Competitive' | 'Fair' | 'Challenging';
  summary: string;
  strengths: string[];
  gaps: string[];
  tip: string;
}

interface StrengthSignalProps {
  applicationId?: string;
  company: string;
  role: string;
  category?: string;
  location?: string;
  isPro: boolean;
  cached?: StrengthData | null;
  onUpgrade: () => void;
}

const LABEL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Strong: { bg: 'var(--success-bg)', text: 'var(--success-text)', bar: 'var(--pill-green-dot)' },
  Competitive: { bg: 'var(--pill-indigo-bg)', text: 'var(--pill-indigo-fg)', bar: 'var(--pill-indigo-dot)' },
  Fair: { bg: 'var(--warn-bg)', text: 'var(--warn)', bar: 'var(--pill-amber-dot)' },
  Challenging: { bg: 'var(--error-bg)', text: 'var(--error-text)', bar: 'var(--pill-red-dot)' },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-gray)' }}>
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function StrengthSignal({
  applicationId, company, role, category, location, isPro, cached, onUpgrade,
}: StrengthSignalProps) {
  const [data, setData] = useState<StrengthData | null>(cached ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [triggered, setTriggered] = useState(false);

  const fetchSignal = () => {
    setLoading(true);
    setError('');
    authFetch('/api/ai/strength-signal', {
      method: 'POST',
      body: JSON.stringify({ applicationId, company, role, category, location }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json.result);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!company.trim() || !role.trim() || triggered || data) return;
    // Kicks off the API fetch below — triggered/loading are part of that
    // same synchronization with the external request, not a derived value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTriggered(true);
    fetchSignal();
  }, [company, role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!company.trim() || !role.trim()) return null;

  const labelColors = data ? LABEL_COLORS[data.label] ?? LABEL_COLORS.Fair : null;

  return (
    <ProGate isPro={isPro} onUpgrade={onUpgrade} label="AI Strength Signal — Pro">
      <div>
        {loading && <AILoadingState label="Reading your application…" lines={2} />}
        {error && (
          <div className="px-3 py-2 rounded-lg border border-border-gray text-[12px] flex items-center gap-2" style={{ color: 'var(--muted-text)' }}>
            <Sparkles size={11} />
            AI signal unavailable
          </div>
        )}
        {data && !loading && (
          <div className="p-3 rounded-lg border border-border-gray space-y-2" style={{ background: 'var(--surface-gray)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-text)' }}>Application Strength</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: labelColors!.bg, color: labelColors!.text }}
                >
                  {data.label}
                </span>
                <button
                  onClick={fetchSignal}
                  aria-label="Regenerate"
                  className="p-1 rounded-md transition-colors hover:bg-surface-gray"
                  style={{ color: 'var(--muted-text)' }}
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>
            <ScoreBar score={data.score} color={labelColors!.bar} />
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
