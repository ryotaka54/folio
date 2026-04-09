'use client';

import { useEffect, useState } from 'react';
import { ProLogo } from '@/components/ProLogo';

interface ProWelcomeProps {
  onDone: () => void;
}

const HIGHLIGHTS = [
  {
    icon: '🧠',
    name: 'Interview Intel',
    desc: 'Company-specific interview prep, generated automatically.',
    when: 'Activates when you move an application to any interview stage.',
  },
  {
    icon: '✉️',
    name: 'Follow Up Writer',
    desc: 'Professional emails in one click — thank you, negotiation, status check.',
    when: 'Available any time from the application drawer.',
  },
  {
    icon: '📅',
    name: 'Weekly AI Coach',
    desc: 'Personalized recruiting briefing built from your real pipeline.',
    when: 'Arrives every Monday morning at the top of your dashboard.',
  },
];

export default function ProWelcome({ onDone }: ProWelcomeProps) {
  const [stars, setStars] = useState<{ x: number; y: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    setStars(Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 1.5,
      size: Math.random() * 4 + 2,
    })));
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      {/* Floating stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#C9A84C',
            opacity: 0,
            animation: `pro-star 2s ease-out ${s.delay}s both`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @keyframes pro-star {
          0% { opacity: 0; transform: scale(0) translateY(0); }
          40% { opacity: 1; transform: scale(1) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.5) translateY(-60px); }
        }
        @keyframes pro-welcome-in {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-gray)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          animation: 'pro-welcome-in 350ms cubic-bezier(0.34,1.2,0.64,1) both',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1e1e3a 100%)', padding: '28px 28px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ProLogo size={48} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
            You just unlocked your AI recruiting companion
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            Five AI features are now active in your account. Here&apos;s what to expect.
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {HIGHLIGHTS.map(h => (
              <div key={h.name} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{h.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 2 }}>{h.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted-text)', marginBottom: 3, lineHeight: 1.4 }}>{h.desc}</p>
                  <p style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 500 }}>{h.when}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onDone}
            style={{
              width: '100%', height: 44,
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            Take me to my dashboard
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 10 }}>
            Your first Weekly Coach briefing arrives Monday morning.
          </p>
        </div>
      </div>
    </div>
  );
}
