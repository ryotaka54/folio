'use client';

import { useEffect, useState } from 'react';
import { touchStreak, getStreakMilestone } from '@/lib/recruiting';

interface Props {
  onMilestone?: (msg: string) => void;
}

export default function StreakBadge({ onMilestone }: Props) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // touchStreak() has side effects (reads/writes localStorage) and is
    // idempotent per calendar day, so it must run as an effect, not during
    // render — its return value is the actual state we want to display.
    const data = touchStreak();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreak(data.count);
    if (data.count > 1) {
      const msg = getStreakMilestone(data.count);
      if (msg) {
        const shown = localStorage.getItem(`applyd_milestone_shown_${data.count}`);
        if (!shown) {
          localStorage.setItem(`applyd_milestone_shown_${data.count}`, '1');
          onMilestone?.(msg);
        }
      }
    }
  }, [onMilestone]);

  if (streak < 2) return null;

  return (
    <span
      className="flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}
      title={`${streak}-day streak`}
    >
      <span style={{ color: '#F59E0B' }}>🔥</span>
      {streak}
    </span>
  );
}
