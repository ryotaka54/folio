'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Check, Trophy, Lightbulb, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { ProLogo } from '@/components/ProLogo';
import { isPro } from '@/lib/pro';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import {
  CHALLENGE_START_DATE,
  getChallengeDay,
  hasVotedToday,
  markVotedToday,
  secondsUntilMidnight,
  type CommunityIdea,
  type ChallengeConfig,
} from '@/lib/community';

// ── Shimmer keyframe (injected once) ────────────────────────────────────────
const SHIMMER_STYLE = `
@keyframes shimmer-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;

// ── Sub-components ───────────────────────────────────────────────────────────

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
    </svg>
  );
}

// ── Challenge banner ─────────────────────────────────────────────────────────
function ChallengeBanner({
  currentDay,
  totalIdeas,
  builtCount,
}: {
  currentDay: number;
  totalIdeas: number;
  builtCount: number;
}) {
  const progress = Math.min(100, (currentDay / 100) * 100);

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 md:p-8"
      style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)' }}
    >
      <style>{SHIMMER_STYLE}</style>

      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10">
        {/* Day counter */}
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-semibold leading-none"
            style={{ fontSize: 'clamp(48px, 10vw, 80px)', color: '#fff', letterSpacing: '-0.04em' }}
          >
            {currentDay}
          </span>
          <span className="text-[18px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
            / 100
          </span>
        </div>
        <p className="text-[14px] font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Day of the challenge
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div
            className="relative h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: '#fff',
                transition: 'width 1s ease',
              }}
            >
              {/* Shimmer overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'shimmer-slide 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Day 1</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Day 100</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Ideas submitted', value: totalIdeas.toLocaleString() },
            { label: 'Features built', value: builtCount.toLocaleString() },
            { label: 'Students voted', value: '847' /* TODO: make dynamic */ },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-[22px] font-semibold leading-none mb-1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Built for students. Improved by students. Every single day.
        </p>
      </div>
    </div>
  );
}

// ── Countdown ────────────────────────────────────────────────────────────────
function WinnerCountdown() {
  const [secs, setSecs] = useState(secondsUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setSecs(secondsUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="rounded-xl border p-6 text-center"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Winner announced in
      </p>
      <div className="flex items-center justify-center gap-3">
        {[
          { val: pad(h), label: 'hrs' },
          { val: pad(m), label: 'min' },
          { val: pad(s), label: 'sec' },
        ].map(({ val, label }, i) => (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <span className="text-[24px] font-light" style={{ color: 'var(--border-emphasis)' }}>:</span>}
            <div>
              <div
                className="text-[40px] font-semibold leading-none tabular-nums"
                style={{ color: 'var(--brand-navy)', letterSpacing: '-0.03em' }}
              >
                {val}
              </div>
              <div className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px]" style={{ color: 'var(--muted-text)' }}>
        Vote below to influence what gets built tomorrow.
      </p>
    </div>
  );
}

// ── Today's winner card ──────────────────────────────────────────────────────
function WinnerCard({ winner }: { winner: CommunityIdea }) {
  const isBuilding = winner.status === 'building';
  const isLive = winner.status === 'live';

  return (
    <div
      className="rounded-xl border p-5 md:p-6"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border-gray)',
        borderLeft: '4px solid #D97706',
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#D97706' }}>
        Today&apos;s winning idea
      </p>
      <p className="text-[17px] font-medium leading-snug mb-3" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.01em' }}>
        {winner.idea_text}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        {winner.tiktok_username && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--muted-text)' }}>
            <TikTokIcon size={12} />
            <span className="text-[12px]">@{winner.tiktok_username}</span>
          </div>
        )}
        {isLive && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}>
            ✓ Live in app
          </span>
        )}
        {isBuilding && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)' }}>
            Building now
          </span>
        )}
        {winner.status === 'winning' && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(217,119,6,0.12)', color: '#D97706' }}>
            Winner — building starts soon
          </span>
        )}
      </div>
    </div>
  );
}

// ── Vote card ────────────────────────────────────────────────────────────────
function IdeaVoteCard({
  idea,
  rank,
  voted,
  localCount,
  onVote,
  isLoggedIn,
}: {
  idea: CommunityIdea;
  rank: number;
  voted: boolean;
  localCount: number;
  onVote: (id: string) => void;
  isLoggedIn: boolean;
}) {
  const isWinning = rank === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border p-4 flex items-center gap-4"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border-gray)',
        borderLeft: isWinning ? '3px solid var(--accent-blue)' : undefined,
      }}
    >
      {/* Rank */}
      <div
        className="text-[13px] font-semibold w-5 flex-shrink-0 text-center"
        style={{ color: isWinning ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
      >
        {rank + 1}
      </div>

      {/* Idea text + username */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.005em' }}>
          {idea.idea_text}
        </p>
        {idea.tiktok_username && (
          <div className="flex items-center gap-1 mt-1" style={{ color: 'var(--text-tertiary)' }}>
            <TikTokIcon size={10} />
            <span className="text-[11px]">@{idea.tiktok_username}</span>
          </div>
        )}
      </div>

      {/* Vote count + button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-[20px] font-semibold tabular-nums"
          style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', minWidth: 28, textAlign: 'right' }}
        >
          {localCount.toLocaleString()}
        </span>
        <button
          onClick={() => onVote(idea.id)}
          disabled={voted}
          title={isLoggedIn ? (voted ? 'Already voted today' : 'Vote for this idea') : 'Sign in to vote'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all"
          style={
            voted
              ? { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff', cursor: 'default' }
              : { background: 'transparent', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }
          }
        >
          {voted ? <Check size={12} /> : <ThumbsUp size={12} />}
          {voted ? 'Voted' : 'Vote'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Hall of fame modal ───────────────────────────────────────────────────────
function HallOfFameModal({ entry, onClose }: { entry: CommunityIdea; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="rounded-2xl border p-6 max-w-md w-full relative"
        style={{ background: 'var(--background)', borderColor: 'var(--border-gray)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}
          >
            Day {entry.day_number}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}
          >
            ✓ Live
          </span>
        </div>

        <h3 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
          {entry.feature_name}
        </h3>
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--muted-text)' }}>
          {entry.feature_description}
        </p>

        <div
          className="rounded-lg p-3 mb-4"
          style={{ background: 'var(--surface-gray)', borderRadius: 10 }}
        >
          <p className="text-[11px] mb-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Original idea
          </p>
          <p className="text-[13px] italic leading-snug" style={{ color: 'var(--brand-navy)' }}>
            &ldquo;{entry.idea_text}&rdquo;
          </p>
        </div>

        <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--muted-text)' }}>
          {entry.tiktok_username && (
            <div className="flex items-center gap-1.5">
              <TikTokIcon size={11} />
              <span>@{entry.tiktok_username}</span>
            </div>
          )}
          <span>{entry.vote_count.toLocaleString()} votes received</span>
        </div>

        {entry.screenshot_url && (
          <div className="mt-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-gray)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.screenshot_url} alt={`Screenshot of ${entry.feature_name}`} className="w-full" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user, signOut } = useAuth();
  const userIsPro = isPro(user);

  // ── Data state
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [winner, setWinner] = useState<CommunityIdea | null>(null);
  const [hallOfFame, setHallOfFame] = useState<CommunityIdea[]>([]);
  const [config, setConfig] = useState<ChallengeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // ── UI state
  const [toast, setToast] = useState<string | null>(null);
  const [ideaText, setIdeaText] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CommunityIdea | null>(null);
  const [localVoteCounts, setLocalVoteCounts] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const currentDay = getChallengeDay();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Initial data load
  useEffect(() => {
    async function load() {
      try {
        const [configRes, ideasRes, hallRes] = await Promise.all([
          supabase.from('challenge_config').select('*').eq('id', 1).single(),
          supabase.from('community_ideas').select('*').eq('status', 'pending').order('vote_count', { ascending: false }),
          supabase.from('community_ideas').select('*').eq('status', 'live').order('day_number', { ascending: false }),
        ]);

        if (configRes.data) {
          setConfig(configRes.data as ChallengeConfig);

          // Fetch today's winner if set
          if (configRes.data.current_day_winner_id) {
            const { data: w } = await supabase
              .from('community_ideas')
              .select('*')
              .eq('id', configRes.data.current_day_winner_id)
              .single();
            if (w) setWinner(w as CommunityIdea);
          }
        }

        if (ideasRes.data) {
          setIdeas(ideasRes.data as CommunityIdea[]);
          // Init local vote counts from DB
          const counts: Record<string, number> = {};
          const voted = new Set<string>();
          for (const idea of ideasRes.data as CommunityIdea[]) {
            counts[idea.id] = idea.vote_count;
            if (hasVotedToday(idea.id)) voted.add(idea.id);
          }
          setLocalVoteCounts(counts);
          setVotedIds(voted);
        }

        if (hallRes.data) setHallOfFame(hallRes.data as CommunityIdea[]);
      } catch {
        // Tables may not exist yet — show empty UI gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Real-time vote updates
  useEffect(() => {
    if (ideas.length === 0) return;

    const channel = supabase
      .channel('community_ideas_votes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_ideas' },
        (payload) => {
          const updated = payload.new as CommunityIdea;
          // Only update from server if user hasn't already voted (so we don't stomp optimistic update)
          setLocalVoteCounts(prev => {
            const myCount = prev[updated.id] ?? updated.vote_count;
            const alreadyVoted = votedIds.has(updated.id);
            return {
              ...prev,
              [updated.id]: alreadyVoted ? Math.max(myCount, updated.vote_count) : updated.vote_count,
            };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ideas.length, votedIds]);

  // ── Vote handler
  const handleVote = useCallback(async (ideaId: string) => {
    if (!user) { showToast('Sign in to vote'); return; }
    if (votedIds.has(ideaId)) return;

    // Optimistic update
    markVotedToday(ideaId);
    setVotedIds(prev => new Set([...prev, ideaId]));
    setLocalVoteCounts(prev => ({ ...prev, [ideaId]: (prev[ideaId] ?? 0) + 1 }));

    // Persist to Supabase via RPC
    const { error } = await supabase.rpc('increment_vote', { idea_id: ideaId });
    if (error) {
      // Rollback optimistic update on error
      setVotedIds(prev => { const next = new Set(prev); next.delete(ideaId); return next; });
      setLocalVoteCounts(prev => ({ ...prev, [ideaId]: Math.max(0, (prev[ideaId] ?? 1) - 1) }));
      showToast('Vote failed — try again');
    }
  }, [user, votedIds, showToast]);

  // ── Submit idea
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim() || ideaText.length > 200) return;
    if (!user) { showToast('Sign in to submit an idea'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('community_ideas').insert({
        idea_text: ideaText.trim(),
        tiktok_username: tiktokHandle.trim().replace(/^@/, '') || null,
        vote_count: 0,
        status: 'pending',
      });
      if (error) throw error;
      setIdeaText('');
      setTiktokHandle('');
      showToast('Your idea has been submitted — share it with friends to get votes!');
    } catch {
      showToast('Submission failed — please try again');
    } finally {
      setSubmitting(false);
    }
  }, [ideaText, tiktokHandle, user, showToast]);

  // ── Sorted voting ideas (top 5, locally up-to-date)
  const sortedIdeas = useMemo(() =>
    [...ideas]
      .map(idea => ({ ...idea, vote_count: localVoteCounts[idea.id] ?? idea.vote_count }))
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 5),
    [ideas, localVoteCounts]
  );

  const totalIdeas = ideas.length + hallOfFame.length;
  const builtCount = hallOfFame.length;

  return (
    <div className="min-h-screen bg-background">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2">
              {userIsPro ? <ProLogo size={28} /> : <Logo size={28} variant="dark" />}
              <span className="text-[16px] font-semibold hidden sm:block" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>Applyd</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted-text)' }}
              >
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                style={{ color: 'var(--muted-text)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Calendar
              </Link>
              <Link
                href="/community"
                className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--accent-blue)', background: 'rgba(37,99,235,0.08)' }}
              >
                Community
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button
                onClick={async () => signOut()}
                className="text-xs transition-colors"
                style={{ color: 'var(--muted-text)' }}
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all"
                style={{ borderColor: 'var(--border-gray)', color: 'var(--brand-navy)', background: 'var(--surface-gray)' }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ── Section 1: Challenge banner ────────────────────────────────── */}
        <ChallengeBanner
          currentDay={currentDay}
          totalIdeas={totalIdeas || 8}
          builtCount={builtCount || 3}
        />

        {/* ── Section 2: Today's winner or countdown ─────────────────────── */}
        <div>
          <h2 className="text-[13px] font-semibold mb-3 uppercase tracking-[0.07em]" style={{ color: 'var(--text-tertiary)' }}>
            Today&apos;s feature
          </h2>
          {winner ? (
            <WinnerCard winner={winner} />
          ) : (
            <WinnerCountdown />
          )}
        </div>

        {/* ── Section 3: Vote for tomorrow ───────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              What should we build next?
            </h2>
            <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
              The idea with the most votes by midnight becomes part of Applyd tomorrow.
              Also vote on our TikTok{' '}
              <span style={{ color: 'var(--accent-blue)' }}>@useapplyd</span>
              {' '}— the most liked comment wins too.
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: 'var(--surface-gray)' }}
                />
              ))}
            </div>
          ) : sortedIdeas.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
            >
              <Lightbulb size={24} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
                No ideas yet — be the first to submit below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {sortedIdeas.map((idea, rank) => (
                  <IdeaVoteCard
                    key={idea.id}
                    idea={idea}
                    rank={rank}
                    voted={votedIds.has(idea.id)}
                    localCount={localVoteCounts[idea.id] ?? idea.vote_count}
                    onVote={handleVote}
                    isLoggedIn={!!user}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Submit idea form */}
          <form onSubmit={handleSubmit} className="mt-5">
            <div
              className="rounded-xl border p-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
            >
              <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--brand-navy)' }}>
                Share your idea for tomorrow
              </p>
              <textarea
                value={ideaText}
                onChange={e => setIdeaText(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="What feature would make Applyd better for students?"
                className="w-full resize-none rounded-lg border px-3 py-2 text-[13px] transition-colors outline-none"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border-gray)',
                  color: 'var(--brand-navy)',
                }}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={tiktokHandle}
                  onChange={e => setTiktokHandle(e.target.value)}
                  placeholder="@yourtiktok (optional)"
                  className="flex-1 rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--border-gray)',
                    color: 'var(--brand-navy)',
                  }}
                />
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {ideaText.length}/200
                </span>
                <button
                  type="submit"
                  disabled={!ideaText.trim() || submitting}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all flex-shrink-0"
                  style={{
                    background: ideaText.trim() ? 'var(--accent-blue)' : 'var(--surface-gray)',
                    color: ideaText.trim() ? '#fff' : 'var(--text-tertiary)',
                    cursor: ideaText.trim() ? 'pointer' : 'default',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Section 4: Hall of fame ─────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              Built by the community
            </h2>
            <span className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
              {hallOfFame.length} feature{hallOfFame.length !== 1 ? 's' : ''} from student ideas
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-gray)' }} />
              ))}
            </div>
          ) : hallOfFame.length === 0 ? (
            <div
              className="rounded-xl border p-6 text-center"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
            >
              <Trophy size={24} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
                Features will appear here as they go live.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hallOfFame.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-colors group"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                    style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--accent-blue)' }}
                  >
                    {entry.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
                        {entry.feature_name}
                      </span>
                    </div>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted-text)' }}>
                      {entry.feature_description}
                    </p>
                    {entry.tiktok_username && (
                      <div className="flex items-center gap-1 mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        <TikTokIcon size={10} />
                        <span className="text-[11px]">@{entry.tiktok_username}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}
                    >
                      ✓ Live
                    </span>
                    <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 5: How it works ─────────────────────────────────────── */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
              How it works
            </h2>
            <p className="text-[13px]" style={{ color: 'var(--muted-text)' }}>
              Every day for 100 days, the most-voted idea gets built into Applyd.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Drop your idea',
                desc: 'Comment on our TikTok or submit below. Any feature you want in Applyd.',
              },
              {
                step: '2',
                title: 'Vote for your favorite',
                desc: 'The idea with the most likes and votes by midnight wins.',
              },
              {
                step: '3',
                title: 'Watch it get built',
                desc: 'We build the winning feature the next day and ship it live.',
              },
            ].map(item => (
              <div
                key={item.step}
                className="rounded-xl border p-5"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
              >
                <div
                  className="text-[28px] font-semibold mb-3 leading-none"
                  style={{ color: 'var(--accent-blue)', letterSpacing: '-0.03em' }}
                >
                  {item.step}
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5" style={{ color: 'var(--brand-navy)' }}>
                  {item.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-text)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-8" />
      </main>

      {/* ── Hall of fame modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEntry && (
          <HallOfFameModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
