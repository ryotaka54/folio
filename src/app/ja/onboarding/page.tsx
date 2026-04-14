'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';

type GradYear = '25卒' | '26卒' | '27卒' | '28卒';
type UniType = '国立大学' | '私立大学' | '大学院' | '海外大学';
type Industry =
  | 'IT・テクノロジー'
  | '金融'
  | 'コンサルティング'
  | 'メーカー'
  | '商社'
  | 'メディア・広告'
  | 'その他';

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 48 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            width: i < current ? 28 : 12,
            borderRadius: 9999,
            background: i < current ? 'var(--accent-blue)' : 'var(--border-gray)',
            transition: 'all 300ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      ))}
    </div>
  );
}

// ── Choice chip ───────────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
  wide,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: wide ? '100%' : 'auto',
        minWidth: 100,
        height: 48,
        borderRadius: 10,
        border: selected
          ? '2px solid var(--accent-blue)'
          : '1.5px solid var(--border-gray)',
        background: selected ? 'var(--accent-blue)' : 'var(--surface-gray)',
        color: selected ? '#fff' : 'var(--brand-navy)',
        fontSize: 14,
        fontWeight: selected ? 600 : 500,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        fontFamily: "'Noto Sans JP', sans-serif",
        padding: '0 20px',
        whiteSpace: 'nowrap',
        transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out, transform 100ms ease-out',
      }}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function JaOnboarding() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [gradYear, setGradYear] = useState<GradYear | null>(null);
  const [uniType, setUniType] = useState<UniType | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Preserve the user's theme preference in the cookie so it survives this page
  useEffect(() => {
    if (!mounted) return;
    const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [mounted, resolvedTheme]);

  const TOTAL_STEPS = 3;

  const toggleIndustry = (ind: Industry) =>
    setIndustries(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind].slice(0, 3),
    );

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/ja/login'); return; }

      await supabase.from('users').update({
        pipeline_type: 'shuukatsu',
        language_preference: 'ja',
        school_year: gradYear ?? '26卒',
        onboarding_complete: true,
      }).eq('id', session.user.id);

      const refCode = typeof window !== 'undefined' ? localStorage.getItem('applyd_ref') : null;
      if (refCode) {
        try {
          await fetch('/api/referral/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ referralCode: refCode }),
          });
          localStorage.removeItem('applyd_ref');
        } catch { /* non-critical */ }
      }

      router.push('/ja/dashboard');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20vh 24px 40px',
        fontFamily: "'Noto Sans JP', sans-serif",
        transition: 'background 0.2s ease',
      }}
    >
      {/* Step bar (steps 2, 3, 4) */}
      {step > 1 && step < 5 && (
        <StepBar total={TOTAL_STEPS} current={step - 1} />
      )}

      {/* ── Screen 1: Welcome ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div
          style={{ textAlign: 'center', maxWidth: 400 }}
          className="onboard-enter"
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--accent-blue)" />
              <rect x="7" y="20" width="4" height="7" rx="1" fill="white" fillOpacity="0.4" />
              <rect x="14" y="13" width="4" height="14" rx="1" fill="white" fillOpacity="0.7" />
              <rect x="21" y="7" width="4" height="20" rx="1" fill="white" />
            </svg>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--brand-navy)', marginBottom: 12, lineHeight: 1.3 }}>
            就活を、もっとシンプルに。
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 40, lineHeight: 1.7, letterSpacing: '0.03em' }}>
            エントリーから内定まで、すべての選考を一元管理。
          </p>

          <button
            onClick={() => setStep(2)}
            style={primaryBtn}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            始める
          </button>
        </div>
      )}

      {/* ── Screen 2: Grad year ───────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>何卒ですか？</h2>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {(['25卒', '26卒', '27卒', '28卒'] as GradYear[]).map(y => (
              <Chip key={y} label={y} selected={gradYear === y} onClick={() => setGradYear(y)} />
            ))}
          </div>

          <button
            onClick={() => gradYear && setStep(3)}
            disabled={!gradYear}
            style={{ ...primaryBtn, opacity: gradYear ? 1 : 0.4, cursor: gradYear ? 'pointer' : 'not-allowed' }}
            onMouseDown={e => { if (gradYear) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 3: University type ─────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>大学の種別は？</h2>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {(['国立大学', '私立大学', '大学院', '海外大学'] as UniType[]).map(u => (
              <Chip key={u} label={u} selected={uniType === u} onClick={() => setUniType(u)} />
            ))}
          </div>

          <button
            onClick={() => uniType && setStep(4)}
            disabled={!uniType}
            style={{ ...primaryBtn, opacity: uniType ? 1 : 0.4, cursor: uniType ? 'pointer' : 'not-allowed' }}
            onMouseDown={e => { if (uniType) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 4: Industries ──────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }} className="onboard-enter">
          <h2 style={questionStyle}>志望業界を教えてください。</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-text)', marginBottom: 32, letterSpacing: '0.05em' }}>
            複数選択できます（最大3つ）
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            {(['IT・テクノロジー', '金融', 'コンサルティング', 'メーカー', '商社', 'メディア・広告', 'その他'] as Industry[]).map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndustry(ind)}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 9999,
                  border: industries.includes(ind) ? '2px solid var(--accent-blue)' : '1.5px solid var(--border-gray)',
                  background: industries.includes(ind) ? 'var(--accent-blue)' : 'var(--surface-gray)',
                  color: industries.includes(ind) ? '#fff' : 'var(--brand-navy)',
                  fontSize: 13,
                  fontWeight: industries.includes(ind) ? 600 : 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  transition: 'all 150ms ease-out',
                }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {ind}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(5)}
            style={primaryBtn}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 5: Complete ────────────────────────────────────────────── */}
      {step === 5 && (
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }} className="onboard-enter">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="var(--border-gray)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="30"
                stroke="var(--green-success)"
                strokeWidth="5"
                strokeLinecap="round"
                style={{ strokeDasharray: 188, strokeDashoffset: 188, animation: 'draw-circle 0.6s cubic-bezier(0.23,1,0.32,1) forwards' }}
              />
              <path
                d="M27 41l9 9 17-18"
                stroke="var(--green-success)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'draw-check 0.4s ease-out 0.5s forwards' }}
              />
            </svg>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            準備完了です
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 40, letterSpacing: '0.05em', lineHeight: 1.7 }}>
            ダッシュボードへ進みましょう
          </p>

          <button
            onClick={handleComplete}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseDown={e => { if (!saving) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {saving ? '設定中...' : 'ダッシュボードへ'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 188; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes onboard-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .onboard-enter {
          animation: onboard-in 300ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  width: '100%',
  height: 52,
  borderRadius: 12,
  background: 'var(--accent-blue)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.04em',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
  transition: 'transform 100ms ease-out, opacity 150ms ease',
};

const questionStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--brand-navy)',
  marginBottom: 28,
  letterSpacing: '-0.02em',
  lineHeight: 1.4,
};
