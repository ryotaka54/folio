'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, Brain, Mail, Clock, Calendar } from 'lucide-react';
import { Logo } from './Logo';

// ── Dark-mode design tokens ───────────────────────────────────────────────────
// Always applied — the demo frame is always dark regardless of page theme.
const D = {
  bg:           '#0A0A0A',
  cardBg:       '#161618',
  surfaceGray:  '#1E1E20',
  borderGray:   '#2A2A2C',
  brandNavy:    '#F9FAFB',
  mutedText:    '#A1A1AA',
  textTertiary: '#71717A',
  accentBlue:   '#3B82F6',
  green:        '#4ADE80',
  amber:        '#FBBF24',
  red:          '#F87171',
} as const;

// Stage colors from constants.ts
const SC = {
  Applied:     '#2563EB',
  OA:          '#06B6D4',
  PhoneScreen: '#F59E0B',
  FinalRound:  '#EF4444',
  Offer:       '#1D9E75',
} as const;

const FEATURES = [
  { id: 'pipeline',  label: 'Pipeline',         desc: 'Kanban built for OA, interviews, and offers',    Icon: LayoutGrid, duration: 3500 },
  { id: 'interview', label: 'Interview Intel',   desc: 'AI questions the moment you reach interview',    Icon: Brain,      duration: 4000 },
  { id: 'followup',  label: 'Follow Up Writer',  desc: 'One click writes the right email for any stage', Icon: Mail,       duration: 3500 },
  { id: 'deadlines', label: 'Deadlines',         desc: 'Urgent items surface before you miss them',      Icon: Clock,      duration: 3000 },
  { id: 'coach',     label: 'Weekly Coach',      desc: 'Monday briefing built from your real pipeline',  Icon: Calendar,   duration: 4000 },
] as const;

const JA_FEATURES = [
  { id: 'pipeline',  label: 'パイプライン管理', desc: 'OA・面接・内定まで就活に特化したカンバン', Icon: LayoutGrid, duration: 3500 },
  { id: 'interview', label: 'AI面接対策',       desc: '面接段階に入ったらAIが即座に頻出質問を生成', Icon: Brain,      duration: 4000 },
  { id: 'followup',  label: 'メール作成',       desc: '状況に合ったフォローアップをワンクリックで', Icon: Mail,       duration: 3500 },
  { id: 'deadlines', label: '締め切り管理',     desc: '期限が近い選考を色でひと目で確認',           Icon: Clock,      duration: 3000 },
  { id: 'coach',     label: '週次AIコーチ',     desc: '月曜の朝に届くあなた専用の行動プラン',       Icon: Calendar,   duration: 4000 },
] as const;

// ── Shared chrome components (always dark) ────────────────────────────────────

