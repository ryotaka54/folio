'use client';

import { useState, useEffect } from 'react';
import { Contact, Application } from '@/lib/types';
import { authFetch } from '@/lib/auth-fetch';

interface ContactLinkPanelProps {
  applicationId: string;
  applications: Application[];
}

export default function ContactLinkPanel({ applicationId }: ContactLinkPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [linked, setLinked] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/contacts')
      .then(r => r.json())
      .then(d => {
        const all: Contact[] = d.contacts ?? [];
        setContacts(all);
        setLinked(all.filter(c => c.application_ids?.includes(applicationId)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [applicationId]);

  const linkContact = async (contact: Contact) => {
    setLinked(prev => [...prev, contact]);
    setSearch('');
    setDropOpen(false);
    await authFetch(`/api/contacts/${contact.id}/applications`, {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  };

  const unlinkContact = async (contact: Contact) => {
    setLinked(prev => prev.filter(c => c.id !== contact.id));
    await authFetch(`/api/contacts/${contact.id}/applications`, {
      method: 'DELETE',
      body: JSON.stringify({ application_id: applicationId }),
    });
  };

  const linkedIds = new Set(linked.map(c => c.id));
  const suggestions = contacts.filter(c =>
    !linkedIds.has(c.id) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Contacts</h3>
      </div>

      {loading ? (
        <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>Loading…</span>
        </div>
      ) : (
        <>
          {linked.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {linked.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-gray)', background: 'var(--surface-gray)' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{c.name}</span>
                    {(c.role || c.company) && (
                      <span style={{ fontSize: 11, color: 'var(--muted-text)', marginLeft: 6 }}>{[c.role, c.company].filter(Boolean).join(' · ')}</span>
                    )}
                  </div>
                  <button onClick={() => unlinkContact(c)} style={{ fontSize: 11, color: 'var(--muted-text)', background: 'none', border: 'none', cursor: 'pointer' }}>Unlink</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
              placeholder={contacts.length === 0 ? 'No contacts yet — add some at /contacts' : 'Search contacts to link…'}
              disabled={contacts.length === 0}
              className="w-full h-9 px-3 bg-background border border-border-gray rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-text-tertiary"
              style={{ color: 'var(--brand-navy)' }}
            />
            {dropOpen && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--card-bg)', border: '1px solid var(--border-gray)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                {suggestions.slice(0, 6).map(c => (
                  <button
                    key={c.id}
                    onMouseDown={e => { e.preventDefault(); linkContact(c); }}
                    style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-gray)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)' }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>{[c.role, c.company].filter(Boolean).join(' · ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
