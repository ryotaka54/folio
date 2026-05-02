'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Download, Copy, Check, RotateCcw, ChevronDown, ChevronUp, LayoutDashboard, Calendar, Mic, History as HistoryIcon, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { StoreProvider, useStore } from '@/lib/store';
import { isPro } from '@/lib/pro';
import { authFetch } from '@/lib/auth-fetch';
import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradeModal from '@/components/UpgradeModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'pick' | 'setup' | 'loading' | 'question' | 'evaluating' | 'feedback' | 'complete';
type QuestionType = 'behavioral' | 'technical' | 'mixed' | 'essentials';
type InputMode = 'text' | 'voice';
type View = 'session' | 'history';

interface Question { q: string; type: 'behavioral' | 'technical'; why: string; }
interface StarRating { rating: 'strong' | 'okay' | 'missing'; note: string; }
interface Feedback {
  score: number;
  star: { situation: StarRating; task: StarRating; action: StarRating; result: StarRating };
  strengths: string[];
  improvements: string[];
  overall: string;
  expressionAnalysis?: string;
  roast_mode?: boolean;
}
interface TranscriptEntry { question: Question; answer: string; feedback: Feedback; }
interface Session {
  id: string;
  company: string;
  role: string;
  questions: Question[];
  transcript: TranscriptEntry[];
  completed_at: string;
}

interface SavedSession {
  phase: 'question' | 'feedback';
  selectedApp: Application;
  questions: Question[];
  currentIdx: number;
  answer: string;
  transcript: TranscriptEntry[];
  feedback: Feedback | null;
  questionCount: number;
  questionType: QuestionType;
  savedAt: number;
}

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours
function sessionKey(userId: string) { return `applyd_interview_session_${userId}`; }
function saveSession(userId: string, s: SavedSession) {
  try { localStorage.setItem(sessionKey(userId), JSON.stringify(s)); } catch { /* quota */ }
}
function loadSession(userId: string): SavedSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(userId));
    if (!raw) return null;
    const s: SavedSession = JSON.parse(raw);
    if (Date.now() - s.savedAt > SESSION_TTL) { localStorage.removeItem(sessionKey(userId)); return null; }
    return s;
  } catch { return null; }
}
function clearSession(userId: string) {
  try { localStorage.removeItem(sessionKey(userId)); } catch { /* ignore */ }
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const SCORE_COLOR = (s: number) => s >= 4 ? '#10B981' : s >= 3 ? '#F59E0B' : '#EF4444';
const SCORE_LABEL = (s: number) =>
  s === 5 ? 'Exceptional' : s === 4 ? 'Strong' : s === 3 ? 'Adequate' : s === 2 ? 'Weak' : 'Poor';

const STAR_CFG = {
  strong:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10B981', icon: '✓' },
  okay:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#F59E0B', icon: '~' },
  missing: { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.20)',  text: '#EF4444', icon: '✗' },
};

function avg(t: TranscriptEntry[]) {
  if (!t.length) return 0;
  return Math.round(t.reduce((a, e) => a + e.feedback.score, 0) / t.length * 10) / 10;
}

// ── Voice hook ────────────────────────────────────────────────────────────────

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
    recRef.current.stop(); setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

// ── Camera hook (video-only, integrated into voice mode) ─────────────────────

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<string[]>([]);
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(!!(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(() => {
    return () => {
      if (captureRef.current) clearInterval(captureRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    framesRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); }
      captureRef.current = setInterval(() => {
        if (!canvasRef.current || !videoRef.current) return;
        const cv = canvasRef.current;
        cv.width = 320; cv.height = 240;
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const frame = cv.toDataURL('image/jpeg', 0.6).split(',')[1];
        framesRef.current.push(frame);
        if (framesRef.current.length > 4) framesRef.current.shift();
      }, 5000);
      setActive(true);
    } catch { /* camera not available or permission denied */ }
  }, []);

  const stop = useCallback(() => {
    if (captureRef.current) { clearInterval(captureRef.current); captureRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setActive(false);
  }, []);

  const getFrames = useCallback(() => [...framesRef.current], []);

  return { active, supported, start, stop, getFrames, videoRef, canvasRef };
}

// ── Download transcript ───────────────────────────────────────────────────────

function downloadTranscript(company: string, role: string, transcript: TranscriptEntry[]) {
  const avgScore = avg(transcript);
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Mock Interview — ${company}</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 24px 60px;color:#0A0A14;line-height:1.6}h1{font-size:22px;font-weight:700;margin-bottom:4px}.meta{font-size:13px;color:#64748B;margin-bottom:32px}.score-banner{display:inline-flex;align-items:center;gap:12px;padding:12px 20px;border:1px solid #E8ECF2;border-radius:12px;margin-bottom:32px}.score-num{font-size:32px;font-weight:800;color:${SCORE_COLOR(avgScore)}}.qblock{margin-bottom:40px;padding-bottom:40px;border-bottom:1px solid #E8ECF2}.q-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:11px}.q-text{font-size:16px;font-weight:600;margin:0 0 14px}.answer-box{background:#F8FAFC;border-left:3px solid #CBD5E1;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px;font-size:14px}.star-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.star-item{padding:10px 12px;border-radius:8px;font-size:13px}.star-strong{background:rgba(16,185,129,0.1);color:#10B981}.star-okay{background:rgba(245,158,11,0.1);color:#F59E0B}.star-missing{background:rgba(239,68,68,0.08);color:#EF4444}.overall{font-size:14px;color:#334155;font-style:italic;padding:12px 16px;background:#F8FAFC;border-radius:8px}</style>
</head><body>
<h1>Mock Interview — ${company}</h1>
<div class="meta">${role} · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
<div class="score-banner"><span class="score-num">${avgScore}/5</span><span style="font-size:13px;color:#64748B">Overall · ${transcript.length} question${transcript.length!==1?'s':''}</span></div>
${transcript.map((e,i)=>`<div class="qblock"><div class="q-header"><span style="background:#F1F5F9;border-radius:4px;padding:2px 7px;font-weight:700">Q${i+1}</span><span style="color:#64748B;text-transform:capitalize">${e.question.type}</span><span style="margin-left:auto;font-weight:600;color:${SCORE_COLOR(e.feedback.score)}">${e.feedback.score}/5 — ${SCORE_LABEL(e.feedback.score)}</span></div><p class="q-text">${e.question.q}</p><div class="answer-box"><strong>Your answer:</strong><br>${e.answer.replace(/\n/g,'<br>')}</div><div class="star-grid">${(['situation','task','action','result'] as const).map(k=>`<div class="star-item star-${e.feedback.star[k].rating}"><strong>${k.charAt(0).toUpperCase()+k.slice(1)}</strong><br>${e.feedback.star[k].note}</div>`).join('')}</div><div class="overall">${e.feedback.overall}</div></div>`).join('')}
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mock-interview-${company.toLowerCase().replace(/\s+/g,'-')}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CompanyAvatar({ company, color, size = 48 }: { company: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: `${color}22`, border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      fontSize: size * 0.42, fontWeight: 700, color,
      flexShrink: 0,
    }}>
      {company.charAt(0).toUpperCase()}
    </div>
  );
}

function ProgressRing({ current, total, score }: { current: number; total: number; score?: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? current / total : 0;
  const scoreColor = score !== undefined ? SCORE_COLOR(score) : '#2563EB';

  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" style={{ stroke: 'var(--border-gray)' }} strokeWidth="5" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke={scoreColor} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: 'var(--body-text)', lineHeight: 1 }}>
          {current}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted-text)', marginTop: 2 }}>/ {total}</span>
      </div>
    </div>
  );
}

