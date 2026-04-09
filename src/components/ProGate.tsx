'use client';

import { Lock } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  isPro: boolean;
  onUpgrade: () => void;
  label?: string;
}

export default function ProGate({ children, isPro, onUpgrade, label = 'Pro feature' }: ProGateProps) {
  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }} aria-hidden>
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-lg gap-2"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)' }}
      >
        <Lock size={16} style={{ color: 'var(--brand-navy)' }} />
        <p className="text-[12px] font-medium" style={{ color: 'var(--brand-navy)' }}>{label}</p>
        <button
          onClick={onUpgrade}
          className="text-[11px] font-semibold px-3 py-1 rounded-md text-white"
          style={{ background: 'var(--accent-blue)' }}
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
