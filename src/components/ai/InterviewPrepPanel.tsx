'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ProGate from '@/components/ProGate';

// ── v2 data shape — compact, scannable ──────────────────────────────────────
interface PrepQuestion {
  q: string;
  type: 'behavioral' | 'technical';
  why: string;
}

interface InterviewPrepData {
  tldr: string;
  company_context: string;
  questions: PrepQuestion[];
  action_items: string[];
  confidence: 'high' | 'medium' | 'low';
  // legacy fields (v1 cache compat)
  overview?: string;
  behavioral?: string[];
  technical?: string[];
  tips?: string[];
  resources?: string[];
}

interface InterviewPrepPanelProps {
  userId: string;
  applicationId: string;
  company: string;
  role: string;
  stage: string;
  notes?: string;
  jobLink?: string;
  isPro: boolean;
  cached?: InterviewPrepData | null;
  onUpgrade: () => void;
  isShuukatsu?: boolean;
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

// ── Confidence badge ─────────────────────────────────────────────────────────
const CONFIDENCE_COLORS = {
  high: { bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)', text: 'var(--green-success)', label: 'High confidence', labelJa: '精度：高' },
  medium: { bg: 'rgba(202,138,4,0.1)', border: 'rgba(202,138,4,0.25)', text: 'var(--amber-warning)', label: 'Medium confidence', labelJa: '精度：中' },
  low: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', text: '#DC2626', label: 'Limited company data', labelJa: '情報限定' },
};

function ConfidenceBadge({ level, isShuukatsu }: { level: 'high' | 'medium' | 'low'; isShuukatsu?: boolean }) {
  const c = CONFIDENCE_COLORS[level];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {isShuukatsu ? c.labelJa : c.label}
    </span>
  );
}

// ── Question type pill ───────────────────────────────────────────────────────
function TypePill({ type, isShuukatsu }: { type: string; isShuukatsu?: boolean }) {
  const isTech = type === 'technical';
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: isTech ? 'rgba(37,99,235,0.1)' : 'rgba(139,92,246,0.1)',
        color: isTech ? 'var(--accent-blue)' : '#8B5CF6',
        border: `1px solid ${isTech ? 'rgba(37,99,235,0.2)' : 'rgba(139,92,246,0.2)'}`,
      }}
    >
      {isShuukatsu ? (isTech ? '技術' : '行動') : (isTech ? 'Tech' : 'Behav')}
    </span>
  );
}

