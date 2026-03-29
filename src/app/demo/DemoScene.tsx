'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, PipelineStage, Category } from '@/lib/types';
import { INTERNSHIP_STAGES, STAGE_COLORS } from '@/lib/constants';
import StatsBar from '@/components/StatsBar';
import FunnelChart from '@/components/FunnelChart';
import ApplicationCard from '@/components/ApplicationCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function typeInto(setter: (v: string) => void, text: string, sig: { cancelled: boolean }) {
  for (let i = 0; i <= text.length; i++) {
    if (sig.cancelled) return;
    setter(text.slice(0, i));
    await sleep(65 + Math.random() * 75);
  }
}

// ─── Mock application factory ─────────────────────────────────────────────────

const NOW = new Date().toISOString();
const IN5DAYS = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

function makeApp(overrides: Partial<Application> & { id: string; company: string; role: string; status: PipelineStage }): Application {
  return {
    user_id: 'demo', location: '', category: 'Engineering' as Category,
    deadline: null, job_link: '', notes: '', recruiter_name: '', recruiter_email: '',
    created_at: NOW, updated_at: NOW,
    ...overrides,
  };
}

const EN_APPS: Application[] = [
  makeApp({ id: 'google',    company: 'Google',    role: 'Software Engineer Intern',  status: 'Applied',                  category: 'Engineering' }),
  makeApp({ id: 'meta',      company: 'Meta',      role: 'SWE Intern',               status: 'Applied',                  category: 'Engineering' }),
  makeApp({ id: 'stripe',    company: 'Stripe',    role: 'Product Manager Intern',   status: 'Wishlist',                 category: 'Product Management' }),
  makeApp({ id: 'airbnb',    company: 'Airbnb',    role: 'Design Intern',            status: 'OA / Online Assessment',   category: 'Design',           deadline: IN5DAYS }),
  makeApp({ id: 'anthropic', company: 'Anthropic', role: 'Research Intern',          status: 'Phone / Recruiter Screen', category: 'Engineering' }),
  makeApp({ id: 'apple',     company: 'Apple',     role: 'Software Engineer Intern', status: 'Applied',                  category: 'Engineering' }),
];

const JP_APPS: Application[] = [
  makeApp({ id: 'recruit',  company: 'リクルート', role: 'ソフトウェアエンジニア インターン', status: 'Applied',                  category: 'Engineering' }),
  makeApp({ id: 'mercari',  company: 'メルカリ',   role: 'エンジニア インターン',           status: 'Applied',                  category: 'Engineering' }),
  makeApp({ id: 'sony',     company: 'ソニー',     role: 'プロダクトマネージャー インターン', status: 'Wishlist',                 category: 'Product Management' }),
  makeApp({ id: 'dena',     company: 'DeNA',      role: 'デザイナー インターン',           status: 'OA / Online Assessment',   category: 'Design',           deadline: IN5DAYS }),
  makeApp({ id: 'line',     company: 'LINE',      role: 'リサーチ インターン',            status: 'Phone / Recruiter Screen', category: 'Engineering' }),
  makeApp({ id: 'rakuten',  company: '楽天',       role: 'ソフトウェアエンジニア インターン', status: 'Applied',                  category: 'Engineering' }),
];

const DISPLAY_STAGES: PipelineStage[] = [
  'Wishlist', 'Applied', 'OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews',
];

// ─── Static Pipeline Column (no dnd-kit — demo only) ─────────────────────────

