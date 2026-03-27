'use client';

import { useMemo } from 'react';
import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface FunnelChartProps {
  applications: Application[];
}

export default function FunnelChart({ applications }: FunnelChartProps) {
  const data = useMemo(() => {
    const wishlist = applications.length;
    const applied = applications.filter(a => a.status !== 'Wishlist').length;

    const interviewStages = [
      'OA / Online Assessment',
      'Phone / Recruiter Screen',
      'Final Round Interviews',
      'Recruiter Screen',
      'Technical / Case Interview',
      'Final Round',
      'Offer — Negotiating',
    ];
    const positiveOutcomes = ['Offer', 'Offer — Negotiating', 'Accepted'];
    const interviews = applications.filter(a =>
      interviewStages.includes(a.status) || positiveOutcomes.includes(a.status)
    ).length;
    const offers = applications.filter(a => positiveOutcomes.includes(a.status)).length;

    return [
      { name: 'Wishlist',    count: wishlist,    color: STAGE_COLORS['Wishlist'] || '#8B5CF6' },
      { name: 'Applied',     count: applied,     color: STAGE_COLORS['Applied']  || '#4361EE' },
      { name: 'Interviews',  count: interviews,  color: STAGE_COLORS['Phone / Recruiter Screen'] || '#F59E0B' },
      { name: 'Offers',      count: offers,      color: STAGE_COLORS['Offer'] || '#1D9E75' },
    ];
  }, [applications]);

  if (applications.length === 0) return null;

  const maxCount = data[0].count || 1;
  const applied = data[1].count;
  const offers = data[3].count;
  const offerRate = applied > 0 ? Math.round((offers / applied) * 100) : 0;

  return (
    <div className="bg-card-bg border border-border-gray rounded-xl p-5 mt-6 mb-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">Conversion Funnel</h3>
          <p className="text-xs text-muted-text mt-0.5">How applications progress through your pipeline</p>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          {offerRate}% Offer Rate
        </span>
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const pct = maxCount > 0 ? Math.max((item.count / maxCount) * 100, item.count > 0 ? 4 : 0) : 0;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-text w-20 flex-shrink-0 text-right">{item.name}</span>
              <div className="flex-1 bg-surface-gray rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                >
                  {item.count > 0 && (
                    <span className="text-[10px] font-bold text-white">{item.count}</span>
                  )}
                </div>
              </div>
              {item.count === 0 && (
                <span className="text-[10px] text-muted-text/50 ml-1">0</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
