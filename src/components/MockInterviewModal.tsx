'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Download, Copy, Check, X, ChevronRight, RotateCcw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  q: string;
  type: 'behavioral' | 'technical';
  why: string;
}

interface StarRating {
  rating: 'strong' | 'okay' | 'missing';
  note: string;
}

interface Feedback {
  score: number;
  star: { situation: StarRating; task: StarRating; action: StarRating; result: StarRating };
  strengths: string[];
  improvements: string[];
  overall: string;
}

interface TranscriptEntry {
  question: Question;
  answer: string;
  feedback: Feedback;
}

type Phase =
  | 'setup'
  | 'loading_questions'
  | 'question'
  | 'evaluating'
  | 'feedback'
  | 'complete';

type InputMode = 'text' | 'voice';
type QuestionType = 'behavioral' | 'technical' | 'mixed';

interface Props {
  company: string;
  role: string;
  notes?: string;
  userId: string;
  applicationId?: string;
  isPro: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAR_LABELS = { situation: 'Situation', task: 'Task', action: 'Action', result: 'Result' };

const STAR_COLORS: Record<StarRating['rating'], { bg: string; text: string; icon: string }> = {
  strong:  { bg: 'rgba(22,163,74,0.1)',   text: '#16A34A', icon: '✓' },
  okay:    { bg: 'rgba(202,138,4,0.1)',   text: '#D97706', icon: '~' },
  missing: { bg: 'rgba(220,38,38,0.08)', text: '#DC2626', icon: '✗' },
};

const SCORE_COLOR = (s: number) =>
  s >= 4 ? '#16A34A' : s === 3 ? '#D97706' : '#DC2626';

const SCORE_LABEL = (s: number) =>
  s === 5 ? 'Exceptional' : s === 4 ? 'Strong' : s === 3 ? 'Adequate' : s === 2 ? 'Weak' : 'Poor';

function avg(entries: TranscriptEntry[]) {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((a, e) => a + e.feedback.score, 0) / entries.length * 10) / 10;
}

// ── Download transcript as printable HTML ─────────────────────────────────────

