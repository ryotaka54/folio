'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from './Logo';

// ── Feature list ──────────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'Add in seconds',        desc: 'Log any application in under 30 seconds',   duration: 4800 },
  { title: 'Track your pipeline',   desc: 'Drag cards between stages as you progress', duration: 4800 },
  { title: 'Never miss a deadline', desc: 'Urgent deadlines surface automatically',     duration: 4200 },
  { title: 'See your funnel',       desc: 'Watch your recruiting funnel update live',   duration: 4200 },
  { title: 'Works on any device',   desc: 'Mobile-first design, always in sync',       duration: 3600 },
] as const;

function ani(name: string, dur: string, delay = '0s', extra = 'ease-out both') {
  return `${name} ${dur} ${delay} ${extra}`;
}

// ── Real design tokens ────────────────────────────────────────────────────────
// Sourced directly from src/lib/constants.ts and src/app/globals.css

// STAGE_COLORS from constants.ts — exact hex values
const SC: Record<string, string> = {
  'Wishlist':                '#8B5CF6',
  'Applied':                 '#4361EE',
  'OA / Online Assessment':  '#06B6D4',
  'Phone / Recruiter Screen':'#F59E0B',
  'Final Round Interviews':  '#EF4444',
  'Offer':                   '#1D9E75',
  'Rejected':                '#9CA3AF',
};

// UI accent (not a stage color — used for inputs, buttons)
const ACCENT = '#2563EB';

// Deadline badge styles — exact match from ApplicationCard.tsx
const deadlineBadge = {
  red:   { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
  amber: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' },
  muted: { background: 'var(--surface-gray)', color: 'var(--text-tertiary)', border: '1px solid var(--border-gray)' },
};

// ── Shared mini-components ────────────────────────────────────────────────────

// Real navbar — matches dashboard nav exactly (h-[52px], Logo, wordmark, Hi, ThemeToggle, Log out)
function MockNav() {
  return (
    <div style={{
      height: 38,
      borderBottom: '1px solid var(--border-gray)',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 8,
      flexShrink: 0,
    }}>
      <Logo size={20} variant="dark" />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 9, color: 'var(--muted-text)' }}>Hi, Alex</span>
      {/* ThemeToggle: p-2.5 rounded-xl border bg-surface-gray/50 */}
      <div style={{
        width: 24, height: 24,
        borderRadius: 8,
        border: '1px solid var(--border-gray)',
        background: 'var(--surface-gray)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted-text)' }}>
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
      <span style={{ fontSize: 9, color: 'var(--muted-text)' }}>Log out</span>
    </div>
  );
}

// Real StatsBar — matches exactly:
// grid-cols-4 gap-3, rounded-lg p-4, border border-border-gray, bg-card-bg
// Interviews: borderLeft 3px solid #16A34A  |  Act Now: borderLeft 3px solid #D97706
// Label: text-[11px] font-semibold uppercase tracking-[0.05em] muted-text
// Value: text-[28px] font-semibold letterSpacing -0.02em
// Subtext: text-[12px] text-tertiary
function MockStats({ anim = true }: { anim?: boolean }) {
  const stats = [
    { label: 'Total',         value: '24', subtext: '+6 this week',       accent: null as null | 'green' | 'amber', valColor: 'var(--brand-navy)' },
    { label: 'Response Rate', value: '38%', subtext: 'of apps replied',   accent: null,  valColor: 'var(--brand-navy)' },
    { label: 'Interviews',    value: '5',  subtext: "You're on a roll",   accent: 'green' as 'green', valColor: 'var(--green-success)' },
    { label: 'Act Now',       value: '3',  subtext: 'deadlines this week', accent: 'amber' as 'amber', valColor: 'var(--amber-warning)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          borderRadius: 8,
          padding: '8px 8px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderLeft: s.accent === 'green' ? '3px solid #16A34A' : s.accent === 'amber' ? '3px solid #D97706' : '1px solid var(--border-gray)',
          ...(anim ? { animation: ani('wt-fade-up', '0.2s', `${i * 0.07}s`) } : {}),
        }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--muted-text)', marginBottom: 4 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.valColor, marginBottom: 2 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>{s.subtext}</div>
        </div>
      ))}
    </div>
  );
}

