'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoCard {
  id: string;
  company: string;
  role: string;
  category: string;
  status: string;
  deadline?: string; // label
  deadlineDaysLeft?: number;
  categoryColor: string;
  statusColor: string;
}

interface SceneState {
  phase: number;
  cards: DemoCard[];
  totalApps: number;
  responseRate: number;
  interviews: number;
  actNow: number;
  modalOpen: boolean;
  modalFields: { company: string; role: string; category: string; status: string; deadline: string };
  cursorPos: { x: number; y: number };
  cursorVisible: boolean;
  highlightBtn: boolean;
  movingCardId: string | null;
  movingCardTarget: string | null;
  actNowPulse: boolean;
  airbnbPulse: boolean;
  tooltipVisible: boolean;
  phoneVisible: boolean;
  phoneStage: 'hidden' | 'in' | 'tapping' | 'popup' | 'out';
  funnelVisible: boolean;
  funnelBars: { label: string; count: number; color: string; pct: number }[];
  endSlate: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
  firstAppCelebrate: boolean;
}

interface Variant {
  label: string;
  totalDuration: number;
  phases: number[];   // which phases to run
  greeting: string;
  cards: DemoCard[];
}

// ─── Color palette (dark mode) ────────────────────────────────────────────────

const C = {
  bg: '#0A0A0A',
  card: '#1C1C1E',
  surface: '#1A1A1A',
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
  purple: '#A78BFA',
  cyan: '#22D3EE',
};

