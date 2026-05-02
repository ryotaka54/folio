'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

interface LeaderboardEntry {
  id: string;
  company: string;
  role: string;
  question: string;
  question_type: string;
  score: number;
  answer_text: string | null;
  display_name: string | null;
  lang: string;
  created_at: string;
}

interface StarRating { rating: 'strong' | 'okay' | 'missing'; note: string; }
interface PreviewFeedback {
  score: number;
  star: { situation: StarRating; task: StarRating; action: StarRating; result: StarRating };
  strengths: string[];
  improvements: string[];
  overall: string;
}

function scoreColor(s: number) {
  if (s >= 5) return '#10B981';
  if (s >= 4) return '#3B82F6';
  if (s >= 3) return '#F59E0B';
  return '#EF4444';
}

function scoreLabel(s: number) {
  if (s >= 5) return 'Excellent';
  if (s >= 4) return 'Strong';
  if (s >= 3) return 'Adequate';
  if (s >= 2) return 'Weak';
  return 'Poor';
}

interface QuestionGroup {
  question: string;
  question_type: string;
  company: string;
  company_slug: string;
  entries: LeaderboardEntry[];
}

function groupByQuestion(entries: LeaderboardEntry[], companySlug: string): QuestionGroup[] {
  const map = new Map<string, QuestionGroup>();
  for (const e of entries) {
    if (!map.has(e.question)) {
      map.set(e.question, { question: e.question, question_type: e.question_type, company: e.company, company_slug: companySlug, entries: [] });
    }
    const g = map.get(e.question)!;
    if (g.entries.length < 10) g.entries.push(e);
  }
  return Array.from(map.values());
}

