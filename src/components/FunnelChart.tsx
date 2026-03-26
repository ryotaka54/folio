'use client';

import { useMemo } from 'react';
import { Application } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { STAGE_COLORS } from '@/lib/constants';

interface FunnelChartProps {
  applications: Application[];
}

export default function FunnelChart({ applications }: FunnelChartProps) {
  const data = useMemo(() => {
    if (applications.length === 0) return [];

    const wishlist = applications.length;
    
    // Everything that's not exactly Wishlist
    const appliedApps = applications.filter(a => a.status !== 'Wishlist');
    const applied = appliedApps.length;

    const interviewStages = ['OA / Online Assessment', 'Phone / Recruiter Screen', 'Final Round Interviews',
      'Recruiter Screen', 'Technical / Case Interview', 'Final Round'];
    const interviewsApps = applications.filter(a => interviewStages.includes(a.status) || a.status === 'Offer' || a.status === 'Accepted');
    const interviews = interviewsApps.length;

    const offerApps = applications.filter(a => a.status === 'Offer' || a.status === 'Accepted');
    const offers = offerApps.length;

    // We use a BarChart since true FunnelCharts often look weird on mobile
    return [
      { name: 'Wishlist', count: wishlist, color: STAGE_COLORS['Wishlist'] || '#8B5CF6' },
      { name: 'Applied', count: applied, color: STAGE_COLORS['Applied'] || '#4361EE' },
      { name: 'Interviews', count: interviews, color: '#F59E0B' }, // Warning color
      { name: 'Offers', count: offers, color: '#1D9E75' }, // Success color
    ];
  }, [applications]);

  if (applications.length === 0) return null;

  return (
    <div className="bg-card-bg border border-border-gray rounded-xl p-5 mt-6 mb-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-navy">Conversion Funnel</h3>
        <span className="text-xs font-medium text-muted-text bg-surface-gray px-2 py-1 rounded-md">
          {data[1]?.count > 0 ? Math.round((data[3]?.count / data[1]?.count) * 100) : 0}% Offer Rate
        </span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.5} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              width={80}
            />
            <Tooltip
              cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1F2937', fontWeight: 600, fontSize: '14px' }}
              labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