function AnimatedScore({ target, color }: { target: number; color: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, v => v.toFixed(1));
  useEffect(() => {
    const controls = animate(mv, target, { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] });
    return controls.stop;
  }, [mv, target]);
  return (
    <motion.span style={{ fontFamily: "'DM Mono', monospace", fontSize: 80, fontWeight: 800, color, lineHeight: 1 }}>
      {display}
    </motion.span>
  );
}

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {[0.4, 0.7, 1, 0.7, 0.4].map((scale, i) => (
        <motion.div
          key={i}
          style={{ width: 4, borderRadius: 2, background: '#2563EB' }}
          animate={active ? {
            height: [8, 32 * scale, 8],
            opacity: [0.6, 1, 0.6],
          } : { height: 8, opacity: 0.3 }}
          transition={active ? {
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}

function StarCard({ k, label, data }: { k: string; label: string; data: StarRating }) {
  const cfg = STAR_CFG[data.rating];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 10, padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.text }}>{cfg.icon}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: cfg.text,
        }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: cfg.text, margin: 0, lineHeight: 1.5, opacity: 0.9 }}>{data.note}</p>
    </motion.div>
  );
}

function LoadingTypewriter({ company }: { company: string }) {
  const steps = [`Researching ${company}…`, 'Crafting questions…', 'Calibrating difficulty…', 'Almost ready…'];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => Math.min(i + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--muted-text)', marginTop: 20 }}
      >
        {steps[idx]}
      </motion.p>
    </AnimatePresence>
  );
}

// ── Main page content ─────────────────────────────────────────────────────────

