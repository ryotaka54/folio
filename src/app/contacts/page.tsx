'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Contact, Application, RelationshipType } from '@/lib/types';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import ContactCard from '@/components/ContactCard';
import ContactDrawer from '@/components/ContactDrawer';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';

const REL_FILTERS: { value: RelationshipType | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'recruiter', label: 'Recruiters' },
  { value: 'referral',  label: 'Referrals' },
  { value: 'employee',  label: 'Employees' },
  { value: 'alumni',    label: 'Alumni' },
  { value: 'other',     label: 'Other' },
];

export default function ContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [relFilter, setRelFilter] = useState<RelationshipType | 'all'>('all');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      authFetch('/api/contacts').then(r => r.json()),
      supabase.from('applications').select('id,company,role,status,location,category,deadline,job_link,notes,recruiter_name,recruiter_email,interview_steps,created_at,updated_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([cd, { data: apps }]) => {
      if (cd.error) setApiError(true);
      setContacts(cd.contacts ?? []);
      setApplications((apps ?? []) as Application[]);
      setLoading(false);
    }).catch(() => { setLoading(false); setApiError(true); });
  }, [user]);

  const filtered = contacts.filter(c => {
    if (relFilter !== 'all' && c.relationship_type !== relFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await authFetch('/api/contacts', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
    const data = await res.json();
    if (res.ok && data.contact) {
      setContacts(prev => [data.contact, ...prev]);
      setSelected(data.contact);
      setDrawerOpen(true);
      setNewName('');
      setShowAddForm(false);
      setCreateError('');
    } else {
      setCreateError('保存できませんでした。データベースの設定を確認してください。');
    }
    setCreating(false);
  };

  const handleUpdate = useCallback(async (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setSelected(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    await authFetch(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelected(null);
    setDrawerOpen(false);
    await authFetch(`/api/contacts/${id}`, { method: 'DELETE' });
  }, []);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Nav */}
      <nav style={{ height: 56, borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 0 var(--border-gray)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Logo size={24} /></Link>
          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>Contacts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>← Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header + add button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.02em' }}>Contacts</h1>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: '4px 0 0' }}>Your networking contacts — recruiters, referrals, and connections.</p>
          </div>
          <button
            onClick={() => setShowAddForm(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add contact
          </button>
        </div>

        {/* Inline add form */}
        {showAddForm && (
          <div style={{ display: 'flex', gap: 8, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--accent-blue)', background: 'rgba(37,99,235,0.04)' }}>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); } }}
              placeholder="Contact name…"
              style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-gray)', background: 'var(--background)', fontSize: 13, color: 'var(--brand-navy)', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              style={{ height: 36, padding: '0 16px', borderRadius: 7, background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: (!newName.trim() || creating) ? 0.5 : 1 }}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); }}
              style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-gray)', background: 'transparent', color: 'var(--muted-text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            {createError && (
              <p style={{ fontSize: 12, color: '#EF4444', margin: 0, alignSelf: 'center' }}>{createError}</p>
            )}
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            style={{ flex: '1 1 200px', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)', fontSize: 13, color: 'var(--brand-navy)', outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {REL_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRelFilter(f.value)}
                style={{
                  height: 30, padding: '0 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  background: relFilter === f.value ? '#2563EB' : 'transparent',
                  color: relFilter === f.value ? '#fff' : 'var(--muted-text)',
                  border: relFilter === f.value ? '1px solid #2563EB' : '1px solid var(--border-gray)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="inline-block w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
          </div>
        ) : apiError && contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>データベースの設定が必要です</p>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 16, maxWidth: 420, margin: '0 auto 16px' }}>
              コンタクト機能を使うには、Supabaseダッシュボードで以下のSQLを実行してください。
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', height: 36, padding: '0 20px', lineHeight: '36px', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              Supabase Dashboard を開く →
            </a>
          </div>
        ) : filtered.length === 0 && contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 6 }}>No contacts yet</p>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
              Add your recruiters, referrals, and networking connections here.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ height: 36, padding: '0 20px', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
            >
              Add your first contact
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'var(--muted-text)' }}>No contacts match your filters.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '0 0 4px' }}>{filtered.length} contact{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(c => (
              <ContactCard
                key={c.id}
                contact={c}
                active={selected?.id === c.id && drawerOpen}
                onClick={() => { setSelected(c); setDrawerOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <ContactDrawer
        contact={selected}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelected(null); }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        applications={applications}
      />
    </div>
  );
}
