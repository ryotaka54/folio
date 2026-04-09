'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ProGate from '@/components/ProGate';

interface InterviewPrepData {
  overview: string;
  behavioral: string[];
  technical: string[];
  tips: string[];
  resources: string[];
}

interface InterviewPrepPanelProps {
  userId: string;
  applicationId: string;
  company: string;
  role: string;
  stage: string;
  notes?: string;
  isPro: boolean;
  cached?: InterviewPrepData | null;
  onUpgrade: () => void;
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 rounded" style={{ background: 'var(--surface-gray)', width: '80%' }} />
      <div className="h-3 rounded" style={{ background: 'var(--surface-gray)', width: '60%' }} />
      <div className="h-3 rounded" style={{ background: 'var(--surface-gray)', width: '70%' }} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
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

export default function InterviewPrepPanel({
  userId, applicationId, company, role, stage, notes, isPro, cached, onUpgrade,
}: InterviewPrepPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<InterviewPrepData | null>(cached ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (data) { setExpanded(v => !v); return; }
    if (!expanded) setExpanded(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, applicationId, company, role, stage, notes }),
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
          <Sparkles size={13} style={{ color: 'var(--accent-blue)' }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>AI Interview Prep</span>
          {data && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-blue)', color: '#fff' }}>Ready</span>}
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
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--brand-navy)' }}>{data.overview}</p>
              <Section title="Behavioral Questions" items={data.behavioral} />
              <Section title="Technical Questions" items={data.technical} />
              <Section title="Tips" items={data.tips} />
              <Section title="Resources" items={data.resources} />
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ProGate isPro={isPro} onUpgrade={onUpgrade} label="AI Interview Prep — Pro">
      {content}
    </ProGate>
  );
}
