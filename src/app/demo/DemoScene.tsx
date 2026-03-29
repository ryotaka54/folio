'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Color palette ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0A',
  card: '#1C1C1E',
  surface: '#111113',
  border: '#2C2C2E',
  borderEmphasis: '#3F3F46',
  blue: '#3B82F6',
  blueHover: '#60A5FA',
  navy: '#F9FAFB',
  muted: '#A1A1AA',
  tertiary: '#71717A',
  amber: '#FBBF24',
  green: '#4ADE80',
  danger: '#F87171',
};

const STAGE_COLORS: Record<string, string> = {
  'Wishlist': '#8B5CF6',
  'Applied': '#3B82F6',
  'OA / Online Assessment': '#06B6D4',
  'Phone / Recruiter Screen': '#F59E0B',
  'Final Round Interviews': '#EF4444',
  'Offer': '#10B981',
  'Rejected': '#6B7280',
};

// ─── Data ──────────────────────────────────────────────────────────────────────
interface DemoCard {
  id: string; company: string; role: string; category: string;
  status: string; deadline?: string; deadlineDaysLeft?: number;
}

const EN_CARDS: DemoCard[] = [
  { id: 'google',    company: 'Google',    role: 'Software Engineer Intern',  category: 'Engineering',        status: 'Applied' },
  { id: 'meta',      company: 'Meta',      role: 'SWE Intern',               category: 'Engineering',        status: 'Applied' },
  { id: 'stripe',    company: 'Stripe',    role: 'Product Manager Intern',   category: 'Product Management', status: 'Wishlist' },
  { id: 'airbnb',    company: 'Airbnb',    role: 'Design Intern',            category: 'Design',             status: 'OA / Online Assessment', deadline: '5d left', deadlineDaysLeft: 5 },
  { id: 'anthropic', company: 'Anthropic', role: 'Research Intern',          category: 'Engineering',        status: 'Phone / Recruiter Screen' },
  { id: 'apple',     company: 'Apple',     role: 'Software Engineer Intern', category: 'Engineering',        status: 'Applied' },
];

const JP_CARDS: DemoCard[] = [
  { id: 'recruit',  company: 'リクルート', role: 'ソフトウェアエンジニア インターン', category: 'エンジニアリング', status: 'Applied' },
  { id: 'mercari',  company: 'メルカリ',   role: 'エンジニア インターン',           category: 'エンジニアリング', status: 'Applied' },
  { id: 'sony',     company: 'ソニー',     role: 'プロダクトマネージャー インターン', category: 'プロダクト',      status: 'Wishlist' },
  { id: 'dena',     company: 'DeNA',      role: 'デザイナー インターン',           category: 'デザイン',        status: 'OA / Online Assessment', deadline: '5d left', deadlineDaysLeft: 5 },
  { id: 'line',     company: 'LINE',      role: 'リサーチ インターン',            category: 'エンジニアリング', status: 'Phone / Recruiter Screen' },
  { id: 'rakuten',  company: '楽天',       role: 'ソフトウェアエンジニア インターン', category: 'エンジニアリング', status: 'Applied' },
];

