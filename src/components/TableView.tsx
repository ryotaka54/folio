'use client';

import { useState } from 'react';
import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface TableViewProps {
  applications: Application[];
  onRowClick: (app: Application) => void;
}

type SortKey = 'company' | 'role' | 'category' | 'status' | 'deadline' | 'notes';
type SortDir = 'asc' | 'desc';

export default function TableView({ applications, onRowClick }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...applications].sort((a, b) => {
    let aVal = a[sortKey] || '';
    let bVal = b[sortKey] || '';
    if (sortKey === 'deadline') {
      aVal = a.deadline || '9999';
      bVal = b.deadline || '9999';
    }
    const cmp = aVal.localeCompare(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const isRejected = (status: string) => status === 'Rejected' || status === 'Declined';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDeadlineSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= now && d <= sevenDays;
  };

  const columns: { key: SortKey; label: string; className: string }[] = [
    { key: 'company', label: 'Company', className: 'w-[20%]' },
    { key: 'role', label: 'Role', className: 'w-[22%]' },
    { key: 'category', label: 'Category', className: 'w-[14%] hidden md:table-cell' },
    { key: 'status', label: 'Status', className: 'w-[18%]' },
    { key: 'deadline', label: 'Deadline', className: 'w-[14%] hidden md:table-cell' },
    { key: 'notes', label: 'Notes', className: 'w-[12%] hidden lg:table-cell' },
  ];

  return (
    <div className="bg-white border border-border-gray rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-gray">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-medium text-muted-text px-4 py-3 cursor-pointer hover:text-brand-navy transition-colors select-none ${col.className}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-accent-blue">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-muted-text">
                  No applications yet. Click &quot;Add Application&quot; to get started.
                </td>
              </tr>
            )}
            {sorted.map(app => (
              <tr
                key={app.id}
                onClick={() => onRowClick(app)}
                className={`border-t border-border-gray cursor-pointer hover:bg-surface-gray/50 transition-colors ${
                  isRejected(app.status) ? 'opacity-50' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-brand-navy truncate max-w-0">{app.company}</td>
                <td className="px-4 py-3 text-sm text-body-text truncate max-w-0">{app.role}</td>
                <td className="px-4 py-3 text-xs text-muted-text hidden md:table-cell">{app.category || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-[11px] font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${STAGE_COLORS[app.status] || '#6B7280'}15`,
                      color: STAGE_COLORS[app.status] || '#6B7280',
                    }}
                  >
                    {app.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-xs hidden md:table-cell ${isDeadlineSoon(app.deadline) ? 'text-amber-warning font-medium' : 'text-muted-text'}`}>
                  {formatDate(app.deadline)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-text truncate max-w-0 hidden lg:table-cell">{app.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
