'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const FEATURES = [
  { title: 'Add in seconds',        desc: 'Log any application in under 30 seconds', duration: 4000 },
  { title: 'Track your pipeline',   desc: 'Drag cards between stages as you progress', duration: 4000 },
  { title: 'Never miss a deadline', desc: 'Urgent deadlines surface automatically', duration: 3500 },
  { title: 'See your funnel',       desc: 'Watch your recruiting funnel update live', duration: 3500 },
  { title: 'Works on any device',   desc: 'Mobile-first design, always in sync', duration: 3000 },
] as const;

function ani(name: string, dur: string, delay = '0s', extra = 'ease-out both') {
  return `${name} ${dur} ${delay} ${extra}`;
}

// ── Shared design tokens ──────────────────────────────────────────────────────
const BLUE = '#2563EB';
const STAGE_COLORS: Record<string, string> = {
  'Wishlist':  '#8B5CF6',
  'Applied':   '#2563EB',
  'OA':        '#06B6D4',
  'Interviews':'#F59E0B',
  'Offer':     '#16A34A',
};

// ── Panel 1: Add Application ──────────────────────────────────────────────────
// Mirrors the real AddApplicationModal: rounded-lg bottom sheet, h-9 inputs,
// 13px labels in brand-navy, rounded-md button
function Panel1({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex flex-col items-end justify-end p-3 overflow-hidden">
      {/* Ghost pipeline bg */}
      <div className="absolute inset-0 flex gap-2 p-3 pointer-events-none" style={{ opacity: 0.06 }}>
        {Object.entries(STAGE_COLORS).map(([, c], i) => (
          <div key={i} className="flex-1 rounded-lg" style={{ background: c + '20', border: `1px solid ${c}` }}>
            <div className="m-1.5 h-7 rounded-md" style={{ background: c }} />
            {i < 3 && <div className="m-1.5 mt-1 h-7 rounded-md" style={{ background: c + '80' }} />}
          </div>
        ))}
      </div>

      {/* Modal — bottom sheet style matching real AddApplicationModal */}
      <div
        className="relative z-10 w-full"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: '12px 12px 0 0',
          animation: ani('wt-scale-in', '0.3s'),
        }}
      >
        {/* Drag handle */}
        <div className="w-6 h-1 rounded-full mx-auto mt-2.5 mb-1" style={{ background: 'var(--border-gray)' }} />

        <div className="px-4 pb-4 pt-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>Add Application</span>
            <div className="w-4 h-4 rounded" style={{ background: 'var(--surface-gray)' }} />
          </div>

          <div className="space-y-2.5">
            {/* Company */}
            <div style={{ animation: ani('wt-fade-up', '0.22s', '0.2s') }}>
              <div className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--brand-navy)' }}>
                Company <span style={{ color: '#EF4444', opacity: 0.7 }}>*</span>
              </div>
              <div className="h-7 px-2 rounded-md border flex items-center gap-0.5 text-[10px] font-semibold" style={{ background: 'var(--background)', borderColor: BLUE, color: 'var(--brand-navy)' }}>
                <span style={{ animation: ani('wt-fade-up', '0.18s', '0.5s') }}>Google</span>
                <span className="inline-block w-px h-3 ml-0.5" style={{ background: BLUE, animation: `wt-cursor-blink 0.7s step-end 0.5s 4, wt-fade-up 0s 1.4s both` }} />
              </div>
            </div>

            {/* Role */}
            <div style={{ animation: ani('wt-fade-up', '0.22s', '1.1s') }}>
              <div className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--brand-navy)' }}>
                Role <span style={{ color: '#EF4444', opacity: 0.7 }}>*</span>
              </div>
              <div className="h-7 px-2 rounded-md border flex items-center gap-0.5 text-[10px] font-semibold" style={{ background: 'var(--background)', borderColor: BLUE, color: 'var(--brand-navy)' }}>
                <span style={{ animation: ani('wt-fade-up', '0.18s', '1.3s') }}>SWE Intern</span>
                <span className="inline-block w-px h-3 ml-0.5" style={{ background: BLUE, animation: `wt-cursor-blink 0.7s step-end 1.3s 4` }} />
              </div>
            </div>

            {/* Category + Status row */}
            <div className="grid grid-cols-2 gap-2" style={{ animation: ani('wt-fade-up', '0.22s', '2.1s') }}>
              <div>
                <div className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--brand-navy)' }}>Category</div>
                <div className="h-7 px-2 rounded-md border text-[10px] flex items-center" style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}>Tech</div>
              </div>
              <div>
                <div className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--brand-navy)' }}>Status</div>
                <div className="h-7 px-2 rounded-md border text-[10px] font-semibold flex items-center" style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', color: BLUE }}>Applied</div>
              </div>
            </div>

            {/* Save button */}
            <div style={{ animation: ani('wt-fade-up', '0.22s', '2.5s') }}>
              <button
                className="w-full h-7 rounded-md text-white text-[10px] font-semibold"
                style={{ background: BLUE, animation: ani('wt-btn-press', '0.25s', '3.2s', 'ease-in-out both') }}
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New card popping into pipeline */}
      <div
        className="absolute top-4 left-[72px] rounded-lg p-2"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border-gray)',
          width: 110,
          animation: ani('wt-card-pop', '0.32s', '3.5s', 'cubic-bezier(0.34,1.56,0.64,1) both'),
        }}
      >
        <div className="text-[10px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Google</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'var(--muted-text)' }}>SWE Intern</div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${BLUE}12`, color: BLUE }}>Applied</span>
        </div>
      </div>
    </div>
  );
}