export default function CompanyLeaderboardPage({ params }: { params: Promise<{ company: string }> }) {
  const { user } = useAuth();
  const [companySlug, setCompanySlug] = useState('');
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    params.then(p => {
      setCompanySlug(p.company);
      fetch(`/api/leaderboard/${p.company}`)
        .then(r => r.json())
        .then(d => {
          const entries: LeaderboardEntry[] = d.entries ?? [];
          setCompanyName(entries[0]?.company ?? p.company);
          setGroups(groupByQuestion(entries, p.company));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ height: 56, borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Logo /></Link>
          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>/</span>
          <Link href="/leaderboard" style={{ fontSize: 13, color: 'var(--muted-text)', textDecoration: 'none' }}>Leaderboard</Link>
          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{companyName || companySlug}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          {user ? (
            <Link href="/interview" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Practice →</Link>
          ) : (
            <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563EB', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>Sign up free</Link>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {companyName || companySlug}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted-text)', margin: 0 }}>
            Top interview answers, scored by AI. Try a question to see how you compare.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)', fontSize: 14 }}>Loading…</div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--muted-text)', fontSize: 15 }}>No answers yet for this company.</p>
            <Link href={user ? '/interview' : '/signup'} style={{ display: 'inline-block', marginTop: 14, fontSize: 14, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
              {user ? 'Be the first — practice now →' : 'Sign up and be the first →'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {groups.map((group, gi) => (
              <QuestionBlock key={gi} group={group} user={user} companySlug={companySlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionBlock({ group, user, companySlug }: { group: QuestionGroup; user: unknown; companySlug: string }) {
  const [tryOpen, setTryOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewFeedback | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questionHash = group.question.slice(0, 32).replace(/[^a-z0-9]/gi, '-').toLowerCase();

  async function submitPreview() {
    if (!answer.trim()) return;
    setLoading(true);
    setPreviewError('');
    try {
      const res = await fetch('/api/leaderboard/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: group.company,
          company_slug: companySlug,
          role: group.entries[0]?.role ?? '',
          question: group.question,
          question_type: group.question_type,
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPreviewError(data.error ?? 'Evaluation failed'); return; }
      setPreview(data.feedback);
    } catch {
      setPreviewError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const topScore = group.entries[0]?.score ?? 0;

  return (
    <div id={questionHash} style={{ borderRadius: 14, border: '1px solid var(--border-gray)', overflow: 'hidden', background: 'var(--card-bg)' }}>
      {/* Question header */}
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', margin: 0, lineHeight: 1.55, flex: 1 }}>
            "{group.question}"
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(37,99,235,0.1)', color: '#2563EB', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.04em' }}>
            {group.question_type.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={() => { setTryOpen(t => !t); if (!tryOpen) setTimeout(() => textareaRef.current?.focus(), 100); }}
            style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--accent-blue)', background: 'rgba(37,99,235,0.08)', color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {tryOpen ? 'Close' : 'Try this question'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/leaderboard/${companySlug}#${questionHash}`); }}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-gray)', background: 'transparent', color: 'var(--muted-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🔗 Share
          </button>
        </div>
      </div>

      {/* Inline try-it panel */}
      {tryOpen && (
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-gray)', background: preview ? 'var(--card-bg)' : 'var(--surface-gray)' }}>
          {!preview ? (
            <>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here… use the STAR framework (Situation → Task → Action → Result)"
                rows={5}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-gray)', background: 'var(--card-bg)', fontSize: 14, color: 'var(--body-text)', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
              {previewError && <p style={{ fontSize: 13, color: '#EF4444', margin: '8px 0 0' }}>{previewError}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>
                  Top score on this question: <strong style={{ color: scoreColor(topScore) }}>{topScore}/5</strong>
                </span>
                <button
                  onClick={submitPreview}
                  disabled={loading || !answer.trim()}
                  style={{ height: 36, padding: '0 20px', borderRadius: 9, border: 'none', background: loading || !answer.trim() ? 'var(--border-gray)' : '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading || !answer.trim() ? 'default' : 'pointer', fontFamily: 'inherit' }}
                >
                  {loading ? 'Evaluating…' : 'See my score'}
                </button>
              </div>
            </>
          ) : (
            <div>
              {/* Score comparison */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(preview.score), fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{preview.score}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 2 }}>Your score</div>
                </div>
                <div style={{ color: 'var(--muted-text)', fontSize: 20 }}>vs</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(topScore), fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{topScore}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 2 }}>Top on board</div>
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(preview.score), padding: '4px 10px', borderRadius: 6, background: `${scoreColor(preview.score)}18` }}>{scoreLabel(preview.score)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 14px', padding: '12px 14px', background: 'var(--surface-gray)', borderRadius: 8 }}>
                {preview.overall}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(user ? (
                  <Link href="/interview" style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    Practice with full feedback →
                  </Link>
                ) : (
                  <Link href="/signup" style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    Sign up to post your score →
                  </Link>
                ))}
                <button onClick={() => { setPreview(null); setAnswer(''); }} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-gray)', background: 'transparent', color: 'var(--muted-text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries */}
      <div>
        {group.entries.map((entry, i) => (
          <div
            key={entry.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 22px', borderTop: i > 0 ? '1px solid var(--border-gray)' : undefined }}
          >
            <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#F59E0B' : 'var(--muted-text)', fontFamily: "'DM Mono', monospace" }}>
                #{i + 1}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(entry.score), fontFamily: "'DM Mono', monospace" }}>{entry.score}/5</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(entry.score), padding: '2px 7px', borderRadius: 5, background: `${scoreColor(entry.score)}18` }}>{scoreLabel(entry.score)}</span>
                <span style={{ fontSize: 12, color: 'var(--muted-text)', marginLeft: 'auto' }}>
                  {entry.display_name ?? 'Anonymous'}
                </span>
              </div>
              {entry.answer_text ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0, lineHeight: 1.65, overflow: 'hidden', maxHeight: expandedAnswers.has(entry.id) ? 'none' : '3.6em' }}>
                    {entry.answer_text}
                  </p>
                  {entry.answer_text.length > 200 && (
                    <button
                      onClick={() => setExpandedAnswers(s => { const n = new Set(s); if (n.has(entry.id)) n.delete(entry.id); else n.add(entry.id); return n; })}
                      style={{ fontSize: 12, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}
                    >
                      {expandedAnswers.has(entry.id) ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>Answer hidden</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