function BrowserChrome() {
  return (
    <div style={{
      height: 36, background: D.surfaceGray, borderBottom: `1px solid ${D.borderGray}`,
      display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {(['#FF5F57', '#FEBC2E', '#28C840'] as const).map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div style={{
        flex: 1, height: 22, background: D.bg, borderRadius: 5, border: `1px solid ${D.borderGray}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        maxWidth: 200, margin: '0 auto',
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={D.textTertiary} strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ fontSize: 10, color: D.mutedText, letterSpacing: '-0.01em' }}>useapplyd.com</span>
      </div>
    </div>
  );
}

function AppNav({ locale }: { locale: 'en' | 'ja' }) {
  return (
    <div style={{
      height: 36, background: D.cardBg, borderBottom: `1px solid ${D.borderGray}`,
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0,
    }}>
      <Logo size={18} variant="dark" />
      <span style={{ fontSize: 11, fontWeight: 600, color: D.brandNavy, letterSpacing: '-0.02em' }}>Applyd</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 9, color: D.mutedText }}>{locale === 'ja' ? 'こんにちは、田中さん' : 'Hi, Alex'}</span>
      <div style={{
        width: 22, height: 22, borderRadius: 6, border: `1px solid ${D.borderGray}`,
        background: D.surfaceGray, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={D.mutedText} strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
    </div>
  );
}

// ── Panel 1: Pipeline ─────────────────────────────────────────────────────────

function PipelinePanel() {
  const cols = [
    { label: 'Applied',      color: SC.Applied,     cards: [{ company: 'Google',      role: 'SWE Intern',          deadline: '5d', red: false }] },
    { label: 'OA',           color: SC.OA,           cards: [{ company: 'Stripe',      role: 'Backend Eng Intern',  deadline: null, red: false }] },
    { label: 'Phone Screen', color: SC.PhoneScreen,  cards: [{ company: 'McKinsey',    role: 'BA Intern',           deadline: '1d', red: true  }] },
    { label: 'Final Round',  color: SC.FinalRound,   cards: [{ company: 'Anthropic',   role: 'Research Eng Intern', deadline: null, red: false }] },
    { label: 'Offer',        color: SC.Offer,        cards: [{ company: 'Jane Street', role: 'Quant Trader',        deadline: null, red: false }] },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, padding: '8px 10px', gap: 7, overflow: 'hidden' }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {[
          { label: 'Total',      value: '5',  sub: 'applications', accent: null },
          { label: 'Active',     value: '4',  sub: 'in progress',  accent: null },
          { label: 'Interviews', value: '2',  sub: 'this week',    accent: 'green' },
          { label: 'Act Now',    value: '1',  sub: '1 day left',   accent: 'amber' },
        ].map(s => (
          <div key={s.label} style={{
            borderRadius: 7, padding: '5px 7px', background: D.cardBg,
            border: s.accent === 'green' ? `1px solid ${D.borderGray}` : s.accent === 'amber' ? `1px solid ${D.borderGray}` : `1px solid ${D.borderGray}`,
            borderLeft: s.accent === 'green' ? '3px solid #16A34A' : s.accent === 'amber' ? '3px solid #D97706' : `1px solid ${D.borderGray}`,
          }}>
            <div style={{ fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: D.mutedText, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.accent === 'green' ? D.green : s.accent === 'amber' ? D.amber : D.brandNavy, marginBottom: 1 }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: D.textTertiary }}>{s.sub}</div>
          </div>
        ))}
      </div>
      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, flex: 1, minHeight: 0 }}>
        {cols.map(col => (
          <div key={col.label} style={{ display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: D.mutedText, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{col.label}</span>
              <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, border: `1px solid ${D.borderGray}`, background: D.surfaceGray, color: D.textTertiary }}>{col.cards.length}</span>
            </div>
            <div style={{ flex: 1, borderRadius: 7, padding: 4, background: D.cardBg, border: `1px solid ${D.borderGray}`, display: 'flex', flexDirection: 'column' as const, gap: 4, minHeight: 60 }}>
              {col.cards.map(card => (
                <div key={card.company} style={{ background: D.bg, border: `1px solid ${D.borderGray}`, borderRadius: 6, padding: '5px 6px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: D.brandNavy, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{card.company}</div>
                  <div style={{ fontSize: 8, color: D.mutedText, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{card.role}</div>
                  {card.deadline && (
                    <div style={{ marginTop: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        fontSize: 7, fontWeight: 600, padding: '1px 4px', borderRadius: 3,
                        ...(card.red
                          ? { background: 'rgba(239,68,68,0.12)', color: D.red, border: '1px solid rgba(239,68,68,0.25)' }
                          : { background: 'rgba(217,119,6,0.12)', color: D.amber, border: '1px solid rgba(217,119,6,0.25)' }),
                      }}>{card.deadline}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 2: Interview Intel ──────────────────────────────────────────────────

function InterviewIntelPanel() {
  const sections = [
    { title: 'Behavioral', items: [
      'Describe a time you balanced technical rigor with shipping fast.',
      'Tell me about a project where you had to learn something completely new under pressure.',
    ]},
    { title: 'Technical', items: [
      'How would you debug a transformer model significantly underperforming on eval?',
    ]},
    { title: 'Role-specific', items: [
      'How do you think about AI safety in the context of product decisions?',
      'What does responsible scaling mean to you in practice?',
    ]},
  ];
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: `${SC.FinalRound}15`, color: SC.FinalRound, border: `1px solid ${SC.FinalRound}30` }}>Final Round</span>
        <span style={{ fontSize: 10, color: D.mutedText, fontWeight: 500 }}>Anthropic</span>
        <span style={{ fontSize: 10, color: D.textTertiary }}>· Research Engineer Intern</span>
      </div>
      <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${D.borderGray}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ background: D.surfaceGray, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${D.borderGray}`, flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.accentBlue} strokeWidth="2">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>AI Interview Prep</span>
          <span style={{ marginLeft: 'auto', fontSize: 8, color: D.textTertiary }}>Anthropic · 5 questions</span>
        </div>
        <div style={{ padding: '8px 10px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: D.textTertiary, marginBottom: 5 }}>{sec.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                {sec.items.map(q => (
                  <div key={q} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.accentBlue, marginTop: 3.5, flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.45 }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel 3: Follow Up Writer ─────────────────────────────────────────────────

function FollowUpPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: `${SC.PhoneScreen}15`, color: SC.PhoneScreen, border: `1px solid ${SC.PhoneScreen}30` }}>Phone Screen</span>
        <span style={{ fontSize: 10, color: D.mutedText, fontWeight: 500 }}>McKinsey</span>
        <span style={{ fontSize: 10, color: D.textTertiary }}>· Business Analyst Intern</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        {['Thank You', 'Status Check', 'Negotiation', 'Withdrawal'].map((t, i) => (
          <div key={t} style={{
            fontSize: 9, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
            background: i === 0 ? D.accentBlue : D.surfaceGray,
            color: i === 0 ? '#fff' : D.mutedText,
            border: `1px solid ${i === 0 ? D.accentBlue : D.borderGray}`,
            cursor: 'default',
          }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${D.borderGray}`, background: D.cardBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ padding: '7px 10px', borderBottom: `1px solid ${D.borderGray}`, background: D.surfaceGray, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: D.textTertiary }}>Subject: </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>Thank you — Phone Screen at McKinsey</span>
        </div>
        <div style={{ padding: '8px 10px', overflow: 'auto', flex: 1 }}>
          {[
            'Hi Sarah,',
            "Thank you for taking the time to speak with me today. I really enjoyed our conversation about McKinsey's approach to structured problem-solving.",
            "I was particularly struck by what you shared about the team's focus on measurable client outcomes — that aligns closely with how I approach projects.",
            'I look forward to hearing about the next steps.\n\nBest,\nAlex',
          ].map((para, i) => (
            <p key={i} style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.55, marginBottom: 5, whiteSpace: 'pre-line' as const }}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel 4: Deadlines ────────────────────────────────────────────────────────

function DeadlinesPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
        {[
          { label: 'Act Now', value: '1', sub: '≤ 3 days',     accent: 'red' },
          { label: 'Soon',    value: '2', sub: '≤ 7 days',     accent: 'amber' },
          { label: 'Coming',  value: '2', sub: 'next 2 weeks', accent: null },
        ].map(s => (
          <div key={s.label} style={{
            borderRadius: 7, padding: '6px 8px', background: D.cardBg,
            border: `1px solid ${D.borderGray}`,
            borderLeft: s.accent === 'red' ? '3px solid #DC2626' : s.accent === 'amber' ? '3px solid #D97706' : `1px solid ${D.borderGray}`,
          }}>
            <div style={{ fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: D.mutedText, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.accent === 'red' ? D.red : s.accent === 'amber' ? D.amber : D.brandNavy, marginBottom: 1 }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: D.textTertiary }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
        {[
          { company: 'McKinsey',    role: 'BA Intern',          stage: 'Phone Screen', stageColor: SC.PhoneScreen, deadline: '1 day',  red: true  },
          { company: 'Google',      role: 'SWE Intern',         stage: 'Applied',      stageColor: SC.Applied,     deadline: '5 days', red: false },
          { company: 'Stripe',      role: 'Backend Eng Intern', stage: 'OA',           stageColor: SC.OA,          deadline: '7 days', red: false },
        ].map(item => (
          <div key={item.company} style={{
            background: D.cardBg, border: `1px solid ${D.borderGray}`, borderRadius: 8,
            padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>{item.company}</div>
              <div style={{ fontSize: 8.5, color: D.mutedText, marginTop: 1 }}>{item.role}</div>
            </div>
            <span style={{ fontSize: 8.5, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: `${item.stageColor}18`, color: item.stageColor, border: `1px solid ${item.stageColor}35`, flexShrink: 0 }}>{item.stage}</span>
            <span style={{
              fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              ...(item.red
                ? { background: 'rgba(220,38,38,0.12)', color: D.red, border: '1px solid rgba(220,38,38,0.25)' }
                : { background: 'rgba(217,119,6,0.12)', color: D.amber, border: '1px solid rgba(217,119,6,0.25)' }),
            }}>{item.deadline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 5: Weekly Coach ─────────────────────────────────────────────────────

function WeeklyCoachPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden' }}>
      <div style={{
        borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%)',
        padding: '11px 12px', height: '100%', overflow: 'auto',
        display: 'flex', flexDirection: 'column' as const, gap: 9,
        boxSizing: 'border-box' as const,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: D.brandNavy, marginBottom: 3, lineHeight: 1.35 }}>Strong week — keep the momentum</div>
            <div style={{ fontSize: 9.5, color: D.mutedText, lineHeight: 1.5 }}>You have 2 active interviews and 1 OA in progress. McKinsey is your most time-sensitive priority.</div>
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: `${D.accentBlue}15`, color: D.accentBlue, border: `1px solid ${D.accentBlue}25`, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>Week of Apr 7</div>
        </div>
        <div>
          <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: D.textTertiary, marginBottom: 6 }}>Top priorities</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            {[
              { n: 1, text: 'Prep for McKinsey Phone Screen — 1 day remaining', urgent: true },
              { n: 2, text: 'Complete Stripe OA before the 7-day deadline' },
              { n: 3, text: 'Follow up on Google application — applied 5 days ago' },
            ].map(p => (
              <div key={p.n} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: p.urgent ? 'rgba(239,68,68,0.15)' : `${D.accentBlue}15`,
                  border: `1px solid ${p.urgent ? 'rgba(239,68,68,0.3)' : `${D.accentBlue}30`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: p.urgent ? D.red : D.accentBlue,
                }}>{p.n}</div>
                <span style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.45 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: D.surfaceGray, borderRadius: 7, padding: '7px 9px', border: `1px solid ${D.borderGray}` }}>
          <div style={{ fontSize: 9, color: D.mutedText, lineHeight: 1.5 }}>
            💡 Students with 3+ active interview rounds accept offers{' '}
            <strong style={{ color: D.brandNavy }}>2.3× faster</strong>. You&apos;re on track — don&apos;t let McKinsey slip.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Japanese panels ──────────────────────────────────────────────────────────

function JaPipelinePanel() {
  const cols = [
    { label: 'エントリー済み', color: SC.Applied,     cards: [{ company: 'Mercari',    role: 'バックエンドエンジニア', deadline: '5日', red: false }] },
    { label: 'OA',            color: SC.OA,           cards: [{ company: 'Recruit',    role: 'プロダクトマネージャー', deadline: null,  red: false }] },
    { label: '電話面接',       color: SC.PhoneScreen,  cards: [{ company: 'CyberAgent', role: 'Webエンジニア',          deadline: '1日', red: true  }] },
    { label: '最終面接',       color: SC.FinalRound,   cards: [{ company: 'DeNA',       role: 'iOSエンジニア',          deadline: null,  red: false }] },
    { label: '内定',           color: SC.Offer,        cards: [{ company: 'Sansan',     role: 'バックエンドエンジニア', deadline: null,  red: false }] },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, padding: '8px 10px', gap: 7, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {[
          { label: '合計',   value: '5', sub: '選考中',  accent: null },
          { label: '選考中', value: '4', sub: '進行中',  accent: null },
          { label: '面接中', value: '2', sub: '今週',    accent: 'green' },
          { label: '要対応', value: '1', sub: '1日後締切', accent: 'amber' },
        ].map(s => (
          <div key={s.label} style={{
            borderRadius: 7, padding: '5px 7px', background: D.cardBg,
            border: s.accent === 'green' ? `1px solid ${D.borderGray}` : s.accent === 'amber' ? `1px solid ${D.borderGray}` : `1px solid ${D.borderGray}`,
            borderLeft: s.accent === 'green' ? '3px solid #16A34A' : s.accent === 'amber' ? '3px solid #D97706' : `1px solid ${D.borderGray}`,
          }}>
            <div style={{ fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: D.mutedText, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.accent === 'green' ? D.green : s.accent === 'amber' ? D.amber : D.brandNavy, marginBottom: 1 }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: D.textTertiary }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, flex: 1, minHeight: 0 }}>
        {cols.map(col => (
          <div key={col.label} style={{ display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.02em', color: D.mutedText, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{col.label}</span>
              <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, border: `1px solid ${D.borderGray}`, background: D.surfaceGray, color: D.textTertiary }}>{col.cards.length}</span>
            </div>
            <div style={{ flex: 1, borderRadius: 7, padding: 4, background: D.cardBg, border: `1px solid ${D.borderGray}`, display: 'flex', flexDirection: 'column' as const, gap: 4, minHeight: 60 }}>
              {col.cards.map(card => (
                <div key={card.company} style={{ background: D.bg, border: `1px solid ${D.borderGray}`, borderRadius: 6, padding: '5px 6px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: D.brandNavy, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{card.company}</div>
                  <div style={{ fontSize: 8, color: D.mutedText, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{card.role}</div>
                  {card.deadline && (
                    <div style={{ marginTop: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        fontSize: 7, fontWeight: 600, padding: '1px 4px', borderRadius: 3,
                        ...(card.red
                          ? { background: 'rgba(239,68,68,0.12)', color: D.red, border: '1px solid rgba(239,68,68,0.25)' }
                          : { background: 'rgba(217,119,6,0.12)', color: D.amber, border: '1px solid rgba(217,119,6,0.25)' }),
                      }}>{card.deadline}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JaInterviewIntelPanel() {
  const sections = [
    { title: '行動面接', items: [
      '困難なプロジェクトでチームをまとめた経験を教えてください。',
      '締め切りが迫る中で品質を保ちながら仕事を進めた経験は？',
    ]},
    { title: '技術面接', items: [
      'マイクロサービスとモノリスの設計をどう使い分けますか？',
    ]},
    { title: '職種別', items: [
      'Mercariのグロース戦略について、あなたの考えを聞かせてください。',
      'ユーザーリテンション改善のためにどのような施策を提案しますか？',
    ]},
  ];
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: `${SC.FinalRound}15`, color: SC.FinalRound, border: `1px solid ${SC.FinalRound}30` }}>最終面接</span>
        <span style={{ fontSize: 10, color: D.mutedText, fontWeight: 500 }}>Mercari</span>
        <span style={{ fontSize: 10, color: D.textTertiary }}>· バックエンドエンジニア</span>
      </div>
      <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${D.borderGray}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ background: D.surfaceGray, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${D.borderGray}`, flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.accentBlue} strokeWidth="2">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>AI 面接対策</span>
          <span style={{ marginLeft: 'auto', fontSize: 8, color: D.textTertiary }}>Mercari · 5問</span>
        </div>
        <div style={{ padding: '8px 10px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.05em', color: D.textTertiary, marginBottom: 5 }}>{sec.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                {sec.items.map(q => (
                  <div key={q} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.accentBlue, marginTop: 3.5, flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.45 }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JaFollowUpPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: `${SC.PhoneScreen}15`, color: SC.PhoneScreen, border: `1px solid ${SC.PhoneScreen}30` }}>電話面接</span>
        <span style={{ fontSize: 10, color: D.mutedText, fontWeight: 500 }}>CyberAgent</span>
        <span style={{ fontSize: 10, color: D.textTertiary }}>· Webエンジニア</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        {['お礼メール', '進捗確認', '条件交渉', '辞退連絡'].map((t, i) => (
          <div key={t} style={{
            fontSize: 9, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
            background: i === 0 ? D.accentBlue : D.surfaceGray,
            color: i === 0 ? '#fff' : D.mutedText,
            border: `1px solid ${i === 0 ? D.accentBlue : D.borderGray}`,
            cursor: 'default',
          }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${D.borderGray}`, background: D.cardBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ padding: '7px 10px', borderBottom: `1px solid ${D.borderGray}`, background: D.surfaceGray, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: D.textTertiary }}>件名: </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>本日の面接のお礼 — CyberAgent様</span>
        </div>
        <div style={{ padding: '8px 10px', overflow: 'auto', flex: 1 }}>
          {[
            '田中様',
            '本日はお時間をいただきありがとうございました。面接を通じて、CyberAgentのエンジニア文化や技術的な挑戦について深く理解することができました。',
            '特に、スケーラビリティへのアプローチについてお話しいただいた点が大変印象的でした。私自身の経験とも重なり、ぜひご一緒したいという思いがさらに強くなりました。',
            'ご検討のほど、よろしくお願いいたします。\n\n田中 太郎',
          ].map((para, i) => (
            <p key={i} style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.55, marginBottom: 5, whiteSpace: 'pre-line' as const }}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function JaDeadlinesPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
        {[
          { label: '要対応', value: '1', sub: '3日以内', accent: 'red' },
          { label: 'もうすぐ', value: '2', sub: '7日以内', accent: 'amber' },
          { label: '今後',   value: '2', sub: '2週間以内', accent: null },
        ].map(s => (
          <div key={s.label} style={{
            borderRadius: 7, padding: '6px 8px', background: D.cardBg,
            border: `1px solid ${D.borderGray}`,
            borderLeft: s.accent === 'red' ? '3px solid #DC2626' : s.accent === 'amber' ? '3px solid #D97706' : `1px solid ${D.borderGray}`,
          }}>
            <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.05em', color: D.mutedText, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.accent === 'red' ? D.red : s.accent === 'amber' ? D.amber : D.brandNavy, marginBottom: 1 }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: D.textTertiary }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
        {[
          { company: 'CyberAgent', role: 'Webエンジニア',   stage: '電話面接', stageColor: SC.PhoneScreen, deadline: 'あと1日', red: true  },
          { company: 'Mercari',    role: 'バックエンドエンジニア', stage: 'エントリー済み', stageColor: SC.Applied, deadline: 'あと5日', red: false },
          { company: 'Recruit',    role: 'プロダクトマネージャー', stage: 'OA',     stageColor: SC.OA,         deadline: 'あと7日', red: false },
        ].map(item => (
          <div key={item.company} style={{
            background: D.cardBg, border: `1px solid ${D.borderGray}`, borderRadius: 8,
            padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: D.brandNavy }}>{item.company}</div>
              <div style={{ fontSize: 8.5, color: D.mutedText, marginTop: 1 }}>{item.role}</div>
            </div>
            <span style={{ fontSize: 8.5, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: `${item.stageColor}18`, color: item.stageColor, border: `1px solid ${item.stageColor}35`, flexShrink: 0 }}>{item.stage}</span>
            <span style={{
              fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              ...(item.red
                ? { background: 'rgba(220,38,38,0.12)', color: D.red, border: '1px solid rgba(220,38,38,0.25)' }
                : { background: 'rgba(217,119,6,0.12)', color: D.amber, border: '1px solid rgba(217,119,6,0.25)' }),
            }}>{item.deadline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JaWeeklyCoachPanel() {
  return (
    <div style={{ flex: 1, padding: '8px 10px', overflow: 'hidden' }}>
      <div style={{
        borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%)',
        padding: '11px 12px', height: '100%', overflow: 'auto',
        display: 'flex', flexDirection: 'column' as const, gap: 9,
        boxSizing: 'border-box' as const,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: D.brandNavy, marginBottom: 3, lineHeight: 1.35 }}>順調です — この勢いを維持しましょう</div>
            <div style={{ fontSize: 9.5, color: D.mutedText, lineHeight: 1.5 }}>面接が2社、OA対応中が1社あります。CyberAgentの電話面接が最も急ぎです。</div>
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: `${D.accentBlue}15`, color: D.accentBlue, border: `1px solid ${D.accentBlue}25`, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>4月7日週</div>
        </div>
        <div>
          <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.05em', color: D.textTertiary, marginBottom: 6 }}>今週の優先事項</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            {[
              { n: 1, text: 'CyberAgent電話面接の準備 — 締め切りまであと1日', urgent: true },
              { n: 2, text: 'Mercari OAを7日以内に完了させること' },
              { n: 3, text: 'Recruitへのフォローアップ — エントリーから5日経過' },
            ].map(p => (
              <div key={p.n} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: p.urgent ? 'rgba(239,68,68,0.15)' : `${D.accentBlue}15`,
                  border: `1px solid ${p.urgent ? 'rgba(239,68,68,0.3)' : `${D.accentBlue}30`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: p.urgent ? D.red : D.accentBlue,
                }}>{p.n}</div>
                <span style={{ fontSize: 9.5, color: D.brandNavy, lineHeight: 1.45 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: D.surfaceGray, borderRadius: 7, padding: '7px 9px', border: `1px solid ${D.borderGray}` }}>
          <div style={{ fontSize: 9, color: D.mutedText, lineHeight: 1.5 }}>
            💡 3社以上の面接を並行している就活生は内定承諾が{' '}
            <strong style={{ color: D.brandNavy }}>2.3倍速い</strong>という結果が出ています。
          </div>
        </div>
      </div>
    </div>
  );
}

const JA_PANELS: React.FC[] = [JaPipelinePanel, JaInterviewIntelPanel, JaFollowUpPanel, JaDeadlinesPanel, JaWeeklyCoachPanel];

// ── Demo frame wrapper ────────────────────────────────────────────────────────

function DemoFrame({ animKey, Panel, locale }: { animKey: number; Panel: React.FC; locale: 'en' | 'ja' }) {
  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${D.borderGray}`,
      overflow: 'hidden', background: D.bg,
      boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <BrowserChrome />
      <AppNav locale={locale} />
      <div style={{ height: 278, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
        <div key={animKey} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, animation: 'wt-panel-in 0.3s ease-out both' }}>
          <Panel />
        </div>
      </div>
    </div>
  );
}

const PANELS: React.FC[] = [PipelinePanel, InterviewIntelPanel, FollowUpPanel, DeadlinesPanel, WeeklyCoachPanel];

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductWalkthrough({ locale = 'en' }: { locale?: 'en' | 'ja' }) {
  const features = locale === 'ja' ? JA_FEATURES : FEATURES;
  const panels   = locale === 'ja' ? JA_PANELS   : PANELS;
  const [active, setActive]           = useState(0);
  const [animKey, setAnimKey]         = useState(0);
  const [playing, setPlaying]         = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef                      = useRef<NodeJS.Timeout | null>(null);
  const containerRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setAnimKey(k => k + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    timerRef.current = setTimeout(() => {
      setActive(a => (a + 1) % features.length);
      setAnimKey(k => k + 1);
    }, features[active].duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, animKey, playing, reducedMotion, features]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const ActivePanel = panels[active];

  return (
    <section className="py-20 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-blue)' }}>
            {locale === 'ja' ? '製品ツアー' : 'Product tour'}
          </p>
          <h2 className="text-[28px] md:text-[36px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>
            {locale === 'ja' ? '使い方を見てみよう' : 'See how it works'}
          </h2>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--muted-text)' }}>
            {locale === 'ja' ? '本物のAI機能。本物のパイプライン。あなたの就活のために。' : 'Real AI features. Real pipeline stages. Built for your job search.'}
          </p>
        </div>

        {/* Mobile: horizontal pill tabs */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4" style={{ scrollbarWidth: 'none' }}>
          {features.map((f, i) => (
            <button
              key={f.id}
              onClick={() => goTo(i)}
              className="flex-shrink-0 h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors"
              style={{
                background: i === active ? 'var(--accent-blue)' : 'var(--surface-gray)',
                color: i === active ? '#fff' : 'var(--muted-text)',
                borderColor: i === active ? 'var(--accent-blue)' : 'var(--border-gray)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 items-center">

          {/* Left: stacked feature tabs (desktop only) */}
          <div className="hidden lg:flex flex-col gap-1">
            {features.map((f, i) => {
              const isActive = i === active;
              return (
                <button
                  key={f.id}
                  onClick={() => goTo(i)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--card-bg)' : 'transparent',
                    borderColor: isActive ? 'var(--border-gray)' : 'transparent',
                    outline: 'none',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'var(--surface-gray)',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--border-gray)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <f.Icon size={15} color={isActive ? '#3B82F6' : 'var(--muted-text)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2,
                      color: isActive ? 'var(--brand-navy)' : 'var(--muted-text)',
                      transition: 'color 0.2s',
                    }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      {f.desc}
                    </div>
                    {isActive && !reducedMotion && (
                      <div style={{ marginTop: 7, height: 2, background: 'var(--border-gray)', borderRadius: 1, overflow: 'hidden' }}>
                        <div
                          key={`pb-${animKey}`}
                          style={{
                            height: '100%', background: '#3B82F6', borderRadius: 1, width: '0%',
                            animation: `wt-progress ${f.duration}ms linear both`,
                            animationPlayState: playing ? 'running' : 'paused',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: browser frame (desktop) */}
          <div className="hidden lg:block">
            <DemoFrame animKey={animKey} Panel={ActivePanel} locale={locale} />
          </div>
        </div>

        {/* Mobile: dots + browser frame */}
        <div className="flex lg:hidden justify-center gap-1.5 mt-5 mb-4">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? 20 : 6, height: 6, borderRadius: 3,
                background: i === active ? '#3B82F6' : 'var(--border-gray)',
                border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
        <div className="lg:hidden">
          <DemoFrame animKey={animKey} Panel={ActivePanel} locale={locale} />
        </div>
      </div>
    </section>
  );
}
