'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Feature definitions ───────────────────────────────────────────────────────

const FEATURES = [
  { title: 'Add in seconds',        desc: 'Log any application in under 30 seconds', duration: 3800 },
  { title: 'Track your pipeline',   desc: 'Drag cards between stages as you progress', duration: 3800 },
  { title: 'Never miss a deadline', desc: 'Urgent deadlines surface automatically', duration: 3200 },
  { title: 'See your response rate',desc: 'Watch your recruiting funnel take shape', duration: 3500 },
  { title: 'Works on any device',   desc: 'Mobile-first design, always in sync', duration: 2800 },
] as const;

// ── Utility ───────────────────────────────────────────────────────────────────

function ani(name: string, dur: string, delay = '0s', extra = 'ease-out both') {
  return `${name} ${dur} ${delay} ${extra}`;
}

// ── Panel 1: Add Application ──────────────────────────────────────────────────

function Panel1({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex flex-col items-center justify-center p-5 overflow-hidden">
      {/* Ghost kanban bg */}
      <div className="absolute inset-4 flex gap-2 pointer-events-none" style={{ opacity: 0.07 }}>
        {['#8B5CF6','#4361EE','#06B6D4'].map((c, i) => (
          <div key={i} className="flex-1 rounded-xl" style={{ background: c + '30', border: `1px solid ${c}` }}>
            <div className="m-2 h-8 rounded-lg" style={{ background: c }} />
            {i < 2 && <div className="m-2 mt-1 h-8 rounded-lg" style={{ background: c + '90' }} />}
          </div>
        ))}
      </div>

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[230px] bg-card-bg rounded-2xl border border-border-gray shadow-xl p-4"
        style={{ animation: ani('wt-scale-in','0.3s') }}
      >
        <div className="text-xs font-semibold text-brand-navy mb-3">Add Application</div>
        <div className="space-y-2">

          {/* Company */}
          <div style={{ animation: ani('wt-fade-up','0.25s','0.2s') }}>
            <div className="text-[9px] font-medium text-muted-text mb-0.5">Company <span style={{ color:'#EF4444',opacity:.7 }}>*</span></div>
            <div className="px-2.5 py-1.5 rounded-lg bg-background border border-accent-blue/50 text-[11px] font-semibold text-brand-navy flex items-center gap-0.5">
              <span style={{ animation: ani('wt-fade-up','0.2s','0.5s') }}>Google</span>
              <span
                className="inline-block w-px h-3.5 bg-accent-blue"
                style={{ animation: `wt-cursor-blink 0.7s step-end 0.5s 4, wt-fade-up 0s 1.4s both` }}
              />
            </div>
          </div>

          {/* Role */}
          <div style={{ animation: ani('wt-fade-up','0.25s','1.1s') }}>
            <div className="text-[9px] font-medium text-muted-text mb-0.5">Role <span style={{ color:'#EF4444',opacity:.7 }}>*</span></div>
            <div className="px-2.5 py-1.5 rounded-lg bg-background border border-accent-blue/50 text-[11px] font-semibold text-brand-navy flex items-center gap-0.5">
              <span style={{ animation: ani('wt-fade-up','0.2s','1.3s') }}>SWE Intern</span>
              <span
                className="inline-block w-px h-3.5 bg-accent-blue"
                style={{ animation: `wt-cursor-blink 0.7s step-end 1.3s 4` }}
              />
            </div>
          </div>

          {/* Status + Deadline */}
          <div className="flex gap-2" style={{ animation: ani('wt-fade-up','0.25s','2.1s') }}>
            <div className="flex-1">
              <div className="text-[9px] font-medium text-muted-text mb-0.5">Status</div>
              <div className="px-2 py-1.5 rounded-lg bg-background border border-border-gray text-[10px] font-semibold" style={{ color: '#4361EE' }}>Applied</div>
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-medium text-muted-text mb-0.5">Deadline</div>
              <div className="px-2 py-1.5 rounded-lg bg-background border border-border-gray text-[10px] text-muted-text">Apr 15</div>
            </div>
          </div>

          {/* Save */}
          <div style={{ animation: ani('wt-fade-up','0.25s','2.5s') }}>
            <button
              className="w-full py-1.5 rounded-lg text-white text-[11px] font-semibold mt-0.5"
              style={{ background: '#4361EE', animation: ani('wt-btn-press','0.25s','3s','ease-in-out both') }}
            >
              Save Application
            </button>
          </div>
        </div>
      </div>

      {/* New card popping in */}
      <div
        className="absolute bottom-5 bg-card-bg border border-border-gray rounded-xl shadow-md p-2.5"
        style={{ width: 160, animation: ani('wt-card-pop','0.35s','3.2s','cubic-bezier(0.34,1.56,0.64,1) both') }}
      >
        <div className="text-[11px] font-semibold text-brand-navy">Google</div>
        <div className="text-[10px] text-muted-text">SWE Intern</div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background:'#4361EE18',color:'#4361EE',border:'1px solid #4361EE30' }}>Applied</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-auto" style={{ background:'rgba(245,158,11,0.1)',color:'#D97706',border:'1px solid rgba(245,158,11,0.2)' }}>Apr 15</span>
        </div>
      </div>
    </div>
  );
}

