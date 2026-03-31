'use client';

import { useEffect, useState } from 'react';
import { touchStreak, getStreakMilestone } from '@/lib/recruiting';

interface Props {
  onMilestone?: (msg: string) => void;
}

export default function StreakBadge({ onMilestone }: Props) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const data = touchStreak();
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
