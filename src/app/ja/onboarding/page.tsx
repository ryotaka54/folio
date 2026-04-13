'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

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

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current;
        const active = i === current - 1;
        return (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: filled ? '#2563EB' : active ? '#93C5FD' : '#E2E8F0',
              transition: 'background 0.2s',
            }}
          />
        );
      })}
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
        width: wide ? '100%' : 120,
        height: 48,
        borderRadius: 8,
        border: selected ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
        background: selected ? '#2563EB' : '#fff',
        color: selected ? '#fff' : '#374151',
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        fontFamily: "'Noto Sans JP', sans-serif",
        transition: 'all 0.15s',
        padding: '0 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JaOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gradYear, setGradYear] = useState<GradYear | null>(null);
  const [uniType, setUniType] = useState<UniType | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [saving, setSaving] = useState(false);

  const TOTAL_STEPS = 5;

  const toggleIndustry = (ind: Industry) => {
    setIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind].slice(0, 3),
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      await supabase
        .from('users')
        .update({
          pipeline_type: 'shuukatsu',
          language_preference: 'ja',
          school_year: gradYear ?? '26卒',
          onboarding_complete: true,
        })
        .eq('id', session.user.id);

      // Check for referral code
      const refCode = typeof window !== 'undefined'
        ? localStorage.getItem('applyd_ref')
        : null;
      if (refCode) {
        try {
          await fetch('/api/referral/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
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
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '20vh',
        padding: '20vh 24px 40px',
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {/* Step dots (not shown on welcome or completion screens) */}
      {step > 1 && step < 5 && (
        <StepDots total={3} current={step - 1} />
      )}

      {/* ── Screen 1: Welcome ──────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563EB" />
              <rect x="7" y="20" width="4" height="7" rx="1" fill="white" fillOpacity="0.4" />
              <rect x="14" y="13" width="4" height="14" rx="1" fill="white" fillOpacity="0.7" />
              <rect x="21" y="7" width="4" height="20" rx="1" fill="white" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0F172A',
              marginBottom: 40,
              lineHeight: 1.3,
            }}
          >
            就活を、もっとシンプルに。
          </h1>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 9999,
              background: '#2563EB',
              color: '#fff',
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            始める
          </button>
        </div>
      )}

      {/* ── Screen 2: Grad year ────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 32,
              letterSpacing: '-0.01em',
            }}
          >
            何卒ですか？
          </h2>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {(['25卒', '26卒', '27卒', '28卒'] as GradYear[]).map((y) => (
              <Chip key={y} label={y} selected={gradYear === y} onClick={() => setGradYear(y)} />
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!gradYear}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 9999,
              background: gradYear ? '#2563EB' : '#E2E8F0',
              color: gradYear ? '#fff' : '#94A3B8',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: gradYear ? 'pointer' : 'not-allowed',
              fontFamily: "'Noto Sans JP', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 3: University type ──────────────────────────────────── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 32,
              letterSpacing: '-0.01em',
            }}
          >
            大学の種別は？
          </h2>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {(['国立大学', '私立大学', '大学院', '海外大学'] as UniType[]).map((u) => (
              <Chip key={u} label={u} selected={uniType === u} onClick={() => setUniType(u)} />
            ))}
          </div>

          <button
            onClick={() => setStep(4)}
            disabled={!uniType}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 9999,
              background: uniType ? '#2563EB' : '#E2E8F0',
              color: uniType ? '#fff' : '#94A3B8',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: uniType ? 'pointer' : 'not-allowed',
              fontFamily: "'Noto Sans JP', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 4: Target industries ────────────────────────────────── */}
      {step === 4 && (
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            志望業界を教えてください。
          </h2>
          <p
            style={{
              fontSize: 12,
              color: '#94A3B8',
              marginBottom: 32,
              letterSpacing: '0.05em',
            }}
          >
            複数選択できます
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            {(
              [
                'IT・テクノロジー',
                '金融',
                'コンサルティング',
                'メーカー',
                '商社',
                'メディア・広告',
                'その他',
              ] as Industry[]
            ).map((ind) => (
              <button
                key={ind}
                onClick={() => toggleIndustry(ind)}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 9999,
                  border: industries.includes(ind) ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                  background: industries.includes(ind) ? '#2563EB' : '#fff',
                  color: industries.includes(ind) ? '#fff' : '#374151',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {ind}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(5)}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 9999,
              background: '#2563EB',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            次へ
          </button>
        </div>
      )}

      {/* ── Screen 5: Completion ───────────────────────────────────────── */}
      {step === 5 && (
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          {/* Animated checkmark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="#E8F5E9" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="#22C55E"
                strokeWidth="6"
                strokeLinecap="round"
                className="animate-circle"
                style={{
                  strokeDasharray: 188,
                  strokeDashoffset: 188,
                  animation: 'draw-circle 0.6s ease-out forwards',
                }}
              />
              <path
                d="M27 41l9 9 17-18"
                stroke="#22C55E"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50,
                  animation: 'draw-check 0.4s ease-out 0.5s forwards',
                }}
              />
            </svg>
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#0F172A',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            準備完了です
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#94A3B8',
              marginBottom: 40,
              letterSpacing: '0.05em',
            }}
          >
            ダッシュボードへ進んでください
          </p>

          <button
            onClick={handleComplete}
            disabled={saving}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 9999,
              background: '#2563EB',
              color: '#fff',
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Noto Sans JP', sans-serif",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '設定中...' : 'ダッシュボードへ'}
          </button>
        </div>
      )}

      {/* CSS keyframes injected inline for the completion animation */}
      <style>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 188; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