function DemoColumn({ stage, apps, highlightCardId }: {
  stage: PipelineStage; apps: Application[]; highlightCardId?: string | null;
}) {
  const color = STAGE_COLORS[stage] ?? '#6B7280';
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Exact header from PipelineView */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate" style={{ color: 'var(--muted-text)' }}>
          {stage}
        </span>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border"
          style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}>
          {apps.length}
        </span>
      </div>
      {/* Exact body from PipelineView */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pipeline-column rounded-lg p-1.5"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)', minHeight: 120 }}>
        {apps.length === 0
          ? <p className="text-center text-[12px] py-8" style={{ color: 'var(--text-tertiary)' }}>No applications yet</p>
          : apps.map(app => (
            <div key={app.id} style={{
              boxShadow: highlightCardId === app.id ? '0 0 0 2px var(--amber-warning)' : undefined,
              borderRadius: 8,
              animation: 'demoCardIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
            }}>
              <ApplicationCard application={app} onClick={() => {}} />
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Demo Add Modal (simplified — real one needs ExtensionStatusProvider) ────

function DemoAddModal({ fields, highlightSave }: {
  fields: { company: string; role: string; category: string; status: string; deadline: string };
  highlightSave: boolean;
}) {
  const showCaret = (val: string, max: number) => val.length > 0 && val.length < max;
  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: '100%', height: 36, borderRadius: 6,
    border: `1px solid ${filled ? 'var(--accent-blue)' : 'var(--border-gray)'}`,
    background: 'var(--background)', padding: '0 12px',
    display: 'flex', alignItems: 'center',
    fontSize: 13, color: 'var(--brand-navy)',
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      animation: 'bgFadeIn 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--card-bg)', border: '1px solid var(--border-gray)',
        borderRadius: '12px 12px 0 0', padding: '20px 20px 36px',
        animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-emphasis)', margin: '0 auto 18px' }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 16 }}>Log Application</p>

        {[{ label: 'Company', val: fields.company, max: 7 }, { label: 'Role', val: fields.role, max: 24 }].map(f => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted-text)', marginBottom: 5 }}>{f.label}</label>
            <div style={inputStyle(!!f.val)}>
              <span>{f.val}</span>
              {showCaret(f.val, f.max) && <span style={{ display: 'inline-block', width: 1.5, height: 14, background: 'var(--accent-blue)', marginLeft: 1, animation: 'blink 0.75s step-end infinite' }} />}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[{ label: 'Category', val: fields.category }, { label: 'Status', val: fields.status }].map(f => (
            <div key={f.label} style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted-text)', marginBottom: 5 }}>{f.label}</label>
              <div style={{ ...inputStyle(!!f.val), fontSize: 12, color: f.val ? 'var(--brand-navy)' : 'var(--text-tertiary)' }}>
                {f.val || 'Select…'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted-text)', marginBottom: 5 }}>Deadline</label>
          <div style={{ ...inputStyle(!!fields.deadline), fontSize: 12, color: fields.deadline ? 'var(--brand-navy)' : 'var(--text-tertiary)' }}>
            {fields.deadline || 'mm/dd/yyyy'}
          </div>
        </div>

        <button style={{
          width: '100%', height: 40, borderRadius: 8,
          background: 'var(--accent-blue)', color: '#fff', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          transform: highlightSave ? 'scale(0.98)' : undefined,
          boxShadow: highlightSave ? '0 0 0 3px rgba(59,130,246,0.35)' : undefined,
          transition: 'all 0.15s ease',
        }}>Save Application</button>
      </div>
    </div>
  );
}

// ─── Chrome Extension Mockup ──────────────────────────────────────────────────

function ChromeMockup({ stage }: { stage: 'hidden' | 'in' | 'tapping' | 'popup' | 'out' }) {
  if (stage === 'hidden') return null;
  const visible = stage === 'in' || stage === 'tapping' || stage === 'popup';
  const tapped  = stage === 'tapping' || stage === 'popup';
  const showPopup = stage === 'popup';

  return (
    <div style={{
      position: 'absolute', right: visible ? 24 : -520, top: '50%',
      transform: 'translateY(-50%)', width: 400,
      background: '#1E1E1E', borderRadius: 10, border: '1px solid #3A3A3C',
      boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      overflow: 'visible', zIndex: 600,
      transition: 'right 0.55s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Chrome title bar */}
      <div style={{ background: '#292929', borderRadius: '10px 10px 0 0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, height: 24, borderRadius: 12, background: '#3A3A3C', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#71717A' }}>🔒</span>
          <span style={{ fontSize: 10, color: '#A1A1AA' }}>linkedin.com/jobs/view/apple-software-engineer-intern</span>
        </div>
        {/* Toolbar icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative' }}>
          <div style={{ fontSize: 13, color: '#A1A1AA' }}>🧩</div>
          {/* Applyd icon */}
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: tapped ? '#60A5FA' : '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff',
            boxShadow: tapped ? '0 0 0 2px rgba(59,130,246,0.5), 0 0 12px rgba(59,130,246,0.4)' : undefined,
            animation: tapped ? 'extPulse 0.35s ease' : undefined,
            transition: 'background 0.2s, box-shadow 0.2s',
          }}>A</div>

          {/* Extension popup */}
          {showPopup && (
            <div style={{
              position: 'absolute', top: 30, right: 0, width: 230,
              background: 'var(--card-bg)', border: '1px solid var(--border-gray)',
              borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden', zIndex: 10,
              animation: 'popupIn 0.2s cubic-bezier(0.22,1,0.36,1)',
            }}>
              <div style={{ background: 'var(--surface-gray)', padding: '10px 12px', borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>A</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-navy)' }}>Applyd</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--green-success)' }}>● Job detected</span>
              </div>
              <div style={{ padding: '12px' }}>
                {[{ label: 'Company', val: 'Apple' }, { label: 'Role', val: 'Software Engineer Intern' }].map(f => (
                  <div key={f.label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted-text)', marginBottom: 3 }}>{f.label}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)',
                      background: 'var(--background)', borderRadius: 5, padding: '5px 8px',
                      border: '1px solid var(--accent-blue)',
                    }}>{f.val}</div>
                  </div>
                ))}
                <button style={{
                  width: '100%', height: 34, marginTop: 4, borderRadius: 7,
                  background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                }}>✓ Save to Applyd</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn job page */}
      <div style={{ background: '#111113', padding: '14px', borderRadius: '0 0 10px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #2C2C2E' }}>
          <div style={{ width: 20, height: 20, borderRadius: 3, background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>in</div>
          <div style={{ flex: 1, height: 18, background: '#2C2C2E', borderRadius: 9, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <span style={{ fontSize: 9, color: '#71717A' }}>Search</span>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 6 }}>Software Engineer Intern</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 5, background: '#2C2C2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🍎</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>Apple</div>
            <div style={{ fontSize: 11, color: '#A1A1AA' }}>Cupertino, CA · Internship · On-site</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#71717A', lineHeight: 1.6, marginBottom: 12 }}>
          Join Apple&apos;s world-class engineering teams. Work on innovative products used by over a billion people every day...
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 30, padding: '0 16px', borderRadius: 15, background: '#0A66C2', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>Apply</div>
          <div style={{ height: 30, padding: '0 16px', borderRadius: 15, border: '1px solid #3A3A3C', display: 'flex', alignItems: 'center', fontSize: 12, color: '#A1A1AA' }}>Save</div>
        </div>
      </div>
    </div>
  );
}

// ─── Demo cursor ──────────────────────────────────────────────────────────────

function DemoCursor({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, zIndex: 9000,
      width: 18, height: 18, borderRadius: '50%',
      background: 'rgba(59,130,246,0.9)', border: '2px solid rgba(255,255,255,0.95)',
      boxShadow: '0 2px 14px rgba(59,130,246,0.55)',
      transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'left 0.55s cubic-bezier(0.25,0.46,0.45,0.94), top 0.55s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease',
    }} />
  );
}

function Particles() {
  const pts = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    x: ((i * 6.3 + Math.sin(i * 1.2) * 14) % 100 + 100) % 100,
    y: ((i * 7.1 + Math.cos(i * 0.9) * 18) % 100 + 100) % 100,
    size: 1 + (i % 3) * 0.5,
    delay: (i * 0.4) % 5,
    dur: 7 + (i % 5) * 1.5,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: '#3B82F6', opacity: 0,
          animation: `particleFloat ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoScene({ variant }: { variant: 'full' | 'short' | 'extension' | 'japan' }) {
  const isJapan = variant === 'japan';
  const isShort = variant === 'short';
  const isExt   = variant === 'extension';

  const ALL_APPS     = isJapan ? JP_APPS : EN_APPS;
  const GREETING     = isJapan ? 'こんにちは、田中さん' : 'Hi, Alex 👋';
  const FIRST_COMPANY = isJapan ? 'リクルート' : 'Google';
  const FIRST_ROLE    = isJapan ? 'ソフトウェアエンジニア インターン' : 'Software Engineer Intern';
  const FIRST_CAT     = isJapan ? 'エンジニアリング' : 'Engineering';

  const PHASE_LIST = isShort ? [1, 2, 3] : isExt ? [1, 6] : [1, 2, 3, 4, 5, 6, 7, 8];

  // ── State ─────────────────────────────────────────────────────────────────
  const [apps,          setApps]          = useState<Application[]>([]);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [modalFields,   setModalFields]   = useState({ company: '', role: '', category: '', status: '', deadline: '' });
  const [highlightSave, setHighlightSave] = useState(false);
  const [cursorX,       setCursorX]       = useState(700);
  const [cursorY,       setCursorY]       = useState(40);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [highlightBtn,  setHighlightBtn]  = useState(false);
  const [movingCardId,  setMovingCardId]  = useState<string | null>(null);
  const [actNowPulse,   setActNowPulse]   = useState(false);
  const [highlightCard, setHighlightCard] = useState<string | null>(null);
  const [tooltipText,   setTooltipText]   = useState<string | null>(null);
  const [phoneStage,    setPhoneStage]    = useState<'hidden'|'in'|'tapping'|'popup'|'out'>('hidden');
  const [funnelVisible, setFunnelVisible] = useState(false);
  const [endSlate,      setEndSlate]      = useState(false);
  const [fadingOut,     setFadingOut]     = useState(false);
  const [paused,        setPaused]        = useState(false);
  const [running,       setRunning]       = useState(false);
  const [phase,         setPhase]         = useState(0);

  const pausedRef = useRef(false);
  const cancelRef = useRef({ cancelled: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Pause-aware sleep ─────────────────────────────────────────────────────
  const psleep = useCallback(async (ms: number) => {
    const chunk = 50; let elapsed = 0;
    while (elapsed < ms) {
      if (cancelRef.current.cancelled) throw new Error('cancelled');
      if (!pausedRef.current) elapsed += chunk;
      await sleep(chunk);
    }
  }, []);

  const moveCursor = useCallback(async (x: number, y: number, ms = 500) => {
    setCursorX(x); setCursorY(y); await psleep(ms);
  }, [psleep]);

  const resetState = useCallback(() => {
    setApps([]); setModalOpen(false);
    setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
    setHighlightSave(false); setCursorVisible(false); setHighlightBtn(false);
    setMovingCardId(null); setActNowPulse(false); setHighlightCard(null);
    setTooltipText(null); setPhoneStage('hidden'); setFunnelVisible(false);
    setEndSlate(false); setFadingOut(false); setPhase(0);
  }, []);

  // ── Sequence ──────────────────────────────────────────────────────────────
  const runSequence = useCallback(async () => {
    const sig = cancelRef.current;
    try {
      if (PHASE_LIST.includes(1)) { setPhase(1); await psleep(1400); }

      // Phase 2 — add first app via modal
      if (PHASE_LIST.includes(2)) {
        setPhase(2);
        setCursorVisible(true);
        await moveCursor(window.innerWidth - 110, 28, 700);
        setHighlightBtn(true);
        await psleep(350);
        setModalOpen(true); setHighlightBtn(false);
        await psleep(500);
        await typeInto(v => setModalFields(f => ({ ...f, company: v })), FIRST_COMPANY, sig);
        await psleep(220);
        await typeInto(v => setModalFields(f => ({ ...f, role: v })), FIRST_ROLE, sig);
        await psleep(200);
        setModalFields(f => ({ ...f, category: FIRST_CAT }));
        await psleep(280);
        setModalFields(f => ({ ...f, status: 'Applied' }));
        await psleep(220);
        const dl = new Date(Date.now() + 14 * 86400000);
        setModalFields(f => ({ ...f, deadline: `${dl.getMonth() + 1}/${dl.getDate()}/${dl.getFullYear()}` }));
        await psleep(320);
        await moveCursor(window.innerWidth / 2, window.innerHeight * 0.8, 380);
        setHighlightSave(true);
        await psleep(300);
        setHighlightSave(false); setModalOpen(false);
        setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
        await psleep(180);
        setApps([ALL_APPS[0]]);
        setCursorVisible(false);
        await psleep(900);
      }

      // Phase 3 — more apps appear
      if (PHASE_LIST.includes(3)) {
        setPhase(3);
        for (let i = 1; i <= 4; i++) {
          await psleep(440);
          setApps(prev => [...prev, ALL_APPS[i]]);
          if (i === 3) { setActNowPulse(true); setTimeout(() => setActNowPulse(false), 1800); }
        }
        await psleep(1200);
      }

      // Phase 4 — Meta card moves to OA
      if (PHASE_LIST.includes(4)) {
        setPhase(4);
        const movingId = ALL_APPS[1].id;
        setMovingCardId(movingId);
        await psleep(1000);
        setApps(prev => prev.map(a => a.id === movingId ? { ...a, status: 'OA / Online Assessment' as PipelineStage } : a));
        setMovingCardId(null);
        await psleep(1200);
      }

      // Phase 5 — deadline alert
      if (PHASE_LIST.includes(5)) {
        setPhase(5);
        setActNowPulse(true);
        await psleep(700);
        const dlCardId = ALL_APPS[3].id;
        setHighlightCard(dlCardId);
        await psleep(600);
        setTooltipText(`⚠ Deadline approaching — ${ALL_APPS[3].company}`);
        await psleep(2200);
        setTooltipText(null); setActNowPulse(false); setHighlightCard(null);
        await psleep(600);
      }

      // Phase 6 — Chrome extension moment
      if (PHASE_LIST.includes(6)) {
        setPhase(6);
        await psleep(300);
        setPhoneStage('in');   await psleep(1200);
        setPhoneStage('tapping'); await psleep(650);
        setPhoneStage('popup');   await psleep(2500);
        setPhoneStage('out');     await psleep(700);
        setPhoneStage('hidden');
        setApps(prev => [...prev, ALL_APPS[5]]);
        await psleep(1000);
      }

      // Phase 7 — funnel
      if (PHASE_LIST.includes(7)) {
        setPhase(7);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 600, behavior: 'smooth' });
        await psleep(600); setFunnelVisible(true); await psleep(2800);
      }

      // Phase 8 — end slate
      if (PHASE_LIST.includes(8)) {
        setPhase(8);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        await psleep(2000);
        setFadingOut(true); await psleep(700);
        setEndSlate(true);  await psleep(3200);
        setEndSlate(false); setFadingOut(false);
        await psleep(500);
      }

      await psleep(400); resetState(); await psleep(300); setRunning(false);
    } catch { /* cancelled */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const start = useCallback(() => {
    cancelRef.current.cancelled = true;
    cancelRef.current = { cancelled: false };
    resetState(); setRunning(true);
  }, [resetState]);

  useEffect(() => { if (running) runSequence(); }, [running, runSequence]);
  useEffect(() => { const t = setTimeout(() => start(), 600); return () => clearTimeout(t); }, [start]);
  useEffect(() => { if (!running && phase === 0) { const t = setTimeout(() => setRunning(true), 500); return () => clearTimeout(t); } }, [running, phase]);

  useEffect(() => {
    // Force dark mode on the HTML element for this page
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') start();
      if (e.key === 'p' || e.key === 'P') { pausedRef.current = !pausedRef.current; setPaused(p => !p); }
    };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [start]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const byStage = DISPLAY_STAGES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s);
    return acc;
  }, {} as Record<string, Application[]>);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes demoCardIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bgFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp    { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes blink      { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes extPulse   { 0%{transform:scale(1)} 50%{transform:scale(1.22)} 100%{transform:scale(1)} }
        @keyframes popupIn    { from{opacity:0;transform:scale(0.92) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes particleFloat { 0%,100%{opacity:0;transform:translateY(0)} 40%,60%{opacity:0.08} 50%{transform:translateY(-20px)} }
        @keyframes logoGlow   { 0%,100%{box-shadow:0 0 40px rgba(59,130,246,0.3)} 50%{box-shadow:0 0 70px rgba(59,130,246,0.65)} }
        @keyframes fadeBlack  { from{opacity:0} to{opacity:1} }
        html, body { background:#0A0A0A !important; margin:0 !important; padding:0 !important; overflow:hidden !important; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{
        width: '100vw', height: '100vh',
        background: 'var(--background)', overflow: 'hidden',
        fontFamily: "var(--font-geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        position: 'relative',
      }}>
        <Particles />

        <div ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Navbar — matches real dashboard */}
          <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--border-gray)',
            height: 56, padding: '0 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>A</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--muted-text)' }}>{GREETING}</span>
              <button
                style={{
                  height: 34, padding: '0 14px', borderRadius: 7,
                  background: highlightBtn ? 'var(--accent-blue-hover)' : 'var(--accent-blue)',
                  color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  boxShadow: highlightBtn ? '0 0 0 3px rgba(59,130,246,0.35)' : undefined,
                  transform: highlightBtn ? 'scale(1.04)' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >+ Add Application</button>
            </div>
          </nav>

          <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>

            {/* Real StatsBar */}
            <div style={{ marginBottom: 20 }} data-tutorial-id="stats-bar">
              <StatsBar applications={apps} />
            </div>

            {/* Pipeline — real ApplicationCard inside custom static column */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {DISPLAY_STAGES.map(stage => (
                <DemoColumn
                  key={stage}
                  stage={stage}
                  apps={byStage[stage] ?? []}
                  highlightCardId={highlightCard}
                />
              ))}
            </div>

            {/* Tooltip */}
            {tooltipText && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <div style={{
                  background: 'var(--amber-warning)', color: '#000',
                  fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 24,
                  boxShadow: '0 4px 24px rgba(251,191,36,0.4)',
                  animation: 'bgFadeIn 0.3s ease',
                }}>{tooltipText}</div>
              </div>
            )}

            {/* Real FunnelChart */}
            {(phase >= 7 || funnelVisible) && (
              <div style={{ opacity: funnelVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                <FunnelChart applications={apps} />
              </div>
            )}

            <div style={{ height: 80 }} />
          </div>
        </div>

        {/* Modal */}
        {modalOpen && <DemoAddModal fields={modalFields} highlightSave={highlightSave} />}

        {/* Chrome extension */}
        <ChromeMockup stage={phoneStage} />

        {/* Cursor */}
        <DemoCursor x={cursorX} y={cursorY} visible={cursorVisible} />

        {/* Fade to black */}
        {fadingOut && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--background)', zIndex: 700, animation: 'fadeBlack 0.8s ease both' }} />
        )}

        {/* End slate */}
        {endSlate && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 800, background: 'var(--background)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'bgFadeIn 0.3s ease',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: 'var(--accent-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 800, color: '#fff', marginBottom: 22,
              animation: 'logoGlow 2s ease-in-out infinite',
            }}>A</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.04em', marginBottom: 12 }}>Applyd</div>
            <div style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>useapplyd.com</div>
          </div>
        )}

        {/* Pause badge */}
        {paused && (
          <div style={{
            position: 'absolute', top: 66, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-gray)', borderRadius: 20, padding: '8px 22px',
            fontSize: 12, fontWeight: 600, color: 'var(--muted-text)', zIndex: 9000,
          }}>⏸ Paused — press P to resume</div>
        )}
      </div>
    </>
  );
}