function downloadTranscript(company: string, role: string, transcript: TranscriptEntry[]) {
  const avgScore = avg(transcript);
  const rows = transcript
    .map((e, i) => `
      <div class="question-block">
        <div class="q-header">
          <span class="q-num">Q${i + 1}</span>
          <span class="q-type">${e.question.type}</span>
          <span class="q-score" style="color:${SCORE_COLOR(e.feedback.score)}">${e.feedback.score}/5 — ${SCORE_LABEL(e.feedback.score)}</span>
        </div>
        <p class="q-text">${e.question.q}</p>
        <div class="answer-box"><strong>Your answer:</strong><br>${e.answer.replace(/\n/g, '<br>')}</div>
        <div class="star-grid">
          ${(['situation','task','action','result'] as const).map(k => `
            <div class="star-item star-${e.feedback.star[k].rating}">
              <strong>${k.charAt(0).toUpperCase() + k.slice(1)}</strong>
              <span>${e.feedback.star[k].note}</span>
            </div>
          `).join('')}
        </div>
        ${e.feedback.strengths.length ? `<div class="section"><strong>Strengths:</strong><ul>${e.feedback.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        ${e.feedback.improvements.length ? `<div class="section"><strong>To improve:</strong><ul>${e.feedback.improvements.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        <div class="overall">${e.feedback.overall}</div>
      </div>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mock Interview — ${company} · ${role}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px 60px; color: #0A0A14; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #64748B; margin-bottom: 32px; }
  .overall-score { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border: 1px solid #E8ECF2; border-radius: 12px; margin-bottom: 32px; }
  .score-num { font-size: 28px; font-weight: 700; color: ${SCORE_COLOR(avgScore)}; }
  .score-label { font-size: 13px; color: #64748B; }
  .question-block { margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #E8ECF2; }
  .q-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .q-num { font-size: 11px; font-weight: 700; background: #F1F5F9; border-radius: 4px; padding: 2px 7px; }
  .q-type { font-size: 11px; color: #64748B; text-transform: capitalize; }
  .q-score { font-size: 13px; font-weight: 600; margin-left: auto; }
  .q-text { font-size: 16px; font-weight: 600; margin: 0 0 14px; }
  .answer-box { background: #F8FAFC; border-left: 3px solid #CBD5E1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 14px; font-size: 14px; }
  .star-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .star-item { padding: 10px 12px; border-radius: 8px; font-size: 13px; }
  .star-item strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
  .star-strong { background: rgba(22,163,74,0.1); color: #16A34A; }
  .star-okay { background: rgba(202,138,4,0.1); color: #D97706; }
  .star-missing { background: rgba(220,38,38,0.08); color: #DC2626; }
  .section { margin-bottom: 10px; font-size: 13px; }
  .section ul { margin: 4px 0; padding-left: 20px; }
  .section li { margin-bottom: 2px; }
  .overall { font-size: 14px; color: #334155; font-style: italic; padding: 12px 16px; background: #F8FAFC; border-radius: 8px; }
  @media print { body { margin: 20px auto; } }
</style>
</head>
<body>
<h1>Mock Interview — ${company}</h1>
<div class="meta">${role} · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
<div class="overall-score">
  <span class="score-num">${avgScore}/5</span>
  <span class="score-label">Overall · ${transcript.length} question${transcript.length !== 1 ? 's' : ''}</span>
</div>
${rows}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mock-interview-${company.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Voice recognition hook ────────────────────────────────────────────────────

function useVoice(onTranscript: (text: string) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalText = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' ';
        else interim = t;
      }
      onTranscript(finalText + interim);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [onTranscript]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch { /* already started */ }
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    recRef.current.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarCard({ label, data }: { label: string; data: StarRating }) {
  const c = STAR_COLORS[data.rating];
  return (
    <div style={{ background: c.bg, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{c.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: c.text, margin: 0, lineHeight: 1.5 }}>{data.note}</p>
    </div>
  );
}

function ScoreDots({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i <= score ? SCORE_COLOR(score) : 'var(--border-gray)',
          }}
        />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function MockInterviewModal({ company, role, notes, userId, applicationId, isPro, onClose, onUpgrade }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onVoiceTranscript = useCallback((text: string) => setAnswer(text), []);
  const voice = useVoice(onVoiceTranscript);

  useEffect(() => {
    if (phase === 'question') textareaRef.current?.focus();
  }, [phase, currentIdx]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!isPro) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎤</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--brand-navy)' }}>Mock Interview</h2>
          <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 24, lineHeight: 1.7 }}>
            AI-powered mock interviews with real-time STAR feedback are a Pro feature.
          </p>
          <button
            onClick={onUpgrade}
            style={{ height: 44, padding: '0 28px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Upgrade to Pro
          </button>
        </div>
      </Overlay>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────────

  async function startInterview() {
    setError('');
    setPhase('loading_questions');
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', userId, company, role, notes, count: questionCount, type: questionType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
      setQuestions(data.questions);
      setCurrentIdx(0);
      setTranscript([]);
      setAnswer('');
      setPhase('question');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('setup');
    }
  }

  // ── Submit answer ────────────────────────────────────────────────────────────

  async function submitAnswer() {
    if (!answer.trim()) return;
    if (voice.listening) voice.stop();
    setPhase('evaluating');
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate', userId, company, role,
          question: questions[currentIdx].q,
          questionType: questions[currentIdx].type,
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate answer');
      setFeedback(data.feedback);
      setPhase('feedback');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Evaluation failed');
      setPhase('question');
    }
  }

  // ── Next question / finish ────────────────────────────────────────────────────

  async function advance() {
    if (!feedback) return;
    const entry: TranscriptEntry = { question: questions[currentIdx], answer: answer.trim(), feedback };
    const newTranscript = [...transcript, entry];
    setTranscript(newTranscript);

    if (currentIdx + 1 >= questions.length) {
      // Save session silently
      fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_session', userId, company, role, applicationId,
          questions, transcript: newTranscript,
        }),
      }).catch(() => {});
      setPhase('complete');
    } else {
      setCurrentIdx(i => i + 1);
      setAnswer('');
      setFeedback(null);
      setPhase('question');
    }
  }

  // ── Copy plain text ───────────────────────────────────────────────────────────

  function copyTranscript() {
    const text = transcript.map((e, i) =>
      `Q${i+1} [${e.question.type}] — Score: ${e.feedback.score}/5\n` +
      `${e.question.q}\n\n` +
      `Your answer:\n${e.answer}\n\n` +
      `Feedback:\n${e.feedback.overall}\n\n` +
      `To improve:\n${e.feedback.improvements.map(x => `• ${x}`).join('\n')}\n`
    ).join('\n' + '─'.repeat(40) + '\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length) : 0;

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-gray)' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>Mock Interview</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '2px 0 0' }}>{company} · {role}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {phase !== 'setup' && phase !== 'loading_questions' && phase !== 'complete' && (
            <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>
              {currentIdx + 1} / {questions.length}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {questions.length > 0 && phase !== 'complete' && (
        <div style={{ height: 3, background: 'var(--border-gray)' }}>
          <div style={{ height: '100%', background: 'var(--accent-blue)', width: `${progress * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* ── Setup ── */}
        {phase === 'setup' && (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 28, lineHeight: 1.7 }}>
              The AI will ask questions tailored to <strong style={{ color: 'var(--brand-navy)' }}>{company}</strong>, score each answer with STAR feedback, and save a transcript you can download.
            </p>

            <SettingBlock label="Number of questions">
              <div style={{ display: 'flex', gap: 8 }}>
                {[3, 5, 7].map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)} style={chipStyle(n === questionCount)}>
                    {n}
                  </button>
                ))}
              </div>
            </SettingBlock>

            <SettingBlock label="Question focus">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['mixed', 'behavioral', 'technical'] as QuestionType[]).map(t => (
                  <button key={t} onClick={() => setQuestionType(t)} style={chipStyle(t === questionType)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </SettingBlock>

            <SettingBlock label="Input mode">
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setInputMode('text')} style={chipStyle(inputMode === 'text')}>
                  ⌨️ Type
                </button>
                {voice.supported && (
                  <button onClick={() => setInputMode('voice')} style={chipStyle(inputMode === 'voice')}>
                    🎤 Voice
                  </button>
                )}
              </div>
              {!voice.supported && (
                <p style={{ fontSize: 11, color: 'var(--muted-text)', marginTop: 6 }}>Voice not supported in this browser — use text mode.</p>
              )}
            </SettingBlock>

            {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{error}</p>}

            <button onClick={startInterview} style={primaryBtn}>
              Start Interview <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── Loading questions ── */}
        {phase === 'loading_questions' && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={spinner} />
            <p style={{ fontSize: 14, color: 'var(--muted-text)', marginTop: 20 }}>Preparing your questions…</p>
          </div>
        )}

        {/* ── Question ── */}
        {phase === 'question' && currentQ && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '3px 9px', borderRadius: 9999,
                background: currentQ.type === 'behavioral' ? 'rgba(37,99,235,0.1)' : 'rgba(124,58,237,0.1)',
                color: currentQ.type === 'behavioral' ? 'var(--accent-blue)' : '#7C3AED',
              }}>
                {currentQ.type}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>{currentQ.why}</span>
            </div>

            <div style={{
              fontSize: 17, fontWeight: 600, color: 'var(--brand-navy)', lineHeight: 1.5,
              marginBottom: 24, padding: '18px 20px',
              background: 'var(--surface-gray)', borderRadius: 12,
              border: '1px solid var(--border-gray)',
            }}>
              {currentQ.q}
            </div>

            {/* Input mode toggle */}
            {voice.supported && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['text', 'voice'] as InputMode[]).map(m => (
                  <button key={m} onClick={() => { if (voice.listening) voice.stop(); setInputMode(m); }}
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-gray)', cursor: 'pointer', fontWeight: inputMode === m ? 600 : 400, background: inputMode === m ? 'var(--surface-gray)' : 'transparent', color: inputMode === m ? 'var(--brand-navy)' : 'var(--muted-text)' }}>
                    {m === 'text' ? '⌨️ Type' : '🎤 Voice'}
                  </button>
                ))}
              </div>
            )}

            {inputMode === 'text' ? (
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here… Use the STAR format: Situation → Task → Action → Result"
                rows={7}
                style={{
                  width: '100%', borderRadius: 10, border: '1px solid var(--border-gray)',
                  background: 'var(--background)', color: 'var(--brand-navy)', fontSize: 14,
                  padding: '12px 14px', lineHeight: 1.7, resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer(); }}
              />
            ) : (
              <div style={{ border: '1px solid var(--border-gray)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', minHeight: 120, background: 'var(--background)', color: 'var(--brand-navy)', fontSize: 14, lineHeight: 1.7 }}>
                  {answer || <span style={{ color: 'var(--muted-text)' }}>Press the mic and speak your answer…</span>}
                </div>
                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-gray)', background: 'var(--surface-gray)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => voice.listening ? voice.stop() : (setAnswer(''), voice.start())}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: voice.listening ? '#DC2626' : 'var(--accent-blue)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: voice.listening ? 'pulse 1.5s infinite' : 'none',
                    }}
                  >
                    {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>
                    {voice.listening ? 'Listening… click to stop' : 'Click mic to start speaking'}
                  </span>
                  {answer && (
                    <button onClick={() => setAnswer('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RotateCcw size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>
                {inputMode === 'text' ? '⌘↵ to submit' : ''}
              </span>
              <button
                onClick={submitAnswer}
                disabled={!answer.trim()}
                style={{ ...primaryBtn, opacity: answer.trim() ? 1 : 0.4, cursor: answer.trim() ? 'pointer' : 'not-allowed' }}
              >
                Submit Answer <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Evaluating ── */}
        {phase === 'evaluating' && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={spinner} />
            <p style={{ fontSize: 14, color: 'var(--muted-text)', marginTop: 20 }}>Analyzing your answer…</p>
          </div>
        )}

        {/* ── Feedback ── */}
        {phase === 'feedback' && feedback && currentQ && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Score banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: 'var(--surface-gray)', borderRadius: 12, marginBottom: 20,
              border: '1px solid var(--border-gray)',
            }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: SCORE_COLOR(feedback.score), lineHeight: 1 }}>
                  {feedback.score}<span style={{ fontSize: 18, fontWeight: 400, color: 'var(--muted-text)' }}>/5</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: SCORE_COLOR(feedback.score), marginTop: 2 }}>
                  {SCORE_LABEL(feedback.score)}
                </div>
              </div>
              <ScoreDots score={feedback.score} />
            </div>

            {/* Question reminder */}
            <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 16, fontStyle: 'italic' }}>
              "{currentQ.q}"
            </p>

            {/* STAR breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {(['situation', 'task', 'action', 'result'] as const).map(k => (
                <StarCard key={k} label={STAR_LABELS[k]} data={feedback.star[k]} />
              ))}
            </div>

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strengths</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {feedback.strengths.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 9999, background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {feedback.improvements.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To improve</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {feedback.improvements.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--brand-navy)', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overall */}
            <div style={{ padding: '14px 16px', background: 'var(--surface-gray)', borderRadius: 10, marginBottom: 24, fontSize: 14, color: 'var(--muted-text)', lineHeight: 1.7, fontStyle: 'italic' }}>
              {feedback.overall}
            </div>

            {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

            <button onClick={advance} style={primaryBtn}>
              {currentIdx + 1 >= questions.length ? 'View Results' : 'Next Question'} <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── Complete ── */}
        {phase === 'complete' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                {avg(transcript) >= 4 ? '🎉' : avg(transcript) >= 3 ? '👍' : '💪'}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', margin: '0 0 4px' }}>Session complete</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: SCORE_COLOR(avg(transcript)) }}>{avg(transcript)}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted-text)' }}>out of 5</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: SCORE_COLOR(avg(transcript)) }}>{SCORE_LABEL(Math.round(avg(transcript)))}</div>
                </div>
              </div>
            </div>

            {/* Per-question summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {transcript.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--surface-gray)', borderRadius: 10, border: '1px solid var(--border-gray)' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_COLOR(e.feedback.score) }}>{e.feedback.score}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted-text)' }}>/5</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Q{i+1}: {e.question.q}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: 0 }}>{e.feedback.improvements[0]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => downloadTranscript(company, role, transcript)} style={{ ...primaryBtn, flex: 1 }}>
                <Download size={14} /> Download Transcript
              </button>
              <button
                onClick={copyTranscript}
                style={{ height: 42, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', color: 'var(--brand-navy)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <button
              onClick={() => { setPhase('setup'); setTranscript([]); setCurrentIdx(0); setAnswer(''); setFeedback(null); }}
              style={{ width: '100%', height: 36, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <RotateCcw size={13} /> Start another session
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 620, maxHeight: 'calc(100vh - 32px)',
        background: 'var(--background)', borderRadius: 16, border: '1px solid var(--border-gray)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function SettingBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  );
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  height: 36, padding: '0 16px', borderRadius: 8, border: active ? '2px solid var(--accent-blue)' : '1px solid var(--border-gray)',
  background: active ? 'rgba(37,99,235,0.08)' : 'var(--surface-gray)', color: active ? 'var(--accent-blue)' : 'var(--muted-text)',
  fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
});

const primaryBtn: React.CSSProperties = {
  height: 42, padding: '0 20px', background: 'var(--accent-blue)', color: '#fff', border: 'none',
  borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 6,
};

const spinner: React.CSSProperties = {
  width: 32, height: 32, border: '3px solid var(--border-gray)', borderTopColor: 'var(--accent-blue)',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto',
};
