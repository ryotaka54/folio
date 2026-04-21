'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Application } from '@/lib/types';

interface AppNotification {
  id: string;
  user_id: string;
  type: 'nudge' | 'deadline';
  application_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
  applications: Application[];
  onOpenApp?: (app: Application) => void;
}

function relTime(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function generateNotifications(userId: string, applications: Application[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toInsert: Omit<AppNotification, 'id' | 'read' | 'created_at'>[] = [];

  // Nudge: apps stuck in Applied for 7+ days
  const TERMINAL = new Set(['Rejected', 'Declined', 'Accepted', '承諾', '内定']);
  for (const app of applications) {
    if (app.status !== 'Applied') continue;
    const ref = app.updated_at || app.created_at;
    if (!ref) continue;
    const daysSince = Math.round((today.getTime() - new Date(ref.split('T')[0]).getTime()) / 86400000);
    if (daysSince >= 7) {
      toInsert.push({
        user_id: userId,
        type: 'nudge',
        application_id: app.id,
        message: `${app.company} has been in Applied for ${daysSince} days — time to follow up?`,
      });
    }
  }

  // Deadline: apps with deadlines within 3 days
  for (const app of applications) {
    if (!app.deadline || TERMINAL.has(app.status)) continue;
    const deadline = new Date(app.deadline + 'T00:00:00');
    const daysUntil = Math.round((deadline.getTime() - today.getTime()) / 86400000);
    if (daysUntil >= 0 && daysUntil <= 3) {
      const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
      toInsert.push({
        user_id: userId,
        type: 'deadline',
        application_id: app.id,
        message: `${app.company} deadline is ${label}`,
      });
    }
  }

  if (toInsert.length === 0) return;

  // Only insert if no similar notification exists in the last 24h to avoid spam
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data: existing } = await supabase
    .from('notifications')
    .select('application_id, type')
    .eq('user_id', userId)
    .gte('created_at', since);

  const existingKeys = new Set((existing ?? []).map((n: { application_id: string | null; type: string }) => `${n.application_id}:${n.type}`));
  const fresh = toInsert.filter(n => !existingKeys.has(`${n.application_id}:${n.type}`));

  if (fresh.length > 0) {
    await supabase.from('notifications').insert(fresh);
  }
}

export default function NotificationBell({ userId, applications, onOpenApp }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as AppNotification[]);
  }, [userId]);

  // Generate + fetch on mount and when applications change
  useEffect(() => {
    generateNotifications(userId, applications)
      .then(fetchNotifications)
      .catch(() => fetchNotifications());
  }, [userId, applications, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => { setOpen(v => !v); if (!open) markAllRead(); }}
        style={{
          position: 'relative',
          width: 34, height: 34,
          borderRadius: 8,
          border: '1px solid var(--border-gray)',
          background: 'var(--card-bg)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted-text)',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-bg)'}
        aria-label="Notifications"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 16, height: 16,
            borderRadius: 999,
            background: '#EF4444',
            color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--card-bg)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 320,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-gray)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'popIn 0.12s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: notifications.length > 0 ? '1px solid var(--border-gray)' : 'none',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>Notifications</span>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: 0 }}>You're all caught up</p>
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.map(n => {
                const linkedApp = n.application_id ? applications.find(a => a.id === n.application_id) : undefined;
                return (
                <div
                  key={n.id}
                  onClick={() => { if (linkedApp && onOpenApp) { onOpenApp(linkedApp); setOpen(false); } }}
                  style={{
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border-gray)',
                    background: n.read ? 'transparent' : 'var(--accent-wash)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    cursor: linkedApp && onOpenApp ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (linkedApp && onOpenApp) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-soft)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? 'transparent' : 'var(--accent-wash)'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: n.type === 'deadline' ? 'var(--warn-bg)' : 'var(--accent-wash)',
                    color: n.type === 'deadline' ? 'var(--amber-warning)' : 'var(--accent-blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {n.type === 'deadline' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--brand-navy)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: '3px 0 0', fontFamily: 'var(--mono, ui-monospace)' }}>{relTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="live-dot" style={{ flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
