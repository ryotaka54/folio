'use client';

import { useState } from 'react';
import { Application } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface TableViewProps {
  applications: Application[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (app: Application) => void;
}

type SortKey = 'company' | 'role' | 'location' | 'category' | 'status' | 'deadline' | 'created_at';
type SortDir = 'asc' | 'desc';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  // Append T00:00:00 to parse as local midnight, not UTC midnight
  const iso = dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const deadlineUrgency = (dateStr: string | null): 'overdue' | 'today' | 'soon' | 'normal' | 'none' => {
  if (!dateStr) return 'none';
  const iso = dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'normal';
};

export default function TableView({ applications, selectedIds, onSelectionChange, onRowClick }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const sorted = [...applications].sort((a, b) => {
    let aVal = sortKey === 'deadline' ? (a.deadline || '9999')
      : sortKey === 'created_at' ? (a.created_at || '')
      : (a[sortKey] || '');
    let bVal = sortKey === 'deadline' ? (b.deadline || '9999')
      : sortKey === 'created_at' ? (b.created_at || '')
      : (b[sortKey] || '');
    const cmp = aVal.localeCompare(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = applications.length > 0 && applications.every(a => selectedIds.has(a.id));
  const someSelected = applications.some(a => selectedIds.has(a.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      applications.forEach(a => next.delete(a.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      applications.forEach(a => next.add(a.id));
      onSelectionChange(next);
    }
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const columns: { key: SortKey; label: string; className: string }[] = [
    { key: 'company',    label: 'Company',  className: 'w-[16%]' },
    { key: 'role',       label: 'Role',     className: 'w-[20%]' },
    { key: 'location',   label: 'Location', className: 'w-[13%] hidden lg:table-cell' },
    { key: 'category',   label: 'Category', className: 'w-[12%] hidden md:table-cell' },
    { key: 'status',     label: 'Status',   className: 'w-[15%]' },
    { key: 'deadline',   label: 'Deadline', className: 'w-[10%] hidden md:table-cell' },
    { key: 'created_at', label: 'Added',    className: 'w-[9%] hidden lg:table-cell' },
  ];

  const SortIcon = ({ col }: { col: typeof columns[0] }) =>
    sortKey === col.key
      ? <span className="text-accent-blue ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="text-border-gray ml-0.5 opacity-0 group-hover:opacity-100">↕</span>;

  return (
    <div className="bg-card-bg border border-border-gray rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-gray">
              {/* Checkbox column */}
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded accent-accent-blue cursor-pointer"
                />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`group text-left text-xs font-medium text-muted-text px-3 py-3 cursor-pointer hover:text-brand-navy select-none ${col.className}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-0.5">
                    {col.label}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[13px] text-muted-text">
                  No applications match your filters.
                </td>
              </tr>
            )}
            {sorted.map(app => {
              const selected = selectedIds.has(app.id);
              const rejected = app.status === 'Rejected' || app.status === 'Declined';
              return (
                <tr
                  key={app.id}
                  onClick={() => onRowClick(app)}
                  className={`border-t border-border-gray cursor-pointer transition-colors ${
                    selected
                      ? 'bg-accent-blue/5'
                      : rejected
                      ? 'opacity-40 hover:opacity-70 hover:bg-surface-gray/50'
                      : 'hover:bg-surface-gray/50'
                  }`}
                >
                  <td className="px-3 py-2.5" onClick={e => toggleOne(app.id, e)}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded accent-accent-blue cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-medium text-brand-navy truncate max-w-0">{app.company}</td>
                  <td className="px-3 py-2.5 text-[13px] text-body-text truncate max-w-0">{app.role}</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-text hidden lg:table-cell truncate max-w-0">{app.location || '—'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-text hidden md:table-cell">{app.category || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: `${STAGE_COLORS[app.status] || '#6B7280'}18`,
                        color: STAGE_COLORS[app.status] || '#6B7280',
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-xs hidden md:table-cell ${
                    (() => {
                      const u = deadlineUrgency(app.deadline);
                      if (u === 'overdue' || u === 'today') return 'text-red-500 font-medium';
                      if (u === 'soon') return 'text-amber-warning font-medium';
                      return 'text-muted-text';
                    })()
                  }`}>
                    {formatDate(app.deadline)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-text hidden lg:table-cell">
                    {formatDate(app.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