// ── Panel 2: Pipeline ─────────────────────────────────────────────────────────

const COLS = [
  { label: 'Wishlist',    color: '#8B5CF6', cards: ['Stripe','Adobe'] },
  { label: 'Applied',     color: '#4361EE', cards: ['Google','Airbnb','Netflix'] },
  { label: 'OA',          color: '#06B6D4', cards: ['Amazon'] },
  { label: 'Interviews',  color: '#F59E0B', cards: ['Microsoft'] },
  { label: 'Offer',       color: '#1D9E75', cards: ['Figma'] },
];

function Panel2({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex p-3 gap-2 overflow-hidden" style={{ animation: ani('wt-panel-in','0.3s') }}>
      {COLS.map((col, ci) => (
        <div key={col.label} className="flex flex-col" style={{ minWidth: 72, width: 72 }}>
          {/* Header */}
          <div className="flex items-center gap-1 mb-1.5 px-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
            <span className="text-[8px] font-medium text-muted-text truncate">{col.label}</span>
            <span className="text-[8px] text-muted-text/40 ml-auto">{ci === 1 ? col.cards.length - 1 : col.cards.length}</span>
          </div>
          {/* Column */}
          <div
            className="flex-1 rounded-lg p-1 space-y-1 relative overflow-visible"
            style={{ background: `${col.color}08`, border: `1px solid ${col.color}25` }}
          >
            {col.cards.map((card, cardI) => {
              const isDragged = ci === 1 && cardI === 0; // "Google" in Applied gets dragged
              return (
                <div
                  key={card}
                  className="bg-card-bg border border-border-gray rounded-lg p-1.5 text-[10px] font-medium text-brand-navy"
                  style={isDragged ? {
                    animation: ani('wt-drag-out','0.5s','1s','ease-in both'),
                    position: 'relative',
                    zIndex: 20,
                  } : { animation: ani('wt-fade-up','0.2s',`${ci * 0.08 + cardI * 0.06 + 0.1}s`) }}
                >
                  {card}
                </div>
              );
            })}

            {/* Drop glow */}
            {ci === 2 && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{ animation: ani('wt-drop-glow','0.6s','1.4s','ease-out both'), border: `2px solid ${col.color}`, background: `${col.color}18`, opacity: 0 }}
              />
            )}
            {/* New card in OA after drop */}
            {ci === 2 && (
              <div
                className="bg-card-bg border border-border-gray rounded-lg p-1.5 text-[10px] font-medium text-brand-navy"
                style={{ opacity: 0, animation: ani('wt-card-pop','0.3s','1.9s','cubic-bezier(0.34,1.56,0.64,1) both') }}
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

function Panel3({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex flex-col p-4 gap-3" style={{ animation: ani('wt-panel-in','0.3s') }}>
      {/* Mini stat cards */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Total',     val: '18', c: '#4361EE', hi: false },
          { label: 'Rate',      val: '44%', c: '#F59E0B', hi: false },
          { label: 'Interviews',val: '4',  c: '#10B981', hi: false },
          { label: 'Act Now',   val: '2',  c: '#EF4444', hi: true },
        ].map(({ label, val, c, hi }, i) => (
          <div
            key={label}
            className="rounded-xl p-2 border"
            style={{
              background: hi ? 'rgba(251,191,36,0.08)' : 'var(--card-bg)',
              borderColor: hi ? 'rgba(245,158,11,0.4)' : 'var(--border-gray)',
              animation: hi
                ? `${ani('wt-fade-up','0.25s',`${i*0.08}s`)}, ${ani('wt-stat-highlight','1.2s','0.6s','ease-in-out both')}`
                : ani('wt-fade-up','0.25s',`${i*0.08}s`),
            }}
          >
            <div className="text-[8px] text-muted-text font-medium leading-tight mb-0.5">{label}</div>
            <div className="text-sm font-bold" style={{ color: hi ? '#B45309' : 'var(--brand-navy)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* App cards */}
      <div className="space-y-2 flex-1">
        {[
          { co: 'Amazon', role: 'SDE Intern',    badge: '2d left',  red: false, delay: '0.3s' },
          { co: 'Meta',   role: 'PM Intern',     badge: 'Overdue',  red: true,  delay: '0.5s' },
          { co: 'Apple',  role: 'Design Intern', badge: 'Due today',red: true,  delay: '0.7s' },
        ].map(({ co, role, badge, red, delay }) => (
          <div
            key={co}
            className="bg-card-bg border border-border-gray rounded-xl p-2.5 shadow-sm flex items-center justify-between"
            style={{ animation: ani('wt-fade-up','0.25s',delay) }}
          >
            <div>
              <div className="text-xs font-semibold text-brand-navy">{co}</div>
              <div className="text-[10px] text-muted-text">{role}</div>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
              style={red
                ? { color:'#EF4444', background:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.2)', animation: ani('wt-badge-pulse','1.4s',delay,'ease-in-out infinite') }
                : { color:'#D97706', background:'rgba(245,158,11,0.1)', borderColor:'rgba(245,158,11,0.25)' }}
            >
              {badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 4: Funnel ───────────────────────────────────────────────────────────

const BARS = [
  { label: 'Wishlist',   pct: 100, color: '#8B5CF6', count: 18, delay: '0.3s' },
  { label: 'Applied',    pct: 78,  color: '#4361EE', count: 14, delay: '0.55s' },
  { label: 'Interviews', pct: 38,  color: '#F59E0B', count: 7,  delay: '0.8s' },
  { label: 'Offers',     pct: 12,  color: '#1D9E75', count: 2,  delay: '1.05s' },
];

function Panel4({ k, active }: { k: number; active: boolean }) {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (!active) { setRate(0); return; }
    let raf: number;
    let start: number | null = null;
    const target = 38, totalMs = 1600;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / totalMs, 1);
      setRate(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 900);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [active, k]);

  return (
    <div key={k} className="absolute inset-0 flex flex-col p-5" style={{ animation: ani('wt-panel-in','0.3s') }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm font-semibold text-brand-navy">Your Recruiting Funnel</div>
          <div className="text-[10px] text-muted-text mt-0.5">Every application gets you closer</div>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ color:'#16A34A', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)' }}
        >
          {rate}% offer rate
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {BARS.map(({ label, pct, color, count, delay }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-muted-text w-16 text-right flex-shrink-0">{label}</span>
            <div className="flex-1 bg-surface-gray rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: color,
                  transformOrigin: 'left center',
                  animation: ani('wt-bar-grow','0.55s',delay),
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-text w-4 text-left" style={{ animation: ani('wt-fade-up','0.2s',delay) }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 5: Any Device ───────────────────────────────────────────────────────

function Panel5({ k }: { k: number }) {
  return (
    <div key={k} className="absolute inset-0 flex items-center justify-center gap-5 p-4" style={{ animation: ani('wt-panel-in','0.3s') }}>
      {/* Desktop */}
      <div
        className="border border-border-gray rounded-xl overflow-hidden shadow-md bg-card-bg"
        style={{ width: 200, animation: ani('wt-slide-left','0.4s','0.15s') }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-gray border-b border-border-gray">
          {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
          <div className="flex-1 mx-2 h-1.5 rounded-full bg-border-gray" />
        </div>
        <div className="p-2.5">
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[['#4361EE','12'],['#F59E0B','48%'],['#10B981','4'],['#EF4444','2']].map(([c,v]) => (
              <div key={v} className="rounded-lg p-1.5 border border-border-gray bg-background">
                <div className="text-[7px] text-muted-text mb-0.5">—</div>
                <div className="text-[10px] font-bold" style={{ color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-1" style={{ height: 80 }}>
            {['#8B5CF6','#4361EE','#06B6D4','#F59E0B','#1D9E75'].map(c => (
              <div key={c} className="flex-1 rounded-md p-1 space-y-1" style={{ background:`${c}08`,border:`1px solid ${c}25` }}>
                <div className="rounded h-8 opacity-60" style={{ background: c + '60' }} />
                {c !== '#1D9E75' && <div className="rounded h-6 opacity-40" style={{ background: c + '40' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phone */}
      <div
        className="border-2 border-border-gray rounded-[20px] overflow-hidden shadow-lg bg-card-bg flex flex-col"
        style={{ width: 72, height: 148, animation: ani('wt-slide-right','0.4s','0.4s') }}
      >
        {/* Notch */}
        <div className="flex justify-center items-center bg-surface-gray border-b border-border-gray" style={{ height: 20 }}>
          <div className="w-8 h-1 rounded-full bg-border-gray" />
        </div>
        <div className="flex-1 p-1.5 space-y-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-0.5 mb-1">
            {[...Array(4)].map((_,i) => (
              <div key={i} className="rounded-md h-5 border border-border-gray bg-surface-gray" />
            ))}
          </div>
          {[...Array(4)].map((_,i) => (
            <div key={i} className="rounded-lg h-6 border border-border-gray bg-surface-gray" />
          ))}
        </div>
        {/* Bottom bar */}
        <div className="flex justify-center pb-1.5 bg-surface-gray border-t border-border-gray pt-1">
          <div className="w-8 h-1 rounded-full bg-border-gray" />
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

  // Check prefers-reduced-motion
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

  // Auto-advance
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
          <p className="text-xs font-semibold text-accent-blue uppercase tracking-widest mb-3">Product tour</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-brand-navy tracking-tight">
            See how it works in 30 seconds
          </h2>
          <p className="mt-3 text-base text-muted-text">Everything you need. Nothing you don&apos;t.</p>
        </div>

        {/* Walkthrough area */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">

          {/* ── Left: Feature tabs (desktop) / pill row (mobile) ── */}
          <div className="lg:w-60 flex-shrink-0">
            {/* Mobile: horizontal scrollable pills */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {FEATURES.map((f, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: i === active ? '#4361EE' : 'var(--surface-gray)',
                    color: i === active ? '#fff' : 'var(--muted-text)',
                    border: `1px solid ${i === active ? '#4361EE' : 'var(--border-gray)'}`,
                  }}
                >
                  {f.title}
                </button>
              ))}
            </div>

            {/* Desktop: stacked tab list */}
            <div className="hidden lg:flex flex-col gap-1 h-full justify-center">
              {FEATURES.map((f, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="text-left rounded-xl px-4 py-3 transition-all relative overflow-hidden"
                  style={{
                    background: i === active ? 'var(--light-accent)' : 'transparent',
                    border: `1px solid ${i === active ? '#4361EE30' : 'transparent'}`,
                  }}
                >
                  <div
                    className="text-sm font-semibold mb-0.5 transition-colors"
                    style={{ color: i === active ? 'var(--accent-blue)' : 'var(--brand-navy)' }}
                  >
                    {f.title}
                  </div>
                  <div className="text-xs" style={{ color: i === active ? '#4361EE99' : 'var(--muted-text)' }}>
                    {f.desc}
                  </div>
                  {/* Progress bar */}
                  {i === active && !reducedMotion && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-border-gray overflow-hidden">
                      <div
                        key={`pb-${animKey}`}
                        className="h-full bg-accent-blue"
                        style={{
                          width: '0%',
                          animation: `wt-progress ${f.duration}ms linear both`,
                        }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Animated mockup ── */}
          <div className="flex-1 min-h-[340px] lg:min-h-[380px]">
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden"
              style={{
                border: '1px solid var(--border-gray)',
                background: 'var(--card-bg)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 24px rgba(0,0,0,0.06)',
                minHeight: 340,
              }}
            >
              {/* Window chrome bar */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 border-b"
                style={{ borderColor: 'var(--border-gray)', background: 'var(--surface-gray)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                <div className="flex-1 mx-3 rounded-md px-3 py-0.5 text-[10px] text-muted-text/60" style={{ background: 'var(--background)', border: '1px solid var(--border-gray)' }}>
                  useapplyd.com/dashboard
                </div>
              </div>

              {/* Panel content */}
              <div className="relative" style={{ height: 'calc(100% - 33px)', minHeight: 307 }}>
                {panels[active]}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile progress dots */}
        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all rounded-full"
              style={{
                width: i === active ? 20 : 6,
                height: 6,
                background: i === active ? '#4361EE' : 'var(--border-gray)',
              }}
              aria-label={`Go to feature ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