const COLUMNS = ['Wishlist', 'Applied', 'OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function typeInto(setter: (v: string) => void, text: string, sig: { cancelled: boolean }) {
  for (let i = 0; i <= text.length; i++) {
    if (sig.cancelled) return;
    setter(text.slice(0, i));
    await sleep(65 + Math.random() * 75);
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, unit = '', pulse = false, color }: {
  label: string; value: number; unit?: string; pulse?: boolean; color?: string;
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${pulse ? C.amber : C.border}`,
      borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 0,
      boxShadow: pulse ? `0 0 0 3px ${C.amber}28` : undefined,
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? C.navy, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}{unit}
      </div>
    </div>
  );
}

function AppCard({ card, moving = false, pulsing = false }: {
  card: DemoCard; moving?: boolean; pulsing?: boolean;
}) {
  const statusColor = STAGE_COLORS[card.status] ?? C.blue;
  const isUrgent = (card.deadlineDaysLeft ?? 99) <= 3;
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${pulsing ? C.amber : C.border}`,
      borderRadius: 8, padding: '10px 12px', width: '100%',
      boxShadow: moving ? '0 8px 32px rgba(0,0,0,0.6)' : pulsing ? `0 0 0 2px ${C.amber}44` : undefined,
      transform: moving ? 'rotate(1.5deg) scale(1.04)' : undefined,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      animation: 'cardIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.3, marginBottom: 2 }}>{card.company}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.3 }}>{card.role}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {card.category && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            background: `${statusColor}1a`, color: statusColor,
          }}>{card.category}</span>
        )}
        {card.deadline && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, marginLeft: 'auto',
            background: isUrgent ? '#FEF2F218' : '#FEF3C718',
            color: isUrgent ? C.danger : C.amber,
            border: `1px solid ${isUrgent ? C.danger + '55' : C.amber + '55'}`,
            animation: pulsing ? 'amberPulse 1.5s ease-in-out 3' : undefined,
          }}>{card.deadline}</span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ name, cards, movingCardId, pulseCardId, isTarget }: {
  name: string; cards: DemoCard[]; movingCardId?: string | null;
  pulseCardId?: string | null; isTarget?: boolean;
}) {
  const color = STAGE_COLORS[name] ?? C.blue;
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: isTarget ? `${color}12` : C.surface,
      border: `1px solid ${isTarget ? color + '60' : C.border}`,
      borderRadius: 12, padding: '12px 10px', minHeight: 220,
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.01em', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 5, background: `${color}22`, color,
        }}>{cards.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.length === 0
          ? <div style={{ textAlign: 'center', padding: '24px 0', color: C.tertiary, fontSize: 11 }}>No applications yet</div>
          : cards.map(c => (
            <AppCard key={c.id} card={c}
              moving={movingCardId === c.id}
              pulsing={pulseCardId === c.id}
            />
          ))
        }
      </div>
    </div>
  );
}

function DemoCursor({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 18, height: 18, borderRadius: '50%',
      background: 'rgba(59,130,246,0.9)', border: '2px solid rgba(255,255,255,0.95)',
      boxShadow: '0 2px 14px rgba(59,130,246,0.6)',
      transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 9000,
      opacity: visible ? 1 : 0,
      transition: 'left 0.55s cubic-bezier(0.25,0.46,0.45,0.94), top 0.55s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease',
    }} />
  );
}