function InterviewContent() {
  const { user, signOut } = useAuth();
  const userIsPro = isPro(user);
  const { applications, loading } = useStore();
  const router = useRouter();

  const [view, setView] = useState<View>('session');
  const [phase, setPhase] = useState<Phase>('pick');
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
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
  const [search, setSearch] = useState('');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [roastMode, setRoastMode] = useState(false);
  const [starCollapsed, setStarCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (view !== 'history' || !user || !userIsPro) return;
    setSessionsLoading(true);
    authFetch(`/api/ai/mock-interview`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [view, user, userIsPro]);

  const onVoiceTranscript = useCallback((text: string) => setAnswer(text), []);
  const voice = useVoice(onVoiceTranscript);
  const cam = useCamera();

  useEffect(() => {
    if (!user && !loading) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (phase === 'question') textareaRef.current?.focus();
  }, [phase, currentIdx]);

  // On mount: check for a saved in-progress session
  useEffect(() => {
    if (!user) return;
    const s = loadSession(user.id);
    if (s) setSavedSession(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Autosave mid-session state to localStorage
  useEffect(() => {
    if (!user) return;
    if (phase === 'question' || phase === 'feedback') {
      if (!selectedApp || questions.length === 0) return;
      saveSession(user.id, {
        phase, selectedApp, questions, currentIdx,
        answer, transcript, feedback, questionCount, questionType,
        savedAt: Date.now(),
      });
    } else if (phase === 'pick' || phase === 'complete') {
      clearSession(user.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx, answer, transcript, feedback]);

  const filteredApps = applications
    .filter(a => !['Rejected', 'Declined', 'Accepted'].includes(a.status))
    .filter(a => {
      const q = search.toLowerCase();
      return !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    });

  async function startInterview() {
    if (!selectedApp || !user) return;
    if (!selectedApp.company?.trim() || !selectedApp.role?.trim()) {
      setError('This application is missing a company name or role. Please update it first.');
      return;
    }
    setError('');
    setPhase('loading');
    try {
      const res = await authFetch('/api/ai/mock-interview', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate',
          company: selectedApp.company, role: selectedApp.role,
          notes: selectedApp.notes, count: questionCount, type: questionType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
      setQuestions(data.questions);
      setCurrentIdx(0); setTranscript([]); setAnswer(''); setFeedback(null);
      setPhase('question');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('setup');
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !selectedApp || !user) return;
    if (voice.listening) voice.stop();
    const frames = inputMode === 'voice' ? cam.getFrames() : [];
    if (cam.active) cam.stop();
    setPhase('evaluating');
    try {
      const res = await authFetch('/api/ai/mock-interview', {
        method: 'POST',
        body: JSON.stringify({
          action: 'evaluate',
          company: selectedApp.company, role: selectedApp.role,
          question: questions[currentIdx].q,
          questionType: questions[currentIdx].type,
          answer: answer.trim(),
          roast_mode: roastMode,
          ...(frames.length > 0 ? { frames } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate');
      setFeedback(data.feedback);
      setPhase('feedback');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Evaluation failed');
      setPhase('question');
    }
  }

  async function advance() {
    if (!feedback || !selectedApp || !user) return;
    const entry: TranscriptEntry = { question: questions[currentIdx], answer: answer.trim(), feedback };
    const newTranscript = [...transcript, entry];
    setTranscript(newTranscript);
    if (currentIdx + 1 >= questions.length) {
      authFetch('/api/ai/mock-interview', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save_session',
          company: selectedApp.company, role: selectedApp.role,
          applicationId: selectedApp.id, questions, transcript: newTranscript,
        }),
      }).catch(() => {});
      if (user) clearSession(user.id);
      setSavedSession(null);
      setPhase('complete');
    } else {
      setCurrentIdx(i => i + 1);
      setAnswer(''); setFeedback(null);
      setPhase('question');
    }
  }

  function copyTranscript() {
    const text = transcript.map((e, i) =>
      `Q${i+1} [${e.question.type}] — Score: ${e.feedback.score}/5\n${e.question.q}\n\nYour answer:\n${e.answer}\n\nFeedback:\n${e.feedback.overall}\n\nTo improve:\n${e.feedback.improvements.map(x=>`• ${x}`).join('\n')}\n`
    ).join('\n' + '─'.repeat(40) + '\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? (currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length : 0;
  const appColor = selectedApp ? (STAGE_COLORS[selectedApp.status] || '#2563EB') : '#2563EB';

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--body-text)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="mono" />}
              <span className="text-[15px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            </Link>
            {/* View switcher pill — same as dashboard */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border-gray" style={{ background: 'var(--surface-gray)' }}>
              {[
                { label: 'Today',    href: '/dashboard',                icon: <Home size={12} aria-hidden /> },
                { label: 'Pipeline', href: '/dashboard?view=pipeline',  icon: <LayoutDashboard size={12} aria-hidden /> },
                { label: 'List',     href: '/dashboard?view=table',     icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
              ].map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-1.5 px-2.5 h-7 text-[12px] font-medium rounded-md transition-all"
                  style={{ background: 'transparent', color: 'var(--muted-text)' }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
            {/* Page links */}
            <div className="flex items-center gap-0.5 border-l border-border-gray pl-4">
              {[
                { href: '/calendar',  label: 'Calendar',  icon: <Calendar size={13} aria-hidden />, active: false },
                { href: '/interview', label: 'Interview',  icon: <Mic size={13} aria-hidden />,     active: true },
              ].map(({ href, label, icon, active }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  style={{ color: active ? 'var(--accent-blue)' : 'var(--muted-text)', background: active ? 'rgba(37,99,235,0.08)' : 'transparent' }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="text-[12px] transition-colors"
              style={{ color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ── View switcher (only shown in pick/history, not mid-session) ─────── */}
      {(phase === 'pick' || view === 'history') && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 0' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-gray)', borderRadius: 10, padding: 3, gap: 2, border: '1px solid var(--border-gray)' }}>
            {(['session', 'history'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  height: 32, padding: '0 16px', borderRadius: 8, border: 'none',
                  background: view === v ? '#2563EB' : 'transparent',
                  color: view === v ? '#fff' : 'var(--muted-text)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {v === 'session' ? (
                  <><Mic size={13} /> New Session</>
                ) : (
                  <><HistoryIcon size={13} /> History</>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── VIEW: HISTORY ────────────────────────────────────────────────── */}
        {view === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}
          >
            {sessionsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)', fontSize: 14 }}>
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'var(--muted-text)', fontSize: 15, marginBottom: 12 }}>No sessions yet.</p>
                <button
                  onClick={() => setView('session')}
                  style={{ color: '#2563EB', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Start your first mock interview →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sessions.map((s, si) => {
                  const scores = s.transcript.map(e => e.feedback.score);
                  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
                  const color = SCORE_COLOR(avgScore);
                  const isOpen = expandedSession === s.id;
                  const date = new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: si * 0.05 }}
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 14, overflow: 'hidden' }}
                    >
                      {/* Session row */}
                      <button
                        onClick={() => setExpandedSession(isOpen ? null : s.id)}
                        style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                      >
                        <CompanyAvatar company={s.company} color={color} size={40} />
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--body-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.company}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role} · {date}</p>
                        </div>

                        {/* Mini score bar chart */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28, flexShrink: 0 }}>
                          {scores.map((sc, i) => (
                            <div key={i} style={{ width: 6, borderRadius: 2, background: SCORE_COLOR(sc), height: (sc / 5) * 28 }} title={`Q${i+1}: ${sc}/5`} />
                          ))}
                        </div>

                        {/* Avg score */}
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 52 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{avgScore}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted-text)', fontFamily: "'DM Mono', monospace" }}>/5</span>
                        </div>

                        <span style={{ color: 'var(--muted-text)', flexShrink: 0 }}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>

                      {/* Expanded transcript */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ borderTop: '1px solid var(--border-gray)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {s.transcript.map((e, qi) => (
                                <div key={qi} style={{ background: 'var(--surface-gray)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${SCORE_COLOR(e.feedback.score)}` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace" }}>Q{qi+1}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.question.type}</span>
                                    <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: SCORE_COLOR(e.feedback.score) }}>{e.feedback.score}/5 — {SCORE_LABEL(e.feedback.score)}</span>
                                  </div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--body-text)', margin: '0 0 6px', lineHeight: 1.5 }}>{e.question.q}</p>
                                  <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '0 0 8px', lineHeight: 1.6, fontStyle: 'italic' }}>{e.feedback.overall}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {e.feedback.strengths.map((str, i) => (
                                      <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 9999, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>{str}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* Download button */}
                              <motion.button
                                onClick={() => downloadTranscript(s.company, s.role, s.transcript)}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                style={{
                                  marginTop: 4, height: 40, borderRadius: 10, background: '#2563EB',
                                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                }}
                              >
                                <Download size={14} /> Download Report
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PHASE: PICK ──────────────────────────────────────────────────── */}
        {phase === 'pick' && view === 'session' && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Hero */}
            <div style={{
              padding: '36px 24px 24px',
              background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.1) 0%, transparent 70%)',
              textAlign: 'center',
            }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="9" y1="22" x2="15" y2="22" />
                </svg>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 7px', color: 'var(--body-text)' }}
              >
                Mock Interview
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                style={{ fontSize: 14, color: 'var(--muted-text)', margin: '0 auto', maxWidth: 380 }}
              >
                Practice out loud. Get real STAR feedback. Get hired.
              </motion.p>
            </div>

            {/* Resume banner */}
            {savedSession && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: 900, margin: '0 auto 0', padding: '0 24px 20px' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 18px', borderRadius: 14,
                  background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--body-text)', margin: '0 0 2px' }}>
                      ↩ In-progress session: {savedSession.selectedApp.company} · {savedSession.selectedApp.role}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: 0 }}>
                      Question {savedSession.currentIdx + 1} of {savedSession.questions.length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedApp(savedSession.selectedApp);
                      setQuestions(savedSession.questions);
                      setCurrentIdx(savedSession.currentIdx);
                      setAnswer(savedSession.answer);
                      setTranscript(savedSession.transcript);
                      setFeedback(savedSession.feedback);
                      setQuestionCount(savedSession.questionCount);
                      setQuestionType(savedSession.questionType);
                      setPhase(savedSession.phase);
                      setSavedSession(null);
                    }}
                    style={{
                      height: 34, padding: '0 16px', borderRadius: 9,
                      background: '#2563EB', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap',
                    }}
                  >
                    Continue →
                  </button>
                  <button
                    onClick={() => {
                      if (user) clearSession(user.id);
                      setSavedSession(null);
                    }}
                    style={{
                      height: 34, padding: '0 14px', borderRadius: 9,
                      background: 'var(--surface-gray)', border: '1px solid var(--border-gray)',
                      cursor: 'pointer', fontSize: 13, color: 'var(--muted-text)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* App picker */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ marginBottom: 28 }}
              >
                <div style={{ position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', stroke: 'var(--muted-text)' }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search applications…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%', height: 46, paddingLeft: 40, paddingRight: 16,
                      background: 'var(--surface-gray)', border: '1px solid var(--border-gray)',
                      borderRadius: 12, fontSize: 14, color: 'var(--body-text)', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </motion.div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)', fontSize: 14 }}>Loading…</div>
              ) : filteredApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ color: 'var(--muted-text)', fontSize: 15 }}>No active applications found.</p>
                  <Link href="/dashboard" style={{ color: '#2563EB', fontSize: 13, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Go add some →</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  <AnimatePresence>
                    {filteredApps.map((app, i) => {
                      const color = STAGE_COLORS[app.status] || '#2563EB';
                      return (
                        <motion.button
                          key={app.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ delay: i * 0.04, duration: 0.3 }}
                          whileHover={{ scale: 1.02, boxShadow: `0 8px 32px ${color}30` }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedApp(app);
                            if (!userIsPro) { setShowUpgrade(true); return; }
                            setPhase('setup');
                          }}
                          style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-gray)',
                            borderRadius: 14, padding: '16px',
                            cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}60`}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-gray)'}
                        >
                          <CompanyAvatar company={app.company} color={color} size={44} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--body-text)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.company}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.role}
                            </p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                              padding: '3px 8px', borderRadius: 6,
                              background: `${color}18`, color,
                            }}>
                              {app.status}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── PHASE: SETUP ─────────────────────────────────────────────────── */}
        {phase === 'setup' && selectedApp && (
          <motion.div key="setup" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 80px' }}>
            {/* Back */}
            <button onClick={() => setPhase('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', fontSize: 13, padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back
            </button>

            {/* Session header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
              <CompanyAvatar company={selectedApp.company} color={appColor} size={56} />
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--body-text)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>{selectedApp.company}</h2>
                <p style={{ fontSize: 14, color: 'var(--muted-text)', margin: 0 }}>{selectedApp.role}</p>
              </div>
            </div>

            {/* Settings */}
            {[
              {
                label: 'NUMBER OF QUESTIONS',
                options: [3, 5, 7].map(n => ({ value: String(n), label: String(n) })),
                value: String(questionCount),
                onChange: (v: string) => setQuestionCount(Number(v)),
                hidden: questionType === 'essentials',
              },
              {
                label: 'QUESTION FOCUS',
                options: [
                  { value: 'mixed',      label: 'Mixed' },
                  { value: 'behavioral', label: 'Behavioral' },
                  { value: 'technical',  label: 'Technical' },
                  { value: 'essentials', label: '✦ Essentials' },
                ],
                value: questionType,
                onChange: (v: string) => {
                  setQuestionType(v as QuestionType);
                  if (v === 'essentials') setQuestionCount(5);
                },
              },
              {
                label: 'INPUT MODE',
                options: [
                  { value: 'text', label: '⌨ Type' },
                  ...(voice.supported ? [{ value: 'voice', label: '🎤 Voice' }] : []),
                ],
                value: inputMode,
                onChange: (v: string) => setInputMode(v as InputMode),
              },
            ].filter(row => !('hidden' in row && row.hidden)).map(row => (
              <div key={row.label} style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', margin: '0 0 10px', fontFamily: "'DM Mono', monospace" }}>
                  {row.label}
                </p>
                {questionType === 'essentials' && row.label === 'QUESTION FOCUS' && (
                  <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '-6px 0 10px', fontStyle: 'italic' }}>
                    Classic opener questions every interviewer asks — tailored to this company
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {row.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => row.onChange(opt.value)}
                      style={{
                        height: 38, padding: '0 18px', borderRadius: 9,
                        border: row.value === opt.value ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-gray)',
                        background: row.value === opt.value ? 'rgba(37,99,235,0.1)' : 'var(--surface-gray)',
                        color: row.value === opt.value ? 'var(--accent-blue)' : 'var(--muted-text)',
                        fontSize: 13, fontWeight: row.value === opt.value ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Roast mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', marginBottom: 28, background: roastMode ? 'rgba(220,38,38,0.06)' : 'var(--surface-gray)', borderRadius: 10, border: roastMode ? '1px solid rgba(220,38,38,0.25)' : '1px solid var(--border-gray)', transition: 'all 0.2s' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: roastMode ? '#DC2626' : 'var(--brand-navy)' }}>🔥 Brutal feedback</span>
                <span style={{ fontSize: 12, color: 'var(--muted-text)', marginLeft: 8 }}>No diplomacy. Claude calls it exactly as it is.</span>
              </div>
              <button
                onClick={() => setRoastMode(r => !r)}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: roastMode ? '#DC2626' : 'var(--border-gray)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: 2, left: roastMode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
              </button>
            </div>

            {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 16 }}>{error}</p>}

            {/* CTA */}
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(300%); }
              }
            `}</style>
            <motion.button
              onClick={startInterview}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 52, borderRadius: 13,
                background: '#2563EB', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                position: 'relative', overflow: 'hidden',
                fontFamily: 'inherit',
              }}
            >
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                animation: 'shimmer 2.5s infinite',
              }} />
              <span style={{ position: 'relative' }}>Begin Session</span>
              <span style={{ position: 'relative', fontSize: 18 }}>→</span>
            </motion.button>
          </motion.div>
        )}

        {/* ── PHASE: LOADING ───────────────────────────────────────────────── */}
        {phase === 'loading' && selectedApp && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              style={{ width: 56, height: 56 }}
            >
              <svg viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="24" style={{ stroke: 'var(--border-gray)' }} strokeWidth="4" />
                <circle cx="28" cy="28" r="24" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray="40 110" />
              </svg>
            </motion.div>
            <LoadingTypewriter company={selectedApp.company} />
          </motion.div>
        )}

        {/* ── PHASE: QUESTION ──────────────────────────────────────────────── */}
        {(phase === 'question' || phase === 'evaluating') && currentQ && selectedApp && (
          <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24, alignItems: 'start' }}>

              {/* Left panel */}
              <div style={{ position: 'sticky', top: 80 }}>
                <div style={{
                  background: 'var(--card-bg)', border: '1px solid var(--border-gray)',
                  borderRadius: 16, padding: '28px 24px',
                }}>
                  {/* Company */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <CompanyAvatar company={selectedApp.company} color={appColor} size={36} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--body-text)', margin: 0 }}>{selectedApp.company}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: 0 }}>{selectedApp.role}</p>
                    </div>
                  </div>

                  {/* Progress ring */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                    <ProgressRing current={currentIdx + 1} total={questions.length} />
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
                      QUESTION {currentIdx + 1} OF {questions.length}
                    </p>
                  </div>

                  {/* STAR guide */}
                  <div>
                    <button
                      onClick={() => setStarCollapsed(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}
                    >
                      STAR FRAMEWORK {starCollapsed ? '▸' : '▾'}
                    </button>
                    <AnimatePresence>
                      {!starCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {[
                            { key: 'S', label: 'Situation', desc: 'Set the scene' },
                            { key: 'T', label: 'Task', desc: 'Your responsibility' },
                            { key: 'A', label: 'Action', desc: 'What you did' },
                            { key: 'R', label: 'Result', desc: 'The outcome' },
                          ].map(item => (
                            <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', fontFamily: "'DM Mono', monospace",
                              }}>
                                {item.key}
                              </span>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--body-text)', margin: '2px 0 1px' }}>{item.label}</p>
                                <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: 0 }}>{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div>
                {/* Question type badge + why */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '4px 10px', borderRadius: 9999,
                        background: currentQ.type === 'behavioral' ? 'rgba(37,99,235,0.12)' : 'rgba(139,92,246,0.12)',
                        color: currentQ.type === 'behavioral' ? 'var(--accent-blue)' : '#8B5CF6',
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {currentQ.type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted-text)', fontStyle: 'italic' }}>{currentQ.why}</span>
                    </div>

                    {/* Question */}
                    <div style={{
                      fontSize: 20, fontWeight: 700, color: 'var(--body-text)', lineHeight: 1.5,
                      marginBottom: 24, padding: '20px 22px',
                      background: 'var(--card-bg)', borderRadius: 14,
                      border: '1px solid var(--border-gray)',
                      borderLeft: `3px solid ${currentQ.type === 'behavioral' ? '#2563EB' : '#7C3AED'}`,
                    }}>
                      {currentQ.q}
                    </div>

                    {/* Input mode toggle */}
                    {voice.supported && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {(['text', 'voice'] as InputMode[]).map(m => (
                          <button key={m} onClick={() => { if (voice.listening) voice.stop(); if (cam.active) cam.stop(); setInputMode(m); }}
                            style={{
                              fontSize: 12, padding: '5px 14px', borderRadius: 8,
                              border: inputMode === m ? '1px solid rgba(37,99,235,0.5)' : '1px solid var(--border-gray)',
                              background: inputMode === m ? 'rgba(37,99,235,0.1)' : 'transparent',
                              color: inputMode === m ? 'var(--accent-blue)' : 'var(--muted-text)',
                              cursor: 'pointer', fontFamily: 'inherit', fontWeight: inputMode === m ? 600 : 400,
                            }}>
                            {m === 'text' ? '⌨ Type' : '🎤 Voice'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text input */}
                    {inputMode === 'text' ? (
                      <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer here… Structure it: Situation → Task → Action → Result"
                        rows={8}
                        disabled={phase === 'evaluating'}
                        style={{
                          width: '100%', borderRadius: 12,
                          border: answer.length > 0 ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border-gray)',
                          background: 'var(--surface-gray)', color: 'var(--body-text)', fontSize: 15,
                          padding: '14px 16px', lineHeight: 1.75, resize: 'vertical',
                          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(37,99,235,0.6)')}
                        onBlur={e => (e.currentTarget.style.borderColor = answer.length > 0 ? 'rgba(37,99,235,0.4)' : 'var(--border-gray)')}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer(); }}
                      />
                    ) : (
                      /* Voice input with integrated camera preview */
                      <div style={{
                        border: voice.listening ? '1px solid rgba(37,99,235,0.5)' : '1px solid var(--border-gray)',
                        borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                      }}>
                        {/* Camera preview — collapses when inactive */}
                        <div style={{ height: cam.active ? 180 : 0, overflow: 'hidden', transition: 'height 0.3s ease', background: '#0A0A0A', position: 'relative' }}>
                          <video ref={cam.videoRef} playsInline muted
                            style={{ width: '100%', height: 180, objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                          <canvas ref={cam.canvasRef} style={{ display: 'none' }} />
                          {cam.active && (
                            <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 9999, padding: '3px 9px' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '14px 16px', minHeight: 120, background: 'var(--surface-gray)', fontSize: 15, lineHeight: 1.75, color: answer ? 'var(--body-text)' : 'var(--text-tertiary)' }}>
                          {answer || 'Press the mic and speak your answer…'}
                        </div>
                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-gray)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <button
                            onClick={() => {
                              if (voice.listening) {
                                voice.stop();
                                cam.stop();
                              } else {
                                setAnswer('');
                                voice.start();
                                void cam.start();
                              }
                            }}
                            style={{
                              width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
                              background: voice.listening ? '#EF4444' : '#2563EB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.2s',
                            }}
                          >
                            {voice.listening ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                                <rect x="9" y="2" width="6" height="12" rx="3" />
                                <path d="M5 10a7 7 0 0 0 14 0" />
                                <line x1="12" y1="19" x2="12" y2="22" />
                              </svg>
                            )}
                          </button>
                          <WaveformBars active={voice.listening} />
                          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>
                            {voice.listening ? 'Listening… click to stop' : 'Click mic to speak'}
                          </span>
                          {answer && (
                            <button onClick={() => setAnswer('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <RotateCcw size={11} /> Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace" }}>
                        {inputMode === 'text' ? '⌘↵ to submit' : ''}
                      </span>
                      <motion.button
                        onClick={submitAnswer}
                        disabled={!answer.trim() || phase === 'evaluating'}
                        whileHover={answer.trim() ? { scale: 1.03 } : {}}
                        whileTap={answer.trim() ? { scale: 0.97 } : {}}
                        style={{
                          height: 44, padding: '0 22px', borderRadius: 11,
                          background: answer.trim() && phase !== 'evaluating' ? '#2563EB' : 'var(--surface-gray)',
                          border: 'none', color: answer.trim() && phase !== 'evaluating' ? '#fff' : 'var(--text-tertiary)',
                          fontSize: 14, fontWeight: 600, cursor: answer.trim() && phase !== 'evaluating' ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', gap: 8,
                          transition: 'background 0.2s, color 0.2s', fontFamily: 'inherit',
                        }}
                      >
                        {phase === 'evaluating' ? (
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--border-gray)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
                        ) : null}
                        {phase === 'evaluating' ? 'Analyzing…' : 'Submit Answer →'}
                      </motion.button>
                    </div>

                    {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 12 }}>{error}</p>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PHASE: FEEDBACK ──────────────────────────────────────────────── */}
        {phase === 'feedback' && feedback && currentQ && selectedApp && (
          <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}
          >
            {/* Roast mode banner */}
            {feedback.roast_mode && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10, padding: '8px 14px', marginBottom: 18 }}
              >
                <span style={{ fontSize: 16 }}>🔥</span>
                <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Brutal mode — no diplomatic softening</span>
              </motion.div>
            )}

            {/* Score reveal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px',
                background: 'var(--card-bg)', border: `1px solid ${SCORE_COLOR(feedback.score)}30`,
                borderRadius: 16, marginBottom: 28, borderLeft: `3px solid ${SCORE_COLOR(feedback.score)}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 44, fontWeight: 800, color: SCORE_COLOR(feedback.score), lineHeight: 1 }}>
                    {feedback.score}
                  </span>
                  <span style={{ fontSize: 18, color: 'var(--muted-text)', fontFamily: "'DM Mono', monospace" }}>/5</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: SCORE_COLOR(feedback.score), margin: '4px 0 0', letterSpacing: '0.06em' }}>
                  {SCORE_LABEL(feedback.score).toUpperCase()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                {[1,2,3,4,5].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 400 }}
                    style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: i <= feedback.score ? SCORE_COLOR(feedback.score) : 'var(--border-gray)',
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Question reminder */}
            <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 20, fontStyle: 'italic', borderLeft: '2px solid var(--border-gray)', paddingLeft: 14 }}>
              "{currentQ.q}"
            </p>

            {/* STAR breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {(['situation', 'task', 'action', 'result'] as const).map((k, i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                >
                  <StarCard k={k} label={k.charAt(0).toUpperCase() + k.slice(1)} data={feedback.star[k]} />
                </motion.div>
              ))}
            </div>

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#10B981', margin: '0 0 10px', fontFamily: "'DM Mono', monospace" }}>STRENGTHS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {feedback.strengths.map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.06 }}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 9999, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                    >{s}</motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Improvements */}
            {feedback.improvements.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#F59E0B', margin: '0 0 10px', fontFamily: "'DM Mono', monospace" }}>TO IMPROVE</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {feedback.improvements.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6 }}>{s}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Overall */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ padding: '16px 18px', background: 'var(--card-bg)', borderRadius: 12, marginBottom: feedback.expressionAnalysis ? 16 : 28, fontSize: 14, color: 'var(--muted-text)', lineHeight: 1.7, fontStyle: 'italic', border: '1px solid var(--border-gray)' }}
            >
              {feedback.overall}
            </motion.div>

            {/* Expression analysis (camera mode only) */}
            {feedback.expressionAnalysis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.78 }}
                style={{ padding: '14px 16px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 12, marginBottom: 28 }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', margin: '0 0 8px', fontFamily: "'DM Mono', monospace" }}>
                  📷 PRESENCE ANALYSIS
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0, lineHeight: 1.7 }}>
                  {feedback.expressionAnalysis}
                </p>
              </motion.div>
            )}

            {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</p>}

            <motion.button
              onClick={advance}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 50, borderRadius: 13,
                background: '#2563EB', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {currentIdx + 1 >= questions.length ? 'View Results →' : 'Next Question →'}
            </motion.button>
          </motion.div>
        )}

        {/* ── PHASE: COMPLETE ──────────────────────────────────────────────── */}
        {phase === 'complete' && selectedApp && (
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 700, margin: '0 auto', padding: '56px 24px 80px' }}
          >
            {/* Score */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
                SESSION COMPLETE
              </p>
              <AnimatedScore target={avg(transcript)} color={SCORE_COLOR(avg(transcript))} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 800, color: 'var(--text-tertiary)', display: 'block', marginTop: -4 }}>/5</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: SCORE_COLOR(avg(transcript)), marginTop: 6 }}>
                {SCORE_LABEL(Math.round(avg(transcript)))} · {transcript.length} question{transcript.length !== 1 ? 's' : ''}
              </p>

              {/* Mini score bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 24, justifyContent: 'center', height: 48 }}>
                {transcript.map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: (e.feedback.score / 5) * 48, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                      width: 28, borderRadius: 4,
                      background: SCORE_COLOR(e.feedback.score),
                      position: 'relative',
                    }}
                    title={`Q${i+1}: ${e.feedback.score}/5`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                {transcript.map((_, i) => (
                  <span key={i} style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace", width: 28, textAlign: 'center' }}>Q{i+1}</span>
                ))}
              </div>
            </div>

            {/* Per-question accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {transcript.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 12 }}
                >
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    style={{
                      width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 800, color: SCORE_COLOR(e.feedback.score), flexShrink: 0 }}>
                      {e.feedback.score}
                    </span>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--body-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Q{i+1}: {e.question.q}
                      </p>
                      {e.feedback.improvements[0] && (
                        <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ↑ {e.feedback.improvements[0]}
                        </p>
                      )}
                    </div>
                    <span style={{ color: 'var(--muted-text)', flexShrink: 0 }}>
                      {expandedQ === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedQ === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-gray)' }}>
                          <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '14px 0 8px', fontStyle: 'italic' }}>Your answer:</p>
                          <p style={{ fontSize: 13, color: 'var(--body-text)', lineHeight: 1.6, margin: '0 0 12px', background: 'var(--surface-gray)', borderRadius: 8, padding: '10px 12px' }}>{e.answer}</p>
                          <p style={{ fontSize: 13, color: 'var(--muted-text)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>{e.feedback.overall}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                onClick={() => downloadTranscript(selectedApp.company, selectedApp.role, transcript)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, height: 50, borderRadius: 13, background: '#2563EB',
                  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                }}
              >
                <Download size={16} /> Download Transcript
              </motion.button>
              <button
                onClick={copyTranscript}
                style={{
                  height: 50, padding: '0 20px', borderRadius: 13,
                  border: '1px solid var(--border-gray)', background: 'var(--surface-gray)',
                  color: copied ? '#10B981' : 'var(--muted-text)',
                  fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                }}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <button
              onClick={() => { setPhase('pick'); setSelectedApp(null); setTranscript([]); setCurrentIdx(0); setAnswer(''); setFeedback(null); }}
              style={{ width: '100%', height: 40, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <RotateCcw size={13} /> Practice another role
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar for question/feedback phases */}
      {questions.length > 0 && (phase === 'question' || phase === 'evaluating' || phase === 'feedback') && (
        <div style={{ position: 'fixed', top: 52, left: 0, right: 0, height: 2, background: 'var(--border-gray)', zIndex: 40 }}>
          <motion.div
            style={{ height: '100%', background: '#2563EB', transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="billing" />
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

function InterviewPageInner() {
  const { user } = useAuth();
  const userIsPro = isPro(user);
  if (!user) return null;
  return (
    <StoreProvider userId={user.id} isPro={userIsPro}>
      <Suspense>
        <InterviewContent />
      </Suspense>
    </StoreProvider>
  );
}

export default InterviewPageInner;