// ── Panel 2: Pipeline ─────────────────────────────────────────────────────────
// Mirrors real PipelineView: 11px uppercase tracking-[0.08em] headers,
// count pill with border, flat bg-card-bg column containers
const COLS = [
  { label: 'Wishlist',   color: STAGE_COLORS['Wishlist'],    cards: ['Stripe', 'Adobe'] },
  { label: 'Applied',    color: STAGE_COLORS['Applied'],     cards: ['Google', 'Airbnb'] },
  { label: 'OA',         color: STAGE_COLORS['OA'],          cards: ['Amazon'] },
  { label: 'Interviews', color: STAGE_COLORS['Interviews'],  cards: ['Microsoft'] },
  { label: 'Offer',      color: STAGE_COLORS['Offer'],       cards: ['Figma'] },
];

function Panel2({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex p-3 gap-2 overflow-hidden" style={{ animation: ani('wt-panel-in', '0.3s') }}>
      {COLS.map((col, ci) => (
        <div key={col.label} className="flex flex-col flex-1 min-w-0">
          {/* Column header — matches real PipelineView */}
          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
            <span
              className="text-[7px] font-semibold uppercase truncate flex-1"
              style={{ color: 'var(--muted-text)', letterSpacing: '0.08em' }}
            >
              {col.label}
            </span>
            <span
              className="text-[7px] font-medium px-1 py-0.5 rounded border flex-shrink-0"
              style={{ background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}
            >
              {ci === 1 ? col.cards.length - 1 : col.cards.length}
            </span>
          </div>

          {/* Column body */}
          <div
            className="flex-1 rounded-lg p-1 space-y-1 relative overflow-visible"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-gray)',
              minHeight: 60,
            }}
          >
            {col.cards.map((card, cardI) => {
              const isDragged = ci === 1 && cardI === 0;
              return (
                <div
                  key={card}
                  className="rounded-md p-1.5 text-[9px] font-semibold"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border-gray)',
                    color: 'var(--brand-navy)',
                    ...(isDragged
                      ? { animation: ani('wt-drag-out', '0.5s', '1s', 'ease-in both'), position: 'relative', zIndex: 20 }
                      : { animation: ani('wt-fade-up', '0.2s', `${ci * 0.07 + cardI * 0.05 + 0.1}s`) }),
                  }}
                >
                  {card}
                </div>
              );
            })}

            {/* Drop glow on OA column */}
            {ci === 2 && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  border: `2px solid ${col.color}`,
                  background: `${col.color}18`,
                  opacity: 0,
                  animation: ani('wt-drop-glow', '0.6s', '1.4s', 'ease-out both'),
                }}
              />
            )}
            {/* Card landing in OA after drag */}
            {ci === 2 && (
              <div
                className="rounded-md p-1.5 text-[9px] font-semibold"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border-gray)',
                  color: 'var(--brand-navy)',
                  opacity: 0,
                  animation: ani('wt-card-pop', '0.3s', '1.9s', 'cubic-bezier(0.34,1.56,0.64,1) both'),
                }}
              >
                Google
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Panel 3: Deadlines ────────────────────────────────────────────────────────
// Mirrors real StatsBar (left-border accents, 11px uppercase, 28px values)
// and ApplicationCard (flat border, rounded badge not rounded-full)
function Panel3({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex flex-col p-3 gap-2.5" style={{ animation: ani('wt-panel-in', '0.3s') }}>
      {/* Stat cards — match real StatsBar */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Total',     val: '18', accent: null,    color: 'var(--brand-navy)' },
          { label: 'Resp. Rate',val: '38%', accent: null,   color: 'var(--brand-navy)' },
          { label: 'Interviews',val: '4',  accent: 'green', color: 'var(--green-success)' },
          { label: 'Act Now',   val: '2',  accent: 'amber', color: 'var(--amber-warning)' },
        ].map(({ label, val, accent, color }, i) => (
          <div
            key={label}
            className="rounded-lg p-1.5 border"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-gray)',
              borderLeft: accent === 'green' ? '2px solid #16A34A' : accent === 'amber' ? '2px solid #D97706' : undefined,
              animation: ani('wt-fade-up', '0.22s', `${i * 0.07}s`),
            }}
          >
            <div className="text-[7px] font-semibold uppercase mb-0.5" style={{ color: 'var(--muted-text)', letterSpacing: '0.05em' }}>{label}</div>
            <div className="text-[14px] font-semibold leading-none" style={{ color, letterSpacing: '-0.02em' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Application cards — match real ApplicationCard */}
      <div className="space-y-1.5 flex-1">
        {[
          { co: 'Amazon', role: 'SDE Intern',    badge: '2d left',   red: false, delay: '0.28s' },
          { co: 'Meta',   role: 'PM Intern',     badge: 'Overdue',   red: true,  delay: '0.44s' },
          { co: 'Apple',  role: 'Design Intern', badge: 'Due today', red: true,  delay: '0.6s' },
        ].map(({ co, role, badge, red, delay }) => (
          <div
            key={co}
            className="rounded-lg p-2 flex items-center justify-between"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border-gray)',
              animation: ani('wt-fade-up', '0.22s', delay),
            }}
          >
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--brand-navy)' }}>{co}</div>
              <div className="text-[9px]" style={{ color: 'var(--muted-text)' }}>{role}</div>
            </div>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold border"
              style={red
                ? { color: '#991B1B', background: '#FEF2F2', borderColor: '#FECACA', animation: ani('wt-badge-pulse', '1.4s', delay, 'ease-in-out infinite') }
                : { color: '#92400E', background: '#FEF3C7', borderColor: '#FDE68A' }}
            >
              {badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 4: Pipeline Overview (Funnel) ───────────────────────────────────────
// Matches real FunnelChart: "Pipeline Overview" title, per-stage counts,
// flat border badge, h-5 bars inside bg-surface-gray track
const BARS = [
  { label: 'Wishlist',   pct: 100, color: STAGE_COLORS['Wishlist'],   count: 6,  delay: '0.28s' },
  { label: 'Applied',    pct: 67,  color: STAGE_COLORS['Applied'],    count: 4,  delay: '0.5s' },
  { label: 'Interviews', pct: 33,  color: STAGE_COLORS['Interviews'], count: 2,  delay: '0.72s' },
  { label: 'Offers',     pct: 17,  color: STAGE_COLORS['Offer'],      count: 1,  delay: '0.94s' },
];

function Panel4({ k, active }: { k: number; active: boolean }) {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (!active) { setRate(0); return; }
    let raf: number;
    let start: number | null = null;
    const target = 25, totalMs = 1400;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / totalMs, 1);
      setRate(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 1000);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [active, k]);

  return (
    <div key={k} className="absolute inset-0 flex flex-col p-4" style={{ animation: ani('wt-panel-in', '0.3s') }}>
      {/* Header — matches real FunnelChart */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Pipeline Overview</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded border"
          style={rate > 0
            ? { background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }
            : { background: 'var(--surface-gray)', color: 'var(--text-tertiary)', borderColor: 'var(--border-gray)' }}
        >
          {rate > 0 ? `${rate}% offer rate` : 'Keep applying'}
        </span>
      </div>

      {/* Bars — matches real FunnelChart row layout */}
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {BARS.map(({ label, pct, color, count, delay }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="text-[9px] font-medium w-14 text-right flex-shrink-0" style={{ color: 'var(--muted-text)' }}>{label}</span>
            <div className="flex-1 rounded-full h-4 overflow-hidden" style={{ background: 'var(--surface-gray)' }}>
              <div
                className="h-full rounded-full flex items-center justify-end pr-1.5"
                style={{
                  width: `${pct}%`,
                  background: color,
                  transformOrigin: 'left center',
                  animation: ani('wt-bar-grow', '0.5s', delay),
                }}
              >
                {count > 0 && (
                  <span className="text-[8px] font-bold text-white">{count}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 5: Any Device ───────────────────────────────────────────────────────
// Desktop mockup mirrors dashboard: 52px nav, stat cards with left-border
// accents, pipeline columns with flat card-bg style
function Panel5({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex items-center justify-center gap-4 p-4" style={{ animation: ani('wt-panel-in', '0.3s') }}>
      {/* Desktop */}
      <div
        className="border border-border-gray rounded-lg overflow-hidden"
        style={{ width: 210, background: 'var(--card-bg)', animation: ani('wt-slide-left', '0.4s', '0.15s') }}
      >
        {/* Nav bar — 52px equivalent scaled */}
        <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ height: 22, background: 'var(--background)', borderColor: 'var(--border-gray)' }}>
          <div className="w-4 h-4 rounded-[4px]" style={{ background: '#111827' }} />
          <div className="w-8 h-2 rounded" style={{ background: 'var(--surface-gray)' }} />
          <div className="ml-auto flex gap-1.5">
            <div className="w-5 h-2 rounded" style={{ background: 'var(--surface-gray)' }} />
            <div className="w-8 h-2 rounded" style={{ background: 'var(--surface-gray)' }} />
          </div>
        </div>
        <div className="p-2">
          {/* Stat cards with left-border accents */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[
              { v: '18', accent: null },
              { v: '38%', accent: null },
              { v: '4', accent: 'green' },
              { v: '2', accent: 'amber' },
            ].map(({ v, accent }, i) => (
              <div
                key={i}
                className="rounded-md p-1 border border-border-gray"
                style={{
                  background: 'var(--background)',
                  borderLeft: accent === 'green' ? '2px solid #16A34A' : accent === 'amber' ? '2px solid #D97706' : undefined,
                }}
              >
                <div className="w-full h-1 rounded mb-1" style={{ background: 'var(--surface-gray)' }} />
                <div
                  className="text-[8px] font-bold"
                  style={{ color: accent === 'green' ? '#16A34A' : accent === 'amber' ? '#D97706' : 'var(--brand-navy)' }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          {/* Pipeline */}
          <div className="flex gap-1" style={{ height: 72 }}>
            {Object.entries(STAGE_COLORS).map(([, c]) => (
              <div key={c} className="flex-1 rounded-md p-1 space-y-1 border border-border-gray" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-0.5 mb-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: c }} />
                </div>
                <div className="rounded h-6 border border-border-gray" style={{ background: 'var(--background)' }} />
                <div className="rounded h-4 border border-border-gray" style={{ background: 'var(--background)', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phone */}
      <div
        className="border-2 border-border-gray rounded-[18px] overflow-hidden flex flex-col"
        style={{ width: 70, height: 144, background: 'var(--card-bg)', animation: ani('wt-slide-right', '0.4s', '0.4s') }}
      >
        {/* Notch */}
        <div className="flex justify-center items-center border-b border-border-gray" style={{ height: 18, background: 'var(--background)' }}>
          <div className="w-7 h-1 rounded-full" style={{ background: 'var(--border-gray)' }} />
        </div>
        <div className="flex-1 p-1.5 space-y-1 overflow-hidden">
          {/* Mini stat grid */}
          <div className="grid grid-cols-2 gap-0.5 mb-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded h-4 border border-border-gray" style={{ background: 'var(--background)' }} />
            ))}
          </div>
          {/* App cards */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-md h-5 border border-border-gray" style={{ background: 'var(--background)' }} />
          ))}
        </div>
        <div className="flex justify-center pb-1.5 pt-1 border-t border-border-gray" style={{ background: 'var(--background)' }}>
          <div className="w-7 h-1 rounded-full" style={{ background: 'var(--border-gray)' }} />
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
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-blue)' }}>Product tour</p>
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
                className="flex-shrink-0 h-8 px-3 rounded-md text-[12px] font-medium border transition-colors"
                style={{
                  background: i === active ? BLUE : 'var(--surface-gray)',
                  color: i === active ? '#fff' : 'var(--muted-text)',
                  borderColor: i === active ? BLUE : 'var(--border-gray)',
                }}
              >
                {f.title}
              </button>
            ))}
          </div>

          {/* Desktop: stacked tabs */}
          <div className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0 justify-center">
            {FEATURES.map((f, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="text-left rounded-lg px-4 py-3 relative overflow-hidden border transition-colors"
                style={{
                  background: i === active ? `${BLUE}08` : 'transparent',
                  borderColor: i === active ? `${BLUE}30` : 'transparent',
                }}
              >
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: i === active ? BLUE : 'var(--brand-navy)' }}>
                  {f.title}
                </div>
                <div className="text-[12px]" style={{ color: i === active ? `${BLUE}99` : 'var(--muted-text)' }}>
                  {f.desc}
                </div>
                {i === active && !reducedMotion && (
                  <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden" style={{ background: 'var(--border-gray)' }}>
                    <div
                      key={`pb-${animKey}`}
                      className="h-full"
                      style={{ width: '0%', background: BLUE, animation: `wt-progress ${f.duration}ms linear both` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mockup window */}
          <div className="flex-1 min-h-[320px] lg:min-h-[360px]">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden"
              style={{
                border: '1px solid var(--border-gray)',
                background: 'var(--card-bg)',
                minHeight: 320,
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 border-b"
                style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                <div
                  className="flex-1 mx-3 rounded px-3 py-0.5 text-[10px]"
                  style={{ background: 'var(--background)', border: '1px solid var(--border-gray)', color: 'var(--text-tertiary)' }}
                >
                  useapplyd.com/dashboard
                </div>
              </div>

              <div className="relative" style={{ height: 'calc(100% - 33px)', minHeight: 287 }}>
                {panels[active]}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile progress dots */}
        <div className="flex justify-center gap-2 mt-5 lg:hidden">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all"
              style={{
                width: i === active ? 20 : 6,
                height: 6,
                background: i === active ? BLUE : 'var(--border-gray)',
              }}
              aria-label={`Go to feature ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
