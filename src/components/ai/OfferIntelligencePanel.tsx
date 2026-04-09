'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, DollarSign } from 'lucide-react';
import ProGate from '@/components/ProGate';

interface OfferData {
  salaryRange: string;
  negotiationScript: string;
  tactics: string[];
  redFlags: string[];
  questions: string[];
  verdict: string;
}

interface OfferIntelligencePanelProps {
  userId: string;
  applicationId: string;
  company: string;
  role: string;
  category?: string;
  location?: string;
  isPro: boolean;
  cached?: OfferData | null;
  onUpgrade: () => void;
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 rounded w-1/2" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-full" style={{ background: 'var(--surface-gray)' }} />
      <div className="h-3 rounded w-4/5" style={{ background: 'var(--surface-gray)' }} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted-text)' }}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[12px] leading-relaxed flex gap-2" style={{ color: 'var(--brand-navy)' }}>
            <span style={{ color: 'var(--accent-blue)' }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OfferIntelligencePanel({
  userId, applicationId, company, role, category, location, isPro, cached, onUpgrade,
}: OfferIntelligencePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<OfferData | null>(cached ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (data) { setExpanded(v => !v); return; }
    if (!expanded) setExpanded(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/offer-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, applicationId, company, role, category, location }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setData(json.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="rounded-lg border border-border-gray overflow-hidden">
      <button
        onClick={generate}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-surface-gray/50"
        style={{ background: 'var(--surface-gray)' }}
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <DollarSign size={13} style={{ color: '#10B981' }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>AI Offer Intelligence</span>
          {data && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#10B981', color: '#fff' }}>Ready</span>}
        </div>
        {loading ? (
          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted-text)' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : expanded ? (
          <ChevronUp size={13} style={{ color: 'var(--muted-text)' }} />
        ) : (
          <ChevronDown size={13} style={{ color: 'var(--muted-text)' }} />
        )}
      </button>

      {expanded && (
        <div className="px-3 py-3 space-y-3 border-t border-border-gray" style={{ background: 'var(--card-bg)' }}>
          {loading && <Skeleton />}
          {error && <p className="text-[12px] text-error-text">{error}</p>}
          {data && (
            <>
              <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: 'var(--surface-gray)' }}>
                <DollarSign size={12} style={{ color: '#10B981' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{data.salaryRange}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Opening Script</p>
                <p className="text-[12px] leading-relaxed italic px-3 py-2 rounded-md border-l-2" style={{ color: 'var(--brand-navy)', borderColor: 'var(--accent-blue)', background: 'var(--surface-gray)' }}>
                  &ldquo;{data.negotiationScript}&rdquo;
                </p>
              </div>
              <Section title="Tactics" items={data.tactics} />
              {data.redFlags.length > 0 && <Section title="Watch Out For" items={data.redFlags} />}
              <Section title="Questions to Ask" items={data.questions} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
                <span className="font-semibold">Verdict:</span> {data.verdict}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ProGate isPro={isPro} onUpgrade={onUpgrade} label="AI Offer Intelligence — Pro">
      {content}
    </ProGate>
  );
}