// Real column header — matches PipelineView:
// flex items-center gap-2 mb-2 px-1
// dot: w-2 h-2 rounded-full
// label: text-[11px] font-semibold uppercase tracking-[0.08em] truncate muted-text
// count: ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border surface-gray text-tertiary border-gray
function ColHead({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, padding: '0 2px' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <span style={{
        fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: 'var(--muted-text)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 8, fontWeight: 500, padding: '1px 5px', borderRadius: 4,
        border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', color: 'var(--text-tertiary)', flexShrink: 0,
      }}>
        {count}
      </span>
    </div>
  );
}

// Real column body — matches PipelineView:
// rounded-lg p-1.5 space-y-1.5 bg-card-bg border border-border-gray
// on isOver: bg color08, border color40
function ColBody({ color, isOver, children, minH = 80 }: {
  color: string; isOver?: boolean; children?: React.ReactNode; minH?: number;
}) {
  return (
    <div style={{
      flex: 1, borderRadius: 8, padding: 5, display: 'flex', flexDirection: 'column' as const, gap: 5,
      background: isOver ? `${color}08` : 'var(--card-bg)',
      border: isOver ? `1px solid ${color}40` : '1px solid var(--border-gray)',
      minHeight: minH, position: 'relative', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// Real ApplicationCard at mini scale — matches exactly:
// bg-background border border-border-gray rounded-lg p-3
// Company: text-[14px] font-semibold color: brand-navy
// Role: text-[13px] color: muted-text mt-0.5
// Deadline badge: text-[11px] px-1.5 py-0.5 rounded font-medium ml-auto
function MiniCard({
  company, role, deadlineBadgeStyle, deadlineLabel, delayAnim, isDragged,
}: {
  company: string; role: string;
  deadlineBadgeStyle?: React.CSSProperties; deadlineLabel?: string;
  delayAnim?: string; isDragged?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--background)',
      border: '1px solid var(--border-gray)',
      borderRadius: 8,
      padding: '7px 9px',
      ...(isDragged
        ? { animation: ani('wt-drag-out', '0.5s', '1.2s', 'ease-in both'), position: 'relative', zIndex: 20 }
        : { animation: delayAnim }),
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-navy)', lineHeight: 1.3, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {company}
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted-text)', marginTop: 2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {role}
      </div>
      {deadlineBadgeStyle && deadlineLabel && (
        <div style={{ display: 'flex', marginTop: 5 }}>
          <span style={{
            fontSize: 8, fontWeight: 600, padding: '2px 5px', borderRadius: 4, marginLeft: 'auto',
            ...deadlineBadgeStyle,
          }}>
            {deadlineLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Panel 1: Add Application ──────────────────────────────────────────────────
// Matches real AddApplicationModal exactly:
// backdrop rgba(0,0,0,0.4) | modal: bg-card-bg border border-border-gray
// borderRadius '12px 12px 0 0' | drag handle | p-5 content
// inputCls: h-9 px-3 bg-background border border-border-gray rounded-md text-sm
// focused: border-accent-blue ring-2 ring-accent-blue/20
// button: w-full h-9 text-[14px] font-medium text-white rounded-md bg-accent-blue
function Panel1({ k }: { k: number }) {
  const inputBase: React.CSSProperties = {
    height: 30, padding: '0 10px', background: 'var(--background)',
    border: '1px solid var(--border-gray)', borderRadius: 6, fontSize: 10,
    color: 'var(--brand-navy)', display: 'flex', alignItems: 'center',
  };
  const inputActive: React.CSSProperties = {
    ...inputBase, border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 3px rgba(37,99,235,0.12)`,
  };

  return (
    <div key={k} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, animation: ani('wt-panel-in', '0.3s') }}>
      <MockNav />

      {/* Dashboard body behind modal */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Ghost stats (dimmed) */}
        <div style={{ padding: '10px 14px', opacity: 0.25, pointerEvents: 'none' }}>
          <MockStats anim={false} />
        </div>

        {/* Backdrop: rgba(0,0,0,0.4) */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 10 }} />

        {/* Modal */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: '12px 12px 0 0',
          animation: ani('wt-scale-in', '0.28s'),
        }}>
          {/* Drag handle: w-8 h-1 bg-border-gray rounded-full mx-auto mt-3 mb-1 */}
          <div style={{ width: 28, height: 4, background: 'var(--border-gray)', borderRadius: 2, margin: '9px auto 3px' }} />

          <div style={{ padding: '4px 16px 16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>Add Application</span>
              {/* X icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--muted-text)' }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>

            {/* Company */}
            <div style={{ marginBottom: 8, animation: ani('wt-fade-up', '0.2s', '0.15s') }}>
              <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--brand-navy)', marginBottom: 3 }}>
                Company <span style={{ color: '#EF4444', opacity: 0.6 }}>*</span>
              </div>
              <div style={{ ...inputActive, gap: 0 }}>
                <span style={{ animation: ani('wt-fade-up', '0.18s', '0.4s') }}>Google</span>
                <span style={{
                  display: 'inline-block', width: 1, height: 11,
                  background: ACCENT, marginLeft: 2,
                  animation: `wt-cursor-blink 0.7s step-end 0.4s 4, wt-fade-up 0s 1.2s both`,
                }} />
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 8, animation: ani('wt-fade-up', '0.2s', '1.05s') }}>
              <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--brand-navy)', marginBottom: 3 }}>
                Role <span style={{ color: '#EF4444', opacity: 0.6 }}>*</span>
              </div>
              <div style={{ ...inputActive, gap: 0 }}>
                <span style={{ animation: ani('wt-fade-up', '0.18s', '1.25s') }}>SWE Intern</span>
                <span style={{
                  display: 'inline-block', width: 1, height: 11,
                  background: ACCENT, marginLeft: 2,
                  animation: `wt-cursor-blink 0.7s step-end 1.25s 4`,
                }} />
              </div>
            </div>

            {/* Category + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, animation: ani('wt-fade-up', '0.2s', '2.0s') }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--brand-navy)', marginBottom: 3 }}>Category</div>
                <div style={{ ...inputBase, color: 'var(--muted-text)' }}>Engineering</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--brand-navy)', marginBottom: 3 }}>Status</div>
                <div style={{ ...inputBase, color: SC['Applied'], fontWeight: 600 }}>Applied</div>
              </div>
            </div>

            {/* Save button: h-9 rounded-md font-medium text-white bg-accent-blue */}
            <div style={{ animation: ani('wt-fade-up', '0.2s', '2.4s') }}>
              <div style={{
                height: 30, background: ACCENT, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 600,
                animation: ani('wt-btn-press', '0.25s', '3.4s', 'ease-in-out both'),
              }}>
                Save Application
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panel 2: Pipeline kanban ───────────────────────────────────────────────────
// Real INTERNSHIP_STAGES: Wishlist, Applied, OA / Online Assessment,
//   Phone / Recruiter Screen, Final Round Interviews, Offer (skip Rejected in demo)
// Real column: min-w-[192px] w-[192px] — scaled proportionally here
// Real drag: opacity 0.25, DragOverlay rotate(1.5deg) shadow
const P2_COLS = [
  {
    stage: 'Wishlist', color: SC['Wishlist'],
    cards: [
      { company: 'Stripe',  role: 'SWE Intern' },
      { company: 'Adobe',   role: 'PM Intern' },
    ],
  },
  {
    stage: 'Applied', color: SC['Applied'],
    cards: [
      { company: 'Google',  role: 'SWE Intern', isDragged: true },
      { company: 'Airbnb',  role: 'Design Intern' },
    ],
    adjustCount: -1,
  },
  {
    stage: 'OA / Online Assessment', color: SC['OA / Online Assessment'],
    cards: [{ company: 'Amazon', role: 'SDE Intern' }],
    dropTarget: true,
    willReceive: { company: 'Google', role: 'SWE Intern' },
  },
  {
    stage: 'Phone / Recruiter Screen', color: SC['Phone / Recruiter Screen'],
    cards: [{ company: 'Microsoft', role: 'SWE Intern' }],
  },
  {
    stage: 'Offer', color: SC['Offer'],
    cards: [{ company: 'Figma', role: 'Design Intern' }],
  },
];

function Panel2({ k }: { k: number }) {
  return (
    <div key={k} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, animation: ani('wt-panel-in', '0.3s') }}>
      <MockNav />
      <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ display: 'flex', gap: 7, flex: 1 }}>
          {P2_COLS.map((col, ci) => {
            const displayCount = col.cards.length + (col.adjustCount ?? 0) + (col.willReceive ? 1 : 0);
            return (
              <div key={col.stage} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0 }}>
                <ColHead label={col.stage} color={col.color} count={displayCount} />
                <ColBody color={col.color} isOver={col.dropTarget}>
                  {col.cards.map((card, cardI) => (
                    <MiniCard
                      key={card.company}
                      company={card.company}
                      role={card.role}
                      isDragged={(card as any).isDragged}
                      delayAnim={ani('wt-fade-up', '0.18s', `${ci * 0.06 + cardI * 0.05 + 0.1}s`)}
                    />
                  ))}
                  {/* Drop zone highlight */}
                  {col.dropTarget && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 8,
                      border: `2px solid ${col.color}`,
                      background: `${col.color}15`,
                      pointerEvents: 'none', opacity: 0,
                      animation: ani('wt-drop-glow', '0.55s', '1.6s', 'ease-out both'),
                    }} />
                  )}
                  {/* Incoming card after drag */}
                  {col.willReceive && (
                    <MiniCard
                      company={col.willReceive.company}
                      role={col.willReceive.role}
                      delayAnim={`wt-card-pop 0.3s 2.1s cubic-bezier(0.34,1.56,0.64,1) both`}
                    />
                  )}
                </ColBody>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Panel 3: Deadlines ────────────────────────────────────────────────────────
// Shows full dashboard: nav + stat cards + application cards with real badge styles
// Act Now stat card highlighted
function Panel3({ k }: { k: number }) {
  return (
    <div key={k} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, animation: ani('wt-panel-in', '0.3s') }}>
      <MockNav />
      <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column' as const, gap: 9, overflow: 'hidden' }}>
        <MockStats />
        {/* Application cards with real deadline badges */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {[
            { co: 'Amazon', role: 'SDE Intern',    badge: '2d left',   bs: deadlineBadge.amber, delay: '0.3s' },
            { co: 'Meta',   role: 'PM Intern',     badge: 'Overdue',   bs: deadlineBadge.red,   delay: '0.46s' },
            { co: 'Apple',  role: 'Design Intern', badge: 'Due today', bs: deadlineBadge.red,   delay: '0.62s' },
          ].map(({ co, role, badge, bs, delay }) => (
            <div
              key={co}
              style={{
                background: 'var(--background)', border: '1px solid var(--border-gray)', borderRadius: 8,
                padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                animation: ani('wt-fade-up', '0.2s', delay),
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-navy)', lineHeight: 1.3 }}>{co}</div>
                <div style={{ fontSize: 9, color: 'var(--muted-text)', marginTop: 2 }}>{role}</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 4,
                ...(badge === 'Overdue' || badge === 'Due today'
                  ? { ...bs, animation: ani('wt-badge-pulse', '1.4s', delay, 'ease-in-out infinite') }
                  : bs),
              }}>
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel 4: Pipeline Overview (FunnelChart) ──────────────────────────────────
// Matches real FunnelChart exactly:
// bg-card-bg border border-border-gray rounded-lg p-5
// bars: space-y-3, label w-20 text-right text-xs, track bg-surface-gray rounded-full h-5
// bar: rounded-full, count text-[10px] font-bold text-white inside pr-2
// per-stage counts (not cumulative)
const FUNNEL_BARS = [
  { label: 'Wishlist',   count: 8, color: SC['Wishlist']                  },
  { label: 'Applied',    count: 6, color: SC['Applied']                   },
  { label: 'Interviews', count: 3, color: SC['Phone / Recruiter Screen']  },
  { label: 'Offers',     count: 1, color: SC['Offer']                     },
];

function Panel4({ k, active }: { k: number; active: boolean }) {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (!active) { setRate(0); return; }
    let raf: number;
    let start: number | null = null;
    const target = 17, totalMs = 1200;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / totalMs, 1);
      setRate(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 1100);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [active, k]);

  const maxCount = Math.max(...FUNNEL_BARS.map(b => b.count), 1);

  return (
    <div key={k} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, animation: ani('wt-panel-in', '0.3s') }}>
      <MockNav />
      <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column' as const, gap: 9, overflow: 'hidden' }}>
        <MockStats />

        {/* FunnelChart — bg-card-bg border border-border-gray rounded-lg p-5 */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 8,
          padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' as const,
          animation: ani('wt-fade-up', '0.25s', '0.3s'),
        }}>
          {/* Header: flex items-center justify-between mb-5
              title text-[13px] font-semibold brand-navy
              badge text-[11px] font-semibold px-2 py-0.5 rounded border */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-navy)' }}>Pipeline Overview</span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, border: '1px solid',
              ...(rate > 0
                ? { background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }
                : { background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }),
            }}>
              {rate > 0 ? `${rate}% offer rate` : 'Keep applying'}
            </span>
          </div>

          {/* Bars: space-y-3
              label: text-xs font-medium text-muted-text w-20 text-right
              track: flex-1 bg-surface-gray rounded-full h-5
              bar fill: h-full rounded-full, count pr-2 text-[10px] font-bold text-white */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, flex: 1, justifyContent: 'center' }}>
            {FUNNEL_BARS.map(({ label, count, color }, i) => {
              const pct = Math.max((count / maxCount) * 100, count > 0 ? 4 : 0);
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 500, color: 'var(--muted-text)',
                    width: 58, textAlign: 'right' as const, flexShrink: 0,
                  }}>
                    {label}
                  </span>
                  {/* Track: bg-surface-gray rounded-full h-5 */}
                  <div style={{ flex: 1, background: 'var(--surface-gray)', borderRadius: 999, height: 18, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, background: color,
                      width: `${pct}%`, transformOrigin: 'left center',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                      animation: ani('wt-bar-grow', '0.5s', `${0.28 + i * 0.22}s`),
                    }}>
                      {count > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panel 5: Devices ──────────────────────────────────────────────────────────
// Desktop browser with real nav (Logo + wordmark), real stat cards with accents,
// real pipeline columns. Phone with real nav.
function Panel5({ k }: { k: number }) {
  return (
    <div key={k} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 14,
      animation: ani('wt-panel-in', '0.3s'),
    }}>
      {/* Desktop */}
      <div style={{
        width: 245, border: '1px solid var(--border-gray)', borderRadius: 8, overflow: 'hidden',
        background: 'var(--background)',
        animation: ani('wt-slide-left', '0.4s', '0.15s'), flexShrink: 0,
      }}>
        {/* Browser chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', background: 'var(--surface-gray)', borderBottom: '1px solid var(--border-gray)' }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => (
            <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
          ))}
          <div style={{ flex: 1, marginLeft: 6, height: 12, background: 'var(--background)', border: '1px solid var(--border-gray)', borderRadius: 4 }} />
        </div>
        {/* Nav: Logo + wordmark + right items */}
        <div style={{
          height: 28, background: 'var(--background)', borderBottom: '1px solid var(--border-gray)',
          display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5,
        }}>
          <Logo size={16} variant="dark" />
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
          <div style={{ flex: 1 }} />
          <div style={{ width: 18, height: 14, borderRadius: 4, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }} />
          <div style={{ width: 18, height: 9, borderRadius: 3, background: 'var(--surface-gray)' }} />
        </div>
        <div style={{ padding: 8 }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: 8 }}>
            {[
              { v: '24', a: null }, { v: '38%', a: null },
              { v: '5', a: 'green' }, { v: '3', a: 'amber' },
            ].map(({ v, a }, i) => (
              <div key={i} style={{
                borderRadius: 5, padding: '5px 5px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-gray)',
                borderLeft: a === 'green' ? '2px solid #16A34A' : a === 'amber' ? '2px solid #D97706' : undefined,
              }}>
                <div style={{ height: 4, background: 'var(--surface-gray)', borderRadius: 2, marginBottom: 3, width: '75%' }} />
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '-0.01em', color: a === 'green' ? '#16A34A' : a === 'amber' ? '#D97706' : 'var(--brand-navy)' }}>{v}</div>
                <div style={{ height: 3, background: 'var(--surface-gray)', borderRadius: 2, marginTop: 2, width: '90%' }} />
              </div>
            ))}
          </div>
          {/* Pipeline columns */}
          <div style={{ display: 'flex', gap: 4, height: 84 }}>
            {Object.entries(SC).slice(0, 5).map(([name, color]) => (
              <div key={name} style={{
                flex: 1, borderRadius: 5, padding: 4,
                background: 'var(--card-bg)', border: '1px solid var(--border-gray)',
                display: 'flex', flexDirection: 'column' as const, gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                  <div style={{ flex: 1, height: 4, background: 'var(--surface-gray)', borderRadius: 2 }} />
                </div>
                <div style={{ flex: 1, background: 'var(--background)', border: '1px solid var(--border-gray)', borderRadius: 3 }} />
                {name !== 'Offer' && (
                  <div style={{ height: 14, background: 'var(--background)', border: '1px solid var(--border-gray)', borderRadius: 3, opacity: 0.7 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phone */}
      <div style={{
        width: 78, height: 156,
        border: '2px solid var(--border-gray)', borderRadius: 20, overflow: 'hidden',
        background: 'var(--card-bg)',
        display: 'flex', flexDirection: 'column' as const,
        animation: ani('wt-slide-right', '0.4s', '0.4s'), flexShrink: 0,
      }}>
        <div style={{ height: 17, background: 'var(--background)', borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 3, borderRadius: 2, background: 'var(--border-gray)' }} />
        </div>
        <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column' as const, gap: 4, overflow: 'hidden' }}>
          {/* Mini nav */}
          <div style={{ height: 18, background: 'var(--background)', border: '1px solid var(--border-gray)', borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 5px', gap: 3 }}>
            <Logo size={11} variant="dark" />
            <div style={{ flex: 1, height: 4, background: 'var(--surface-gray)', borderRadius: 2 }} />
          </div>
          {/* Stats 2×2 with accents */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { a: null }, { a: null },
              { a: 'green' }, { a: 'amber' },
            ].map(({ a }, i) => (
              <div key={i} style={{
                height: 22, borderRadius: 4,
                background: 'var(--card-bg)', border: '1px solid var(--border-gray)',
                borderLeft: a === 'green' ? '2px solid #16A34A' : a === 'amber' ? '2px solid #D97706' : undefined,
              }} />
            ))}
          </div>
          {/* App card list */}
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 16, borderRadius: 4, background: 'var(--background)', border: '1px solid var(--border-gray)' }} />
          ))}
        </div>
        <div style={{ height: 15, background: 'var(--background)', borderTop: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 3, borderRadius: 2, background: 'var(--border-gray)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProductWalkthrough() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setAnimKey(k => k + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    timerRef.current = setTimeout(() => {
      setActive(a => (a + 1) % FEATURES.length);
      setAnimKey(k => k + 1);
    }, FEATURES[active].duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, animKey, reducedMotion]);

  const panels = [
    <Panel1 key={animKey} k={animKey} />,
    <Panel2 key={animKey} k={animKey} />,
    <Panel3 key={animKey} k={animKey} />,
    <Panel4 key={animKey} k={animKey} active={active === 3} />,
    <Panel5 key={animKey} k={animKey} />,
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>Product tour</p>
          <h2 className="text-[28px] md:text-[36px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            See how it works in 30 seconds
          </h2>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--muted-text)' }}>Everything you need. Nothing you don&apos;t.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
          {/* Mobile: horizontal pills */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {FEATURES.map((f, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-shrink-0 h-8 px-3 rounded-md text-[12px] font-medium border"
                style={{
                  background: i === active ? ACCENT : 'var(--surface-gray)',
                  color: i === active ? '#fff' : 'var(--muted-text)',
                  borderColor: i === active ? ACCENT : 'var(--border-gray)',
                }}
              >
                {f.title}
              </button>
            ))}
          </div>

          {/* Desktop: stacked feature tabs */}
          <div className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0 justify-center">
            {FEATURES.map((f, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="text-left rounded-lg px-4 py-3 relative overflow-hidden border"
                style={{
                  background: i === active ? `${ACCENT}08` : 'transparent',
                  borderColor: i === active ? `${ACCENT}30` : 'transparent',
                }}
              >
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: i === active ? ACCENT : 'var(--brand-navy)' }}>
                  {f.title}
                </div>
                <div className="text-[12px]" style={{ color: i === active ? `${ACCENT}99` : 'var(--muted-text)' }}>
                  {f.desc}
                </div>
                {i === active && !reducedMotion && (
                  <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden" style={{ background: 'var(--border-gray)' }}>
                    <div
                      key={`pb-${animKey}`}
                      className="h-full"
                      style={{ width: '0%', background: ACCENT, animation: `wt-progress ${f.duration}ms linear both` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mockup window */}
          <div className="flex-1 min-h-[340px] lg:min-h-[420px]">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border-gray)', background: 'var(--background)', minHeight: 340 }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                <div className="flex-1 mx-3 rounded px-3 py-0.5 text-[10px]" style={{ background: 'var(--background)', border: '1px solid var(--border-gray)', color: 'var(--text-tertiary)' }}>
                  useapplyd.com/dashboard
                </div>
              </div>
              <div className="relative overflow-hidden" style={{ height: 'calc(100% - 33px)', minHeight: 307 }}>
                {panels[active]}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile dots */}
        <div className="flex justify-center gap-2 mt-5 lg:hidden">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full"
              style={{ width: i === active ? 20 : 6, height: 6, background: i === active ? ACCENT : 'var(--border-gray)' }}
              aria-label={`Go to feature ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