const STAGE_COLORS: Record<string, string> = {
  Wishlist: '#8B5CF6',
  Applied: '#3B82F6',
  'OA / Online Assessment': '#06B6D4',
  'Phone / Recruiter Screen': '#F59E0B',
  'Final Round Interviews': '#EF4444',
  Offer: '#10B981',
  Rejected: '#6B7280',
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const EN_CARDS: DemoCard[] = [
  { id: 'google',    company: 'Google',     role: 'Software Engineer Intern',  category: 'Engineering',        status: 'Applied',                    categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
  { id: 'meta',      company: 'Meta',       role: 'SWE Intern',               category: 'Engineering',        status: 'Applied',                    categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
  { id: 'stripe',    company: 'Stripe',     role: 'Product Manager Intern',   category: 'Product Management', status: 'Wishlist',                   categoryColor: '#8B5CF6', statusColor: STAGE_COLORS['Wishlist'] },
  { id: 'airbnb',    company: 'Airbnb',     role: 'Design Intern',            category: 'Design',             status: 'OA / Online Assessment',     deadline: '5d left', deadlineDaysLeft: 5, categoryColor: '#06B6D4', statusColor: STAGE_COLORS['OA / Online Assessment'] },
  { id: 'anthropic', company: 'Anthropic',  role: 'Research Intern',          category: 'Engineering',        status: 'Phone / Recruiter Screen',   categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Phone / Recruiter Screen'] },
  { id: 'apple',     company: 'Apple',      role: 'Software Engineer Intern', category: 'Engineering',        status: 'Applied',                    categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
];

const JP_CARDS: DemoCard[] = [
  { id: 'recruit',   company: 'リクルート',  role: 'ソフトウェアエンジニア インターン', category: 'エンジニアリング',   status: 'Applied',                  categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
  { id: 'mercari',   company: 'メルカリ',    role: 'エンジニア インターン',           category: 'エンジニアリング',   status: 'Applied',                  categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
  { id: 'sony',      company: 'ソニー',      role: 'プロダクトマネージャー インターン', category: 'プロダクト',        status: 'Wishlist',                 categoryColor: '#8B5CF6', statusColor: STAGE_COLORS['Wishlist'] },
  { id: 'dena',      company: 'DeNA',       role: 'デザイナー インターン',           category: 'デザイン',          status: 'OA / Online Assessment',   deadline: '5d left', deadlineDaysLeft: 5, categoryColor: '#06B6D4', statusColor: STAGE_COLORS['OA / Online Assessment'] },
  { id: 'line',      company: 'LINE',       role: 'リサーチ インターン',            category: 'エンジニアリング',   status: 'Phone / Recruiter Screen', categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Phone / Recruiter Screen'] },
  { id: 'rakuten',   company: '楽天',        role: 'ソフトウェアエンジニア インターン', category: 'エンジニアリング',   status: 'Applied',                  categoryColor: '#3B82F6', statusColor: STAGE_COLORS['Applied'] },
];

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS = ['Wishlist', 'Applied', 'OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function typeInto(
  setter: (v: string) => void,
  text: string,
  signal: { cancelled: boolean }
) {
  for (let i = 0; i <= text.length; i++) {
    if (signal.cancelled) return;
    setter(text.slice(0, i));
    const delay = 60 + Math.random() * 70;
    await sleep(delay);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, unit = '', pulse = false, color,
}: {
  label: string; value: number | string; unit?: string; pulse?: boolean; color?: string;
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${pulse ? C.amber : C.border}`,
      borderRadius: 12,
      padding: '14px 16px',
      flex: 1,
      minWidth: 0,
      boxShadow: pulse ? `0 0 0 3px ${C.amber}28` : undefined,
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? C.navy, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}{unit}
      </div>
    </div>
  );
}

function AppCard({
  card,
  moving = false,
  pulse = false,
}: {
  card: DemoCard;
  moving?: boolean;
  pulse?: boolean;
}) {
  return (
    <div style={{
      background: '#111113',
      border: `1px solid ${pulse ? C.amber : C.borderEmphasis}`,
      borderRadius: 10,
      padding: '10px 12px',
      width: '100%',
      boxShadow: moving ? `0 8px 24px rgba(0,0,0,0.5)` : pulse ? `0 0 0 2px ${C.amber}44` : undefined,
      transform: moving ? 'rotate(1.5deg) scale(1.03)' : undefined,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      animation: 'demoCardIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.3, marginBottom: 2 }}>{card.company}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{card.role}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5,
          background: `${card.categoryColor}20`, color: card.categoryColor,
        }}>{card.category}</span>
        {card.deadline && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, marginLeft: 'auto',
            background: (card.deadlineDaysLeft ?? 99) <= 3 ? '#FEF2F222' : '#FEF3C722',
            color: (card.deadlineDaysLeft ?? 99) <= 3 ? '#F87171' : C.amber,
            border: `1px solid ${(card.deadlineDaysLeft ?? 99) <= 3 ? '#F8717166' : C.amber + '66'}`,
            animation: pulse ? 'amberPulse 1.5s ease-in-out 2' : undefined,
          }}>{card.deadline}</span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  name,
  cards,
  movingCardId,
  pulseCardId,
  isTarget,
}: {
  name: string;
  cards: DemoCard[];
  movingCardId?: string | null;
  pulseCardId?: string | null;
  isTarget?: boolean;
}) {
  const color = STAGE_COLORS[name] ?? C.blue;
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: isTarget ? `${color}10` : C.surface,
      border: `1px solid ${isTarget ? color + '55' : C.border}`,
      borderRadius: 12,
      padding: '12px 10px',
      minHeight: 200,
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.02em' }}>{name}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600, minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 5, background: `${color}20`, color,
        }}>{cards.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.tertiary, fontSize: 11 }}>No applications yet</div>
        ) : (
          cards.map(card => (
            <AppCard
              key={card.id}
              card={card}
              moving={movingCardId === card.id}
              pulse={pulseCardId === card.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DemoCursor({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'rgba(59,130,246,0.85)',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 2px 12px rgba(59,130,246,0.5)',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'left 0.5s cubic-bezier(0.25,0.46,0.45,0.94), top 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease',
    }} />
  );
}

function AddModal({
  fields,
  highlightSave,
}: {
  fields: { company: string; role: string; category: string; status: string; deadline: string };
  highlightSave: boolean;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      animation: 'fadeInBg 0.2s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '16px 16px 0 0',
        padding: '24px 20px 36px',
        animation: 'slideUpModal 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.borderEmphasis, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 18 }}>Log Application</div>

        {[
          { label: 'Company', value: fields.company, placeholder: 'e.g. Google' },
          { label: 'Role', value: fields.role, placeholder: 'e.g. Software Engineer Intern' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
            <div style={{
              height: 38, borderRadius: 8, border: `1px solid ${f.value ? C.blue : C.border}`,
              background: C.surface, padding: '0 12px', display: 'flex', alignItems: 'center',
              fontSize: 13, color: C.navy, transition: 'border-color 0.2s',
            }}>
              {f.value}
              {f.value.length > 0 && f.value.length < (f.label === 'Company' ? 6 : 22) && (
                <span style={{ width: 1.5, height: 14, background: C.blue, marginLeft: 1, animation: 'blink 0.8s step-end infinite' }} />
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Category', value: fields.category },
            { label: 'Status', value: fields.status },
          ].map(f => (
            <div key={f.label} style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
              <div style={{
                height: 38, borderRadius: 8, border: `1px solid ${f.value ? C.blue : C.border}`,
                background: C.surface, padding: '0 12px', display: 'flex', alignItems: 'center',
                fontSize: 12, color: f.value ? C.navy : C.tertiary,
              }}>
                {f.value || 'Select…'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Deadline</label>
          <div style={{
            height: 38, borderRadius: 8, border: `1px solid ${fields.deadline ? C.blue : C.border}`,
            background: C.surface, padding: '0 12px', display: 'flex', alignItems: 'center',
            fontSize: 12, color: fields.deadline ? C.navy : C.tertiary,
          }}>
            {fields.deadline || 'mm/dd/yyyy'}
          </div>
        </div>

        <button style={{
          width: '100%', height: 44, borderRadius: 10,
          background: highlightSave ? C.blueHover : C.blue,
          color: '#fff', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          transform: highlightSave ? 'scale(0.98)' : 'scale(1)',
          boxShadow: highlightSave ? `0 0 0 3px ${C.blue}44` : undefined,
          transition: 'all 0.15s ease',
        }}>
          Save Application
        </button>
      </div>
    </div>
  );
}

function PhoneMockup({ stage }: { stage: 'hidden' | 'in' | 'tapping' | 'popup' | 'out' }) {
  if (stage === 'hidden') return null;
  const slideIn = stage === 'in' || stage === 'tapping' || stage === 'popup';
  const showPopup = stage === 'popup';

  return (
    <div style={{
      position: 'absolute', right: slideIn ? 20 : -320, top: '50%',
      transform: 'translateY(-50%)',
      width: 200, background: '#0D0D0F',
      borderRadius: 32, border: '2px solid #3A3A3C',
      boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      overflow: 'hidden', zIndex: 600,
      transition: 'right 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Dynamic island */}
      <div style={{ height: 44, background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 24, borderRadius: 12, background: '#000' }} />
      </div>

      {/* Browser chrome */}
      <div style={{ background: '#1C1C1E', padding: '6px 8px', borderBottom: `1px solid #2C2C2E`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 22, borderRadius: 6, background: '#2C2C2E', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: 9, color: '#71717A' }}>linkedin.com/jobs</span>
        </div>
        {/* Extension icon */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#fff',
          animation: stage === 'tapping' || stage === 'popup' ? 'extIconPulse 0.4s ease' : undefined,
          boxShadow: stage === 'tapping' || stage === 'popup' ? `0 0 0 2px ${C.blue}66` : undefined,
        }}>A</div>
      </div>

      {/* Job listing */}
      <div style={{ background: '#111113', padding: '10px 10px 6px', minHeight: 120 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: C.navy, marginBottom: 2 }}>Apple — Software Engineer Intern</div>
        <div style={{ fontSize: 7, color: C.muted, marginBottom: 6 }}>Cupertino, CA · Internship</div>
        <div style={{ fontSize: 7, color: C.tertiary, lineHeight: 1.5 }}>
          Join Apple&apos;s engineering team. Work on real products used by billions of people worldwide...
        </div>

        {/* Extension popup */}
        {showPopup && (
          <div style={{
            marginTop: 8, background: C.card, border: `1px solid ${C.blue}`, borderRadius: 8, padding: 8,
            animation: 'popupIn 0.25s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>A</div>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.navy }}>Applyd</span>
            </div>
            <div style={{ fontSize: 7, color: C.muted, marginBottom: 4 }}>Company detected:</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: C.navy, marginBottom: 2 }}>Apple</div>
            <div style={{ fontSize: 7, color: C.muted, marginBottom: 8 }}>Software Engineer Intern</div>
            <div style={{
              width: '100%', height: 22, borderRadius: 5, background: C.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 600, color: '#fff',
              animation: 'checkmarkIn 0.4s ease 0.3s both',
            }}>
              ✓ Saved to Applyd
            </div>
          </div>
        )}
      </div>

      {/* Home indicator */}
      <div style={{ height: 24, background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 4, borderRadius: 2, background: '#3A3A3C' }} />
      </div>
    </div>
  );
}

function FunnelBar({ label, count, color, pct, visible }: { label: string; count: number; color: string; pct: number; visible: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{visible ? count : 0}</div>
      <div style={{ width: '100%', height: 80, background: C.surface, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: visible ? `${pct}%` : '0%',
          background: color, borderRadius: '4px 4px 0 0',
          transition: 'height 0.8s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function EndSlate() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: C.bg, zIndex: 800,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeInBg 0.8s ease',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: C.blue,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16,
        boxShadow: `0 0 40px ${C.blue}44`,
        animation: 'logoGlow 2s ease-in-out infinite',
      }}>A</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: '-0.03em', marginBottom: 8 }}>Applyd</div>
      <div style={{ fontSize: 13, color: C.tertiary }}>useapplyd.com</div>
    </div>
  );
}

// Shimmer particles
function Particles() {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    x: (i * 6.25 + Math.sin(i * 1.3) * 15 + 50) % 100,
    y: (i * 7.5 + Math.cos(i * 0.9) * 20 + 50) % 100,
    size: 1 + (i % 3) * 0.5,
    delay: (i * 0.4) % 4,
    dur: 6 + (i % 4) * 2,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: C.blue,
          opacity: 0,
          animation: `particleFloat ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Main Scene Component ─────────────────────────────────────────────────────

export default function DemoScene({ variant }: { variant: 'full' | 'short' | 'extension' | 'japan' }) {
  const isJapan = variant === 'japan';
  const isShort = variant === 'short';
  const isExt = variant === 'extension';

  const CARDS = isJapan ? JP_CARDS : EN_CARDS;
  const GREETING = isJapan ? 'こんにちは、田中さん' : 'Hi, Alex 👋';
  const FIRST_COMPANY = isJapan ? 'リクルート' : 'Google';
  const FIRST_ROLE = isJapan ? 'ソフトウェアエンジニア インターン' : 'Software Engineer Intern';
  const FIRST_CAT = isJapan ? 'エンジニアリング' : 'Engineering';
  const EXT_COMPANY = isJapan ? '楽天' : 'Apple';
  const EXT_ROLE = isJapan ? 'ソフトウェアエンジニア インターン' : 'Software Engineer Intern';

  // Which phases to run for each variant
  const PHASE_LIST = isShort
    ? [1, 2, 3]
    : isExt
    ? [1, 6]
    : [1, 2, 3, 4, 5, 6, 7, 8];

  // ── State ──────────────────────────────────────────────────────────────────

  const [phase, setPhase] = useState(0);
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [interviews, setInterviews] = useState(0);
  const [actNow, setActNow] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFields, setModalFields] = useState({ company: '', role: '', category: '', status: '', deadline: '' });
  const [highlightSave, setHighlightSave] = useState(false);

  const [cursorX, setCursorX] = useState(540);
  const [cursorY, setCursorY] = useState(400);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [highlightBtn, setHighlightBtn] = useState(false);

  const [movingCardId, setMovingCardId] = useState<string | null>(null);
  const [movingCardTarget, setMovingCardTarget] = useState<string | null>(null);

  const [actNowPulse, setActNowPulse] = useState(false);
  const [deadlinePulse, setDeadlinePulse] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [phoneStage, setPhoneStage] = useState<'hidden' | 'in' | 'tapping' | 'popup' | 'out'>('hidden');

  const [funnelVisible, setFunnelVisible] = useState(false);
  const [endSlate, setEndSlate] = useState(false);
  const [screenFade, setScreenFade] = useState(false); // black overlay

  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);

  const [scale, setScale] = useState(1);

  const pausedRef = useRef(false);
  const cancelRef = useRef({ cancelled: false });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1080, window.innerHeight / 1920));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Pause-aware sleep ──────────────────────────────────────────────────────

  const psleep = useCallback(async (ms: number) => {
    const step = 50;
    let elapsed = 0;
    while (elapsed < ms) {
      if (cancelRef.current.cancelled) throw new Error('cancelled');
      if (!pausedRef.current) elapsed += step;
      await sleep(step);
    }
  }, []);

  // ── Move cursor helper ─────────────────────────────────────────────────────

  const moveCursor = useCallback(async (x: number, y: number, ms = 500) => {
    setCursorX(x); setCursorY(y);
    await psleep(ms);
  }, [psleep]);

  // ── Count-up helper ────────────────────────────────────────────────────────

  const countUp = useCallback((setter: (v: number) => void, from: number, to: number) => {
    const dur = 300;
    const steps = 12;
    const interval = dur / steps;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        setter(Math.round(from + (to - from) * (i / steps)));
      }, i * interval);
    }
  }, []);

  // ── Reset state ────────────────────────────────────────────────────────────

  const resetState = useCallback(() => {
    setPhase(0); setCards([]); setTotalApps(0); setResponseRate(0);
    setInterviews(0); setActNow(0); setModalOpen(false);
    setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
    setHighlightSave(false); setCursorX(540); setCursorY(400);
    setCursorVisible(false); setHighlightBtn(false);
    setMovingCardId(null); setMovingCardTarget(null);
    setActNowPulse(false); setDeadlinePulse(false); setTooltipVisible(false);
    setPhoneStage('hidden'); setFunnelVisible(false);
    setEndSlate(false); setScreenFade(false);
  }, []);

  // ── Main sequence ──────────────────────────────────────────────────────────

  const runSequence = useCallback(async () => {
    const sig = cancelRef.current;

    try {
      // ── Phase 1: Empty dashboard reveal ──────────────────────────────────
      if (PHASE_LIST.includes(1)) {
        setPhase(1);
        await psleep(1200);
      }

      // ── Phase 2: Add first application ───────────────────────────────────
      if (PHASE_LIST.includes(2)) {
        setPhase(2);
        // Show cursor, move to Add button
        setCursorVisible(true);
        await moveCursor(820, 120, 700);
        setHighlightBtn(true);
        await psleep(400);

        // Open modal
        setModalOpen(true);
        setHighlightBtn(false);
        await psleep(600);

        // Type company
        const setSig = (val: string) => setModalFields(f => ({ ...f, company: val }));
        await typeInto(setSig, FIRST_COMPANY, sig);
        await psleep(300);

        // Type role
        const setRole = (val: string) => setModalFields(f => ({ ...f, role: val }));
        await typeInto(setRole, FIRST_ROLE, sig);
        await psleep(200);

        // Select category
        setModalFields(f => ({ ...f, category: FIRST_CAT }));
        await psleep(300);

        // Select status
        setModalFields(f => ({ ...f, status: 'Applied' }));
        await psleep(250);

        // Deadline
        const today = new Date();
        const dl = new Date(today.getTime() + 14 * 86400000);
        const dlStr = `${dl.getMonth() + 1}/${dl.getDate()}/${dl.getFullYear()}`;
        setModalFields(f => ({ ...f, deadline: dlStr }));
        await psleep(400);

        // Move cursor to save
        await moveCursor(540, 820, 400);
        setHighlightSave(true);
        await psleep(350);

        // Save
        setHighlightSave(false);
        setModalOpen(false);
        setModalFields({ company: '', role: '', category: '', status: '', deadline: '' });
        await psleep(200);

        // Card appears
        setCards([CARDS[0]]);
        countUp(setTotalApps, 0, 1);
        setCursorVisible(false);
        await psleep(800);
      }

      // ── Phase 3: More applications ────────────────────────────────────────
      if (PHASE_LIST.includes(3)) {
        setPhase(3);
        const rest = CARDS.slice(1, 5);
        const statUpdates = [
          { total: 2, rr: 0,  iw: 0, an: 0 },
          { total: 3, rr: 0,  iw: 0, an: 0 },
          { total: 4, rr: 60, iw: 1, an: 1 },
          { total: 5, rr: 60, iw: 2, an: 1 },
        ];
        for (let i = 0; i < rest.length; i++) {
          await psleep(420);
          setCards(prev => [...prev, rest[i]]);
          const u = statUpdates[i];
          countUp(setTotalApps, i + 1, u.total);
          if (u.rr) countUp(setResponseRate, 0, u.rr);
          if (u.iw) countUp(setInterviews, i > 2 ? 1 : 0, u.iw);
          if (u.an && actNow === 0) { countUp(setActNow, 0, 1); setActNowPulse(true); setTimeout(() => setActNowPulse(false), 1800); }
        }
        await psleep(1200);
      }

      // ── Phase 4: Card moves columns ───────────────────────────────────────
      if (PHASE_LIST.includes(4)) {
        setPhase(4);
        const metaCard = CARDS[1]; // meta
        setMovingCardId(metaCard.id);
        setMovingCardTarget('OA / Online Assessment');
        await psleep(1000);
        // Actually move
        setCards(prev => prev.map(c =>
          c.id === metaCard.id ? { ...c, status: 'OA / Online Assessment' } : c
        ));
        setMovingCardId(null);
        setMovingCardTarget(null);
        countUp(setResponseRate, 60, 80);
        await psleep(1200);
      }

      // ── Phase 5: Deadline alert ───────────────────────────────────────────
      if (PHASE_LIST.includes(5)) {
        setPhase(5);
        setActNowPulse(true);
        await psleep(800);
        setDeadlinePulse(true);
        await psleep(700);
        setTooltipVisible(true);
        await psleep(2200);
        setTooltipVisible(false);
        setActNowPulse(false);
        setDeadlinePulse(false);
        await psleep(600);
      }

      // ── Phase 6: Extension moment ─────────────────────────────────────────
      if (PHASE_LIST.includes(6)) {
        setPhase(6);
        await psleep(400);
        setPhoneStage('in');
        await psleep(1200);
        setPhoneStage('tapping');
        await psleep(700);
        setPhoneStage('popup');
        await psleep(2400);
        setPhoneStage('out');
        await psleep(800);
        setPhoneStage('hidden');

        // Apple card appears
        const appleCard: DemoCard = {
          ...CARDS[5],
          company: EXT_COMPANY,
          role: EXT_ROLE,
        };
        setCards(prev => [...prev, appleCard]);
        countUp(setTotalApps, 5, 6);
        await psleep(1000);
      }

      // ── Phase 7: Pipeline overview ────────────────────────────────────────
      if (PHASE_LIST.includes(7)) {
        setPhase(7);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 600, behavior: 'smooth' });
        }
        await psleep(600);
        setFunnelVisible(true);
        await psleep(2500);
      }

      // ── Phase 8: Final reveal + end slate ─────────────────────────────────
      if (PHASE_LIST.includes(8)) {
        setPhase(8);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        await psleep(2000);
        // Fade to black
        setScreenFade(true);
        await psleep(800);
        setEndSlate(true);
        await psleep(3000);
        // Fade back
        setEndSlate(false);
        setScreenFade(false);
        await psleep(600);
      }

      // Loop
      await psleep(300);
      resetState();
      await psleep(200);
      setRunning(false);

    } catch {
      // cancelled — do nothing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  // ── Start / Restart ────────────────────────────────────────────────────────

  const start = useCallback(() => {
    cancelRef.current.cancelled = true;
    cancelRef.current = { cancelled: false };
    resetState();
    setRunning(true);
  }, [resetState]);

  useEffect(() => {
    if (running) {
      runSequence();
    }
  }, [running, runSequence]);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => start(), 500);
    return () => clearTimeout(t);
  }, [start]);

  // Re-run after reset
  useEffect(() => {
    if (!running && phase === 0) {
      const t = setTimeout(() => setRunning(true), 400);
      return () => clearTimeout(t);
    }
  }, [running, phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') { start(); }
      if (e.key === 'p' || e.key === 'P') {
        pausedRef.current = !pausedRef.current;
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [start]);

  // ── Derived: cards per column ──────────────────────────────────────────────

  const cardsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = cards.filter(c => c.status === col);
    return acc;
  }, {} as Record<string, DemoCard[]>);

  const deadlineCard = cards.find(c => c.id === 'airbnb' || c.id === 'dena');

  // ── Funnel data ────────────────────────────────────────────────────────────

  const funnelBars = [
    { label: 'Wishlist',   count: cardsByColumn['Wishlist']?.length ?? 0,                    color: STAGE_COLORS['Wishlist'],                    pct: 20 },
    { label: 'Applied',    count: cardsByColumn['Applied']?.length ?? 0,                     color: STAGE_COLORS['Applied'],                     pct: 55 },
    { label: 'OA / Screen', count: (cardsByColumn['OA / Online Assessment']?.length ?? 0),   color: STAGE_COLORS['OA / Online Assessment'],      pct: 35 },
    { label: 'Phone',      count: cardsByColumn['Phone / Recruiter Screen']?.length ?? 0,    color: STAGE_COLORS['Phone / Recruiter Screen'],    pct: 25 },
    { label: 'Final',      count: cardsByColumn['Final Round Interviews']?.length ?? 0,      color: STAGE_COLORS['Final Round Interviews'],      pct: 10 },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Global demo styles */}
      <style>{`
        @keyframes demoCardIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        @keyframes amberPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
          50% { box-shadow: 0 0 0 4px rgba(251,191,36,0.35); }
        }
        @keyframes extIconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.9) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes checkmarkIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes particleFloat {
          0%,100% { opacity: 0; transform: translateY(0) scale(1); }
          30%,70% { opacity: 0.12; }
          50% { opacity: 0.06; transform: translateY(-20px) scale(1.2); }
        }
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 0 40px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 60px rgba(59,130,246,0.6); }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Outer wrapper — forces 1080×1920 */}
      <div style={{
        width: '100vw', height: '100vh',
        background: C.bg, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* 1080×1920 canvas, scaled to fit viewport */}
        <div style={{
          width: 1080, height: 1920,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          overflow: 'hidden',
          background: C.bg,
        }}>
          <Particles />

          {/* Scrollable content */}
          <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Navbar */}
            <nav style={{
              position: 'sticky', top: 0, zIndex: 100,
              background: `${C.bg}f0`, backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${C.border}`,
              padding: '0 32px',
              height: 64,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>A</div>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, letterSpacing: '-0.02em' }}>Applyd</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: C.muted }}>{GREETING}</span>
                <button
                  style={{
                    height: 36, padding: '0 16px', borderRadius: 8,
                    background: highlightBtn ? C.blueHover : C.blue,
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    boxShadow: highlightBtn ? `0 0 0 3px ${C.blue}44` : undefined,
                    transform: highlightBtn ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  + Add Application
                </button>
              </div>
            </nav>

            {/* Main content */}
            <div style={{ padding: '28px 32px', maxWidth: 1080 }}>
              {/* Stat cards */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
                <StatCard label="Total Apps" value={totalApps} />
                <StatCard label="Response Rate" value={responseRate} unit="%" />
                <StatCard label="Interviews" value={interviews} color={interviews > 0 ? C.green : undefined} />
                <StatCard label="Act Now" value={actNow} pulse={actNowPulse} color={actNow > 0 ? C.amber : undefined} />
              </div>

              {/* Kanban board */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {COLUMNS.map(col => (
                  <KanbanColumn
                    key={col}
                    name={col}
                    cards={cardsByColumn[col] ?? []}
                    movingCardId={movingCardId}
                    pulseCardId={deadlinePulse && deadlineCard ? deadlineCard.id : null}
                    isTarget={movingCardTarget === col}
                  />
                ))}
              </div>

              {/* Deadline tooltip */}
              {tooltipVisible && deadlineCard && (
                <div style={{
                  position: 'sticky', bottom: 40,
                  display: 'flex', justifyContent: 'center',
                  animation: 'tooltipIn 0.3s ease',
                  zIndex: 200,
                  marginTop: 16,
                }}>
                  <div style={{
                    background: C.amber,
                    color: '#000',
                    fontSize: 13, fontWeight: 600,
                    padding: '8px 18px', borderRadius: 20,
                    boxShadow: `0 4px 20px ${C.amber}44`,
                  }}>
                    ⚠ Deadline approaching — {deadlineCard.company}
                  </div>
                </div>
              )}

              {/* Pipeline funnel */}
              {(phase >= 7 || funnelVisible) && (
                <div style={{
                  marginTop: 32, background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: '24px 28px',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 20, letterSpacing: '-0.01em' }}>
                    Application Funnel
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    {funnelBars.map(b => (
                      <FunnelBar
                        key={b.label}
                        label={b.label}
                        count={b.count}
                        color={b.color}
                        pct={b.pct}
                        visible={funnelVisible}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: C.green,
                      background: `${C.green}18`, padding: '4px 10px', borderRadius: 20,
                    }}>
                      {responseRate}% response rate
                    </div>
                  </div>
                </div>
              )}

              <div style={{ height: 120 }} />
            </div>
          </div>

          {/* Modal */}
          {modalOpen && <AddModal fields={modalFields} highlightSave={highlightSave} />}

          {/* Phone mockup */}
          <PhoneMockup stage={phoneStage} />

          {/* Cursor */}
          <DemoCursor x={cursorX} y={cursorY} visible={cursorVisible} />

          {/* Fade overlay */}
          {screenFade && (
            <div style={{
              position: 'absolute', inset: 0, background: C.bg, zIndex: 700,
              animation: 'fadeInBg 0.8s ease both',
            }} />
          )}

          {/* End slate */}
          {endSlate && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 800,
              background: C.bg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeInBg 0.4s ease',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18, background: C.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: '#fff',
                boxShadow: `0 0 60px ${C.blue}44`,
                animation: 'logoGlow 2s ease-in-out infinite',
                marginBottom: 20,
              }}>A</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, letterSpacing: '-0.04em', marginBottom: 12 }}>Applyd</div>
              <div style={{ fontSize: 18, color: C.tertiary, letterSpacing: '0.01em' }}>useapplyd.com</div>
            </div>
          )}

          {/* Pause indicator */}
          {paused && (
            <div style={{
              position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              border: `1px solid ${C.border}`,
              borderRadius: 20, padding: '8px 20px',
              fontSize: 12, fontWeight: 600, color: C.muted,
              zIndex: 9000,
            }}>⏸ Paused — press P to resume</div>
          )}
        </div>
      </div>
    </>
  );
}