function AddModal({ fields, highlightSave }: {
  fields: { company: string; role: string; category: string; status: string; deadline: string };
  highlightSave: boolean;
}) {
  const showCursor = (val: string, maxLen: number) => val.length > 0 && val.length < maxLen;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      animation: 'bgFadeIn 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: '16px 16px 0 0',
        padding: '24px 24px 40px', animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.borderEmphasis, margin: '0 auto 22px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 20, letterSpacing: '-0.01em' }}>Log Application</div>

        {[{ label: 'Company', val: fields.company, max: 7 }, { label: 'Role', val: fields.role, max: 24 }].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{f.label}</label>
            <div style={{
              height: 40, borderRadius: 8, border: `1px solid ${f.val ? C.blue : C.border}`,
              background: C.bg, padding: '0 12px', display: 'flex', alignItems: 'center',
              fontSize: 13, color: C.navy, transition: 'border-color 0.2s',
            }}>
              <span>{f.val}</span>
              {showCursor(f.val, f.max) && (
                <span style={{ display: 'inline-block', width: 1.5, height: 14, background: C.blue, marginLeft: 1, animation: 'blink 0.75s step-end infinite' }} />
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {[{ label: 'Category', val: fields.category }, { label: 'Status', val: fields.status }].map(f => (
            <div key={f.label} style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{f.label}</label>
              <div style={{
                height: 40, borderRadius: 8, border: `1px solid ${f.val ? C.blue : C.border}`,
                background: C.bg, padding: '0 12px', display: 'flex', alignItems: 'center',
                fontSize: 12, color: f.val ? C.navy : C.tertiary,
              }}>
                {f.val || 'Select…'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Deadline</label>
          <div style={{
            height: 40, borderRadius: 8, border: `1px solid ${fields.deadline ? C.blue : C.border}`,
            background: C.bg, padding: '0 12px', display: 'flex', alignItems: 'center',
            fontSize: 12, color: fields.deadline ? C.navy : C.tertiary,
          }}>
            {fields.deadline || 'mm/dd/yyyy'}
          </div>
        </div>

        <button style={{
          width: '100%', height: 44, borderRadius: 10,
          background: highlightSave ? C.blueHover : C.blue,
          color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          transform: highlightSave ? 'scale(0.98)' : undefined,
          boxShadow: highlightSave ? `0 0 0 3px ${C.blue}44` : undefined,
          transition: 'all 0.15s ease',
        }}>Save Application</button>
      </div>
    </div>
  );
}

function PhoneMockup({ stage }: { stage: 'hidden' | 'in' | 'tapping' | 'popup' | 'out' }) {
  if (stage === 'hidden') return null;
  const visible = stage === 'in' || stage === 'tapping' || stage === 'popup';
  return (
    <div style={{
      position: 'absolute', right: visible ? 24 : -240, top: '50%',
      transform: 'translateY(-50%)',
      width: 180, background: '#0D0D0F',
      borderRadius: 28, border: '2px solid #3A3A3C',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      overflow: 'hidden', zIndex: 600,
      transition: 'right 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <div style={{ height: 36, background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 64, height: 18, borderRadius: 9, background: '#000' }} />
      </div>
      <div style={{ background: '#1C1C1E', padding: '5px 7px', borderBottom: '1px solid #2C2C2E', display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ flex: 1, height: 20, borderRadius: 5, background: '#2C2C2E', display: 'flex', alignItems: 'center', padding: '0 7px' }}>
          <span style={{ fontSize: 8, color: C.tertiary }}>linkedin.com/jobs</span>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: 5, background: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color: '#fff',
          animation: (stage === 'tapping' || stage === 'popup') ? 'extPulse 0.35s ease' : undefined,
          boxShadow: (stage === 'tapping' || stage === 'popup') ? `0 0 0 2px ${C.blue}66` : undefined,
        }}>A</div>
      </div>
      <div style={{ background: '#111113', padding: '10px 10px 6px', minHeight: 110 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: C.navy, marginBottom: 2 }}>Apple — Software Engineer Intern</div>
        <div style={{ fontSize: 7, color: C.muted, marginBottom: 8 }}>Cupertino, CA · Internship</div>
        <div style={{ fontSize: 7, color: C.tertiary, lineHeight: 1.5, marginBottom: 8 }}>
          Join Apple&apos;s engineering team. Work on real products used by billions of people worldwide...
        </div>
        {stage === 'popup' && (
          <div style={{
            background: C.card, border: `1px solid ${C.blue}`,
            borderRadius: 7, padding: '8px 8px',
            animation: 'popupIn 0.25s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <div style={{ width: 13, height: 13, borderRadius: 3, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: '#fff' }}>A</div>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.navy }}>Applyd</span>
            </div>
            <div style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>Detected:</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: C.navy }}>Apple</div>
            <div style={{ fontSize: 7, color: C.muted, marginBottom: 8 }}>Software Engineer Intern</div>
            <div style={{
              width: '100%', height: 20, borderRadius: 4, background: C.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 600, color: '#fff',
            }}>✓ Saved to Applyd</div>
          </div>
        )}
      </div>
      <div style={{ height: 20, background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: '#3A3A3C' }} />
      </div>
    </div>
  );
}

function FunnelBar({ label, count, color, pct, visible }: {
  label: string; count: number; color: string; pct: number; visible: boolean;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{visible ? count : 0}</div>
      <div style={{ width: '100%', height: 100, background: C.surface, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: visible ? `${pct}%` : '0%',
          background: color, borderRadius: '4px 4px 0 0',
          transition: 'height 0.9s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function Particles() {
  const pts = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: ((i * 5.7 + Math.sin(i * 1.3) * 12) % 100 + 100) % 100,
    y: ((i * 6.1 + Math.cos(i * 0.8) * 15) % 100 + 100) % 100,
    size: 1 + (i % 3) * 0.6,
    delay: (i * 0.35) % 5,
    dur: 7 + (i % 5) * 1.5,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: C.blue, opacity: 0,
          animation: `particleFloat ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DemoScene({ variant }: { variant: 'full' | 'short' | 'extension' | 'japan' }) {
  const isJapan  = variant === 'japan';
  const isShort  = variant === 'short';
  const isExt    = variant === 'extension';

  const CARDS        = isJapan ? JP_CARDS : EN_CARDS;
  const GREETING     = isJapan ? 'こんにちは、田中さん' : 'Hi, Alex 👋';
  const FIRST_COMPANY = isJapan ? 'リクルート' : 'Google';
  const FIRST_ROLE    = isJapan ? 'ソフトウェアエンジニア インターン' : 'Software Engineer Intern';
  const FIRST_CAT     = isJapan ? 'エンジニアリング' : 'Engineering';
  const EXT_COMPANY   = isJapan ? '楽天' : 'Apple';
  const EXT_ROLE      = isJapan ? 'ソフトウェアエンジニア インターン' : 'Software Engineer Intern';

  const PHASE_LIST = isShort ? [1, 2, 3] : isExt ? [1, 6] : [1, 2, 3, 4, 5, 6, 7, 8];

  // ── State ────────────────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState(0);
  const [cards,         setCards]         = useState<DemoCard[]>([]);
  const [totalApps,     setTotalApps]     = useState(0);
  const [responseRate,  setResponseRate]  = useState(0);
  const [interviews,    setInterviews]    = useState(0);
  const [actNow,        setActNow]        = useState(0);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [modalFields,   setModalFields]   = useState({ company: '', role: '', category: '', status: '', deadline: '' });
  const [highlightSave, setHighlightSave] = useState(false);
  const [cursorX,       setCursorX]       = useState(700);
  const [cursorY,       setCursorY]       = useState(80);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [highlightBtn,  setHighlightBtn]  = useState(false);
  const [movingCardId,  setMovingCardId]  = useState<string | null>(null);
  const [movingTarget,  setMovingTarget]  = useState<string | null>(null);
  const [actNowPulse,   setActNowPulse]   = useState(false);
  const [deadlinePulse, setDeadlinePulse] = useState(false);
  const [tooltipVisible,setTooltipVisible]= useState(false);
  const [phoneStage,    setPhoneStage]    = useState<'hidden'|'in'|'tapping'|'popup'|'out'>('hidden');
  const [funnelVisible, setFunnelVisible] = useState(false);
  const [endSlate,      setEndSlate]      = useState(false);
  const [fadingOut,     setFadingOut]     = useState(false);
  const [paused,        setPaused]        = useState(false);
  const [running,       setRunning]       = useState(false);

  const pausedRef = useRef(false);
  const cancelRef = useRef({ cancelled: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Cursor ref for animation ──────────────────────────────────────────────────
  // We track cursor in a ref-based position so the add-button position is dynamic
  const addBtnRef = useRef<HTMLButtonElement>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const psleep = useCallback(async (ms: number) => {
    const chunk = 50;
    let elapsed = 0;
    while (elapsed < ms) {
      if (cancelRef.current.cancelled) throw new Error('cancelled');
      if (!pausedRef.current) elapsed += chunk;
      await sleep(chunk);
    }
  }, []);

  const moveCursor = useCallback(async (x: number, y: number, ms = 500) => {
    setCursorX(x); setCursorY(y);
    await psleep(ms);
  }, [psleep]);

  const countUp = useCallback((setter: (v: number) => void, from: number, to: number) => {
    const steps = 12, dur = 300;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => setter(Math.round(from + (to - from) * (i / steps))), i * (dur / steps));
    }
  }, []);

  const resetState = useCallback(() => {
    setPhase(0); setCards([]); setTotalApps(0); setResponseRate(0);
    setInterviews(0); setActNow(0); setModalOpen(false);
    setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
    setHighlightSave(false); setCursorVisible(false); setHighlightBtn(false);
    setMovingCardId(null); setMovingTarget(null);
    setActNowPulse(false); setDeadlinePulse(false); setTooltipVisible(false);
    setPhoneStage('hidden'); setFunnelVisible(false); setEndSlate(false); setFadingOut(false);
  }, []);

  // ── Sequence ──────────────────────────────────────────────────────────────────
  const runSequence = useCallback(async () => {
    const sig = cancelRef.current;
    try {
      // Phase 1 — reveal
      if (PHASE_LIST.includes(1)) {
        setPhase(1);
        await psleep(1500);
      }

      // Phase 2 — add first app
      if (PHASE_LIST.includes(2)) {
        setPhase(2);
        setCursorVisible(true);
        // Move cursor to add button top-right area
        await moveCursor(window.innerWidth - 120, 44, 700);
        setHighlightBtn(true);
        await psleep(350);
        setModalOpen(true);
        setHighlightBtn(false);
        await psleep(500);

        const setComp = (v: string) => setModalFields(f => ({ ...f, company: v }));
        const setRole = (v: string) => setModalFields(f => ({ ...f, role: v }));
        await typeInto(setComp, FIRST_COMPANY, sig);
        await psleep(250);
        await typeInto(setRole, FIRST_ROLE, sig);
        await psleep(200);
        setModalFields(f => ({ ...f, category: FIRST_CAT }));
        await psleep(280);
        setModalFields(f => ({ ...f, status: 'Applied' }));
        await psleep(220);
        const dl = new Date(Date.now() + 14 * 86400000);
        setModalFields(f => ({ ...f, deadline: `${dl.getMonth() + 1}/${dl.getDate()}/${dl.getFullYear()}` }));
        await psleep(350);

        await moveCursor(window.innerWidth / 2, window.innerHeight - 60, 400);
        setHighlightSave(true);
        await psleep(320);
        setHighlightSave(false);
        setModalOpen(false);
        setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
        await psleep(200);
        setCards([CARDS[0]]);
        countUp(setTotalApps, 0, 1);
        setCursorVisible(false);
        await psleep(1000);
      }

      // Phase 3 — more apps
      if (PHASE_LIST.includes(3)) {
        setPhase(3);
        const rest = CARDS.slice(1, 5);
        for (let i = 0; i < rest.length; i++) {
          await psleep(450);
          setCards(prev => [...prev, rest[i]]);
          const total = i + 2;
          countUp(setTotalApps, i + 1, total);
          if (i === 2) { countUp(setResponseRate, 0, 60); countUp(setActNow, 0, 1); setActNowPulse(true); setTimeout(() => setActNowPulse(false), 1600); }
          if (i === 3) { countUp(setInterviews, 0, 2); }
        }
        await psleep(1200);
      }

      // Phase 4 — card moves
      if (PHASE_LIST.includes(4)) {
        setPhase(4);
        setMovingCardId(CARDS[1].id);
        setMovingTarget('OA / Online Assessment');
        await psleep(1100);
        setCards(prev => prev.map(c => c.id === CARDS[1].id ? { ...c, status: 'OA / Online Assessment' } : c));
        setMovingCardId(null);
        setMovingTarget(null);
        countUp(setResponseRate, 60, 80);
        await psleep(1200);
      }

      // Phase 5 — deadline alert
      if (PHASE_LIST.includes(5)) {
        setPhase(5);
        setActNowPulse(true);
        await psleep(700);
        setDeadlinePulse(true);
        await psleep(700);
        setTooltipVisible(true);
        await psleep(2300);
        setTooltipVisible(false);
        setActNowPulse(false);
        setDeadlinePulse(false);
        await psleep(700);
      }

      // Phase 6 — extension
      if (PHASE_LIST.includes(6)) {
        setPhase(6);
        await psleep(300);
        setPhoneStage('in');
        await psleep(1200);
        setPhoneStage('tapping');
        await psleep(650);
        setPhoneStage('popup');
        await psleep(2500);
        setPhoneStage('out');
        await psleep(700);
        setPhoneStage('hidden');
        const extCard: DemoCard = { ...CARDS[5], company: EXT_COMPANY, role: EXT_ROLE };
        setCards(prev => [...prev, extCard]);
        countUp(setTotalApps, 5, 6);
        await psleep(1000);
      }

      // Phase 7 — funnel
      if (PHASE_LIST.includes(7)) {
        setPhase(7);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 600, behavior: 'smooth' });
        await psleep(600);
        setFunnelVisible(true);
        await psleep(2800);
      }

      // Phase 8 — end slate
      if (PHASE_LIST.includes(8)) {
        setPhase(8);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        await psleep(2000);
        setFadingOut(true);
        await psleep(700);
        setEndSlate(true);
        await psleep(3200);
        setEndSlate(false);
        setFadingOut(false);
        await psleep(500);
      }

      // Loop
      await psleep(400);
      resetState();
      await psleep(300);
      setRunning(false);
    } catch {
      // cancelled
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const start = useCallback(() => {
    cancelRef.current.cancelled = true;
    cancelRef.current = { cancelled: false };
    resetState();
    setRunning(true);
  }, [resetState]);

  useEffect(() => { if (running) runSequence(); }, [running, runSequence]);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => start(), 600);
    return () => clearTimeout(t);
  }, [start]);

  // Re-loop
  useEffect(() => {
    if (!running && phase === 0) {
      const t = setTimeout(() => setRunning(true), 500);
      return () => clearTimeout(t);
    }
  }, [running, phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') start();
      if (e.key === 'p' || e.key === 'P') { pausedRef.current = !pausedRef.current; setPaused(p => !p); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [start]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const byCol = COLUMNS.reduce((acc, col) => {
    acc[col] = cards.filter(c => c.status === col);
    return acc;
  }, {} as Record<string, DemoCard[]>);

  const dlCard = cards.find(c => c.id === 'airbnb' || c.id === 'dena');

  const funnelBars = [
    { label: 'Wishlist', count: byCol['Wishlist']?.length ?? 0,                  color: STAGE_COLORS['Wishlist'],                  pct: 18 },
    { label: 'Applied',  count: byCol['Applied']?.length ?? 0,                   color: STAGE_COLORS['Applied'],                   pct: 55 },
    { label: 'OA',       count: byCol['OA / Online Assessment']?.length ?? 0,    color: STAGE_COLORS['OA / Online Assessment'],    pct: 38 },
    { label: 'Phone',    count: byCol['Phone / Recruiter Screen']?.length ?? 0,  color: STAGE_COLORS['Phone / Recruiter Screen'],  pct: 26 },
    { label: 'Final',    count: byCol['Final Round Interviews']?.length ?? 0,    color: STAGE_COLORS['Final Round Interviews'],    pct: 10 },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bgFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp    { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes blink      { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
        @keyframes amberPulse { 0%,100% { box-shadow:0 0 0 0 rgba(251,191,36,0) } 50% { box-shadow:0 0 0 4px rgba(251,191,36,0.35) } }
        @keyframes extPulse   { 0% { transform:scale(1) } 50% { transform:scale(1.22) } 100% { transform:scale(1) } }
        @keyframes popupIn    { from { opacity:0; transform:scale(0.9) translateY(4px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes particleFloat { 0%,100% { opacity:0; transform:translateY(0) } 40%,60% { opacity:0.1 } 50% { transform:translateY(-22px) } }
        @keyframes logoGlow   { 0%,100% { box-shadow:0 0 40px rgba(59,130,246,0.3) } 50% { box-shadow:0 0 70px rgba(59,130,246,0.65) } }
        @keyframes tooltipIn  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeBlack  { from { opacity:0 } to { opacity:1 } }
        html, body { background: #0A0A0A !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Full-viewport dark canvas */}
      <div style={{
        width: '100vw', height: '100vh', background: C.bg, overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: 'relative',
      }}>
        <Particles />

        {/* Scrollable content area */}
        <div ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Navbar */}
          <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: `${C.bg}ee`, backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${C.border}`,
            height: 56, padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>A</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, letterSpacing: '-0.02em' }}>Applyd</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 13, color: C.muted }}>{GREETING}</span>
              <button
                ref={addBtnRef}
                style={{
                  height: 34, padding: '0 16px', borderRadius: 8,
                  background: highlightBtn ? C.blueHover : C.blue,
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: highlightBtn ? `0 0 0 3px ${C.blue}44` : undefined,
                  transform: highlightBtn ? 'scale(1.04)' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >+ Add Application</button>
            </div>
          </nav>

          {/* Page body */}
          <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

            {/* Stat row */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Apps"    value={totalApps} />
              <StatCard label="Response Rate" value={responseRate} unit="%" />
              <StatCard label="Interviews"    value={interviews} color={interviews > 0 ? C.green : undefined} />
              <StatCard label="Act Now"       value={actNow} pulse={actNowPulse} color={actNow > 0 ? C.amber : undefined} />
            </div>

            {/* Kanban */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col} name={col} cards={byCol[col] ?? []}
                  movingCardId={movingCardId}
                  pulseCardId={deadlinePulse && dlCard ? dlCard.id : null}
                  isTarget={movingTarget === col}
                />
              ))}
            </div>

            {/* Deadline tooltip */}
            {tooltipVisible && dlCard && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, animation: 'tooltipIn 0.3s ease' }}>
                <div style={{
                  background: C.amber, color: '#000',
                  fontSize: 13, fontWeight: 600,
                  padding: '9px 22px', borderRadius: 24,
                  boxShadow: `0 4px 24px ${C.amber}55`,
                }}>⚠ Deadline approaching — {dlCard.company}</div>
              </div>
            )}

            {/* Funnel chart */}
            {(phase >= 7 || funnelVisible) && (
              <div style={{
                marginTop: 28, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 24px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 20, letterSpacing: '-0.01em' }}>Application Funnel</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  {funnelBars.map(b => (
                    <FunnelBar key={b.label} label={b.label} count={b.count}
                      color={b.color} pct={b.pct} visible={funnelVisible} />
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: C.green,
                    background: `${C.green}18`, padding: '4px 12px', borderRadius: 20,
                  }}>{responseRate}% response rate</span>
                </div>
              </div>
            )}

            <div style={{ height: 80 }} />
          </div>
        </div>

        {/* Modal overlay */}
        {modalOpen && <AddModal fields={modalFields} highlightSave={highlightSave} />}

        {/* Phone */}
        <PhoneMockup stage={phoneStage} />

        {/* Cursor dot */}
        <DemoCursor x={cursorX} y={cursorY} visible={cursorVisible} />

        {/* Fade-to-black overlay */}
        {fadingOut && (
          <div style={{ position: 'absolute', inset: 0, background: C.bg, zIndex: 700, animation: 'fadeBlack 0.8s ease both' }} />
        )}

        {/* End slate */}
        {endSlate && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 800, background: C.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'bgFadeIn 0.3s ease',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: C.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 800, color: '#fff',
              animation: 'logoGlow 2s ease-in-out infinite', marginBottom: 22,
            }}>A</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: C.navy, letterSpacing: '-0.04em', marginBottom: 12 }}>Applyd</div>
            <div style={{ fontSize: 16, color: C.tertiary }}>useapplyd.com</div>
          </div>
        )}

        {/* Pause badge */}
        {paused && (
          <div style={{
            position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: `1px solid ${C.border}`, borderRadius: 20, padding: '8px 22px',
            fontSize: 12, fontWeight: 600, color: C.muted, zIndex: 9000,
          }}>⏸ Paused — press P to resume</div>
        )}
      </div>
    </>
  );
}
