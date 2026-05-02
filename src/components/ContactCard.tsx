'use client';

import { Contact, RelationshipType } from '@/lib/types';

const REL_LABELS: Record<RelationshipType, string> = {
  recruiter: 'Recruiter',
  referral:  'Referral',
  employee:  'Employee',
  alumni:    'Alumni',
  other:     'Other',
};

const REL_COLORS: Record<RelationshipType, { bg: string; text: string; border: string }> = {
  recruiter: { bg: 'rgba(37,99,235,0.1)',   text: '#2563EB', border: 'rgba(37,99,235,0.25)' },
  referral:  { bg: 'rgba(22,163,74,0.1)',   text: '#16A34A', border: 'rgba(22,163,74,0.25)' },
  employee:  { bg: 'rgba(139,92,246,0.1)',  text: '#7C3AED', border: 'rgba(139,92,246,0.25)' },
  alumni:    { bg: 'rgba(217,119,6,0.1)',   text: '#D97706', border: 'rgba(217,119,6,0.25)' },
  other:     { bg: 'rgba(100,116,139,0.1)', text: '#64748B', border: 'rgba(100,116,139,0.25)' },
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1d ago';
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
  active?: boolean;
}

export default function ContactCard({ contact, onClick, active }: ContactCardProps) {
  const colors = REL_COLORS[contact.relationship_type];
  const ago = timeAgo(contact.last_contact_date);
  const initials = contact.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        borderRadius: 10,
        border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-gray)'}`,
        background: active ? 'rgba(37,99,235,0.04)' : 'var(--card-bg)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'border-color 0.12s, background 0.12s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(37,99,235,0.3)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-gray)'; } }}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: colors.bg, border: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: colors.text,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.name}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, flexShrink: 0,
            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
          }}>
            {REL_LABELS[contact.relationship_type]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[contact.role, contact.company].filter(Boolean).join(' · ')}
        </div>
        {ago && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Last contact: {ago}</div>
        )}
      </div>

      {contact.application_ids && contact.application_ids.length > 0 && (
        <div style={{
          flexShrink: 0, fontSize: 11, fontWeight: 500,
          padding: '2px 7px', borderRadius: 99,
          background: 'var(--surface-gray)', color: 'var(--muted-text)',
          border: '1px solid var(--border-gray)',
        }}>
          {contact.application_ids.length} app{contact.application_ids.length !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
}