// ── Legacy v1 render — for old cached results ────────────────────────────────
function LegacyContent({ data }: { data: InterviewPrepData }) {
  return (
    <div className="space-y-2.5">
      {data.overview && (
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--brand-navy)' }}>{data.overview}</p>
      )}
      {data.behavioral && data.behavioral.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Behavioral</p>
          <ul className="space-y-0.5">
            {data.behavioral.map((item, i) => (
              <li key={i} className="text-[12px] leading-relaxed flex gap-2" style={{ color: 'var(--brand-navy)' }}>
                <span style={{ color: 'var(--accent-blue)' }}>·</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.technical && data.technical.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Technical</p>
          <ul className="space-y-0.5">
            {data.technical.map((item, i) => (
              <li key={i} className="text-[12px] leading-relaxed flex gap-2" style={{ color: 'var(--brand-navy)' }}>
                <span style={{ color: 'var(--accent-blue)' }}>·</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.tips && data.tips.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>Tips</p>
          <ul className="space-y-0.5">
            {data.tips.map((item, i) => (
              <li key={i} className="text-[12px] leading-relaxed flex gap-2" style={{ color: 'var(--brand-navy)' }}>
                <span style={{ color: 'var(--accent-blue)' }}>·</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── v2 compact render ────────────────────────────────────────────────────────
function CompactContent({ data, isShuukatsu }: { data: InterviewPrepData; isShuukatsu?: boolean }) {
  const [showWhy, setShowWhy] = useState<number | null>(null);
  const ja = isShuukatsu;

  return (
    <div className="space-y-3" style={{ fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }}>
      {/* TL;DR — the one thing to focus on */}
      <div
        className="rounded-lg px-3 py-2.5"
        style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)' }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
            🎯 {ja ? 'ポイント' : 'Focus'}
          </span>
          {data.confidence && <ConfidenceBadge level={data.confidence} isShuukatsu={ja} />}
        </div>
        <p className="text-[12px] font-medium leading-snug" style={{ color: 'var(--brand-navy)' }}>
          {data.tldr}
        </p>
      </div>

      {/* Company context — especially useful for niche companies */}
      {data.company_context && (
        <p className="text-[11px] leading-relaxed px-0.5" style={{ color: 'var(--muted-text)' }}>
          {data.company_context}
        </p>
      )}

      {/* Top 3 questions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-text)' }}>
          {ja ? '対策すべき質問' : 'Top questions to prep'}
        </p>
        <div className="space-y-2">
          {data.questions.map((q, i) => (
            <div key={i} className="group">
              <button
                onClick={() => setShowWhy(showWhy === i ? null : i)}
                className="w-full text-left flex items-start gap-2"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <p className="text-[12px] font-medium leading-snug flex-1" style={{ color: 'var(--brand-navy)' }}>
                      {q.q}
                    </p>
                    <TypePill type={q.type} isShuukatsu={ja} />
                  </div>
                  {showWhy === i && q.why && (
                    <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-tertiary)' }}>
                      💡 {q.why}
                    </p>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action items */}
      {data.action_items && data.action_items.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-text)' }}>
            {ja ? '面接前にやること' : 'Before your interview'}
          </p>
          <ul className="space-y-1">
            {data.action_items.map((item, i) => (
              <li key={i} className="text-[12px] leading-snug flex gap-2" style={{ color: 'var(--brand-navy)' }}>
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--green-success)' }}>☐</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Low confidence notice */}
      {data.confidence === 'low' && (
        <div
          className="rounded-lg px-3 py-2 text-[11px] leading-snug"
          style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.12)', color: 'var(--muted-text)' }}
        >
          {ja
            ? '⚠️ この企業に関する公開情報が少ないため、職種と業界の一般情報をもとに作成しています。求人URLを追加すると精度が上がります。'
            : '⚠️ Limited public info on this company — prep is based on the role description and industry norms. Adding a '}
          {!ja && <strong>job posting link</strong>}
          {!ja && ' significantly improves accuracy.'}
        </div>
      )}
    </div>
  );
}

// ── Detect if data is v1 (legacy) or v2 (compact) ───────────────────────────
function isV2Data(data: InterviewPrepData): boolean {
  return 'tldr' in data && 'questions' in data && Array.isArray(data.questions);
}

export default function InterviewPrepPanel({
  userId, applicationId, company, role, stage, notes, jobLink, isPro, cached, onUpgrade, isShuukatsu = false,
}: InterviewPrepPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<InterviewPrepData | null>(cached ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ja = isShuukatsu;

  const generate = async () => {
    if (data) { setExpanded(v => !v); return; }
    if (!expanded) setExpanded(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, applicationId, company, role, stage, notes, job_link: jobLink }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setData(json.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ja ? 'エラーが発生しました' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="rounded-lg border border-border-gray overflow-hidden">
      <button
        onClick={generate}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-surface-gray/50"
        style={{ background: 'var(--surface-gray)', fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }}
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: 'var(--accent-blue)' }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{ja ? 'AI面接対策' : 'AI Interview Prep'}</span>
          {data && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-blue)', color: '#fff' }}>{ja ? '生成済み' : 'Ready'}</span>}
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
        <div className="px-3 py-3 border-t border-border-gray" style={{ background: 'var(--card-bg)' }}>
          {loading && <Skeleton />}
          {error && <p className="text-[12px] text-error-text">{error}</p>}
          {data && (isV2Data(data) ? <CompactContent data={data} isShuukatsu={ja} /> : <LegacyContent data={data} />)}
        </div>
      )}
    </div>
  );

  return (
    <ProGate isPro={isPro} onUpgrade={onUpgrade} label={ja ? 'AI面接対策 — Pro' : 'AI Interview Prep — Pro'}>
      {content}
    </ProGate>
  );
}
