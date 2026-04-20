'use client';

import { useState, useMemo } from 'react';
import { Application } from '@/lib/types';
import CompanyAvatar from './CompanyAvatar';
import StagePill from './StagePill';

interface TableViewProps {
  applications: Application[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (app: Application) => void;
  onRowContextMenu?: (app: Application, e: React.MouseEvent) => void;
}

type SortKey = 'company' | 'location' | 'status' | 'deadline' | 'created_at';

function fmtDeadline(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const urgent = diff >= 0 && diff <= 3;
  let label: string;
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff < 0) label = `${-diff}d ago`;
  else if (diff < 7) label = `in ${diff}d`;
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, urgent };
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const COL = '32px 1.5fr 1fr 130px 130px 90px 36px';

export default function TableView({
  applications, onRowClick, onRowContextMenu,
}: TableViewProps) {
  const [sort, setSort] = useState<SortKey>('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const setSortKey = (k: SortKey) => {
    if (sort === k) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(k); setDir('desc'); }
  };

  const sorted = useMemo(() => {
    return [...applications].sort((a, b) => {
      const av: string = (sort === 'deadline' ? (a.deadline ?? '9999') : sort === 'created_at' ? (a.created_at ?? '') : (a[sort] ?? '')) as string;
      const bv: string = (sort === 'deadline' ? (b.deadline ?? '9999') : sort === 'created_at' ? (b.created_at ?? '') : (b[sort] ?? '')) as string;
      const cmp = av.localeCompare(bv);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [applications, sort, dir]);

  const th = (label: string, key: SortKey) => (
    <button
      onClick={() => setSortKey(key)}
      style={{
        fontSize: 11, color: 'var(--muted)', fontWeight: 500,
        letterSpacing: '0.04em', textTransform: 'uppercase' as const,
        background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left' as const, fontFamily: 'inherit', padding: 0,
        display: 'flex', alignItems: 'center', gap: 3,
      }}
    >
      {label}
      {sort === key && (
        <span style={{ fontSize: 9 }}>{dir === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: COL,
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
          background: 'var(--bg-soft)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div />
          {th('Company / Role', 'company')}
          {th('Location', 'location')}
          {th('Stage', 'status')}
          {th('Deadline', 'deadline')}
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Applied
          </div>
          <div />
        </div>

        {/* Rows */}
        {sorted.length === 0 && (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            No applications match your filters.
          </div>
        )}
        {sorted.map(app => {
          const deadline = fmtDeadline(app.deadline);
          return (
            <button
              key={app.id}
              onClick={() => onRowClick(app)}
              onContextMenu={onRowContextMenu ? e => { e.preventDefault(); onRowContextMenu(app, e); } : undefined}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: COL,
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'var(--text)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <CompanyAvatar company={app.company} size={28} />

              {/* Company + Role */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: 'var(--text)',
                }}>
                  {app.company}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {app.role}
                </div>
              </div>

              {/* Location */}
              <div style={{
                fontSize: 12, color: 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.location || '—'}
                </span>
              </div>

              {/* Stage pill */}
              <div>
                <StagePill stage={app.status} size="sm" />
              </div>

              {/* Deadline */}
              <div style={{ fontSize: 12 }}>
                {deadline ? (
                  <span style={{ color: deadline.urgent ? 'var(--warn)' : 'var(--muted)', fontWeight: deadline.urgent ? 500 : 400 }}>
                    {deadline.label}
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted-2)' }}>—</span>
                )}
              </div>

              {/* Applied (relative time, mono) */}
              <div style={{
                fontSize: 11,
                color: 'var(--muted)',
                fontFamily: 'var(--mono, ui-monospace)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {relTime(app.created_at)}
              </div>

              {/* Chevron */}
              <div style={{ color: 'var(--muted)', opacity: 0.4, display: 'flex', justifyContent: 'flex-end' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
