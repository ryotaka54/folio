'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: 'エントリー',     color: '#64748B', num: '01' },
  { label: '説明会',         color: '#0EA5E9', num: '02' },
  { label: 'ES提出',         color: '#8B5CF6', num: '03' },
  { label: 'SPI / 適性検査', color: '#F59E0B', num: '04' },
  { label: '一次面接',       color: '#3B82F6', num: '05' },
  { label: '二次面接',       color: '#6366F1', num: '06' },
  { label: '最終面接',       color: '#EC4899', num: '07' },
  { label: '内々定',         color: '#10B981', num: '08' },
  { label: '内定',           color: '#22C55E', num: '09' },
  { label: '承諾 / 辞退',    color: '#94A3B8', num: '10' },
];

const FEATURES = [
  {
    n: '一',
    title: '選考を、全部ひとつの場所で。',
    body: 'エントリーから内定まですべての選考をパイプライン形式で一元管理。複数の企業を同時に追いかけながら何も見落とさない。',
    tag: '選考管理',
  },
  {
    n: '二',
    title: 'AIが、面接の準備を一瞬で。',
    body: '企業名と職種を入れるだけでその企業に特化した頻出質問と対策をAIが自動生成。前日の深夜でも即座に準備できる。',
    tag: 'AI面接対策',
  },
  {
    n: '三',
    title: 'ESを書いたら、ここに保存。',
    body: '志望動機・自己PR・ガクチカを企業ごとに保存。文字数カウント付きで提出前の最終確認もスムーズに。',
    tag: 'ES管理',
  },
  {
    n: '四',
    title: '締め切りを、絶対に見逃さない。',
    body: '説明会・ES・面接のすべての期限を自動でトラッキング。あと何日かが色で一目でわかる。カレンダーとも連携。',
    tag: '締め切り管理',
  },
];

const TESTIMONIALS = [
  {
    quote: '正直Notionで管理していた頃は何社受けているか把握できていなかった。Applydを使い始めてからどの選考がどこにいるか一瞬でわかるようになりました。',
    name: 'K.M さん',
    detail: '早稲田大学 商学部 3年生 / 26卒',
    result: '内定 3社',
  },
  {
    quote: 'AI面接対策が本当に便利。メルカリの最終面接の前日に使ったら聞かれた質問の7割が対策に出てた。偶然じゃないと思う。',
    name: 'T.Y さん',
    detail: '東京工業大学 情報工学系 4年生 / 25卒',
    result: 'IT企業に内定',
  },
  {
    quote: 'ES管理が特に助かりました。企業ごとにガクチカをカスタマイズしていたので前に何を書いたか見返せるのはすごく重要でした。',
    name: 'S.A さん',
    detail: '慶應義塾大学 法学部 3年生 / 26卒',
    result: 'コンサル内定',
  },
];

const UNIVERSITIES = [
  '東京大学', '京都大学', '早稲田大学', '慶應義塾大学', '東京工業大学',
  '一橋大学', '大阪大学', '東北大学', '名古屋大学', '九州大学',
];

const F = "'Noto Sans JP', sans-serif";
const G = "var(--font-geist), -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// App mockup — uses CSS variables, dark-mode-aware automatically
// ─────────────────────────────────────────────────────────────────────────────

function AppMockup() {
  const cards = [
    { company: 'Mercari',    role: 'バックエンドエンジニア', stage: 'ES提出',  color: '#8B5CF6', deadline: 'あと2日' },
    { company: 'Recruit',    role: 'プロダクトマネージャー', stage: '一次面接', color: '#3B82F6', deadline: 'あと5日' },
    { company: 'CyberAgent', role: 'Webエンジニア',          stage: '最終面接', color: '#EC4899', deadline: null },
    { company: 'Sansan',     role: 'バックエンドエンジニア', stage: '内々定',   color: '#10B981', deadline: null },
  ];

  return (
    <div style={{
      background: 'var(--surface-gray)',
      borderRadius: 20,
      border: '1px solid var(--border-gray)',
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      maxWidth: '100%',
      width: '100%',
    }}>
      {/* Mock toolbar */}
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-gray)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={20} variant="dark" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-navy)', fontFamily: G, letterSpacing: '-0.02em' }}>Applyd</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
      </div>

      {/* Mock stats */}
      <div style={{ padding: '14px 18px 0', display: 'flex', gap: 10 }}>
        {[
          { label: '選考中', value: '12' },
          { label: '面接中', value: '3' },
          { label: '内定',   value: '1' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1,
            background: 'var(--card-bg)',
            borderRadius: 10,
            border: '1px solid var(--border-gray)',
            padding: '10px 12px',
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', margin: 0, fontFamily: G, letterSpacing: '-0.03em' }}>{s.value}</p>
            <p style={{ fontSize: 10, color: 'var(--muted-text)', margin: '2px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mock cards */}
      <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map(card => (
          <div key={card.company} style={{
            background: 'var(--card-bg)',
            borderRadius: 11,
            border: '1px solid var(--border-gray)',
            borderLeft: `3px solid ${card.color}`,
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', margin: 0, fontFamily: F, letterSpacing: '0.02em' }}>{card.company}</p>
              <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: '1px 0 0', fontFamily: F, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.role}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 500, color: card.color,
                background: `${card.color}20`, border: `1px solid ${card.color}30`,
                borderRadius: 9999, padding: '2px 8px', fontFamily: F, letterSpacing: '0.04em',
              }}>{card.stage}</span>
              {card.deadline && (
                <span style={{ fontSize: 10, color: '#EF4444', fontFamily: G, fontWeight: 600 }}>{card.deadline}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Check icon
// ─────────────────────────────────────────────────────────────────────────────

function CheckIcon({ blue }: { blue?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="7" fill={blue ? 'rgba(37,99,235,0.15)' : 'rgba(34,197,94,0.15)'} />
      <path d="M4.5 7.5l1.75 1.75L9.5 5" stroke={blue ? 'var(--accent-blue)' : '#22C55E'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function JaLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/ja/dashboard');
  }, [user, loading, router]);

  if (loading || user) return <div className="min-h-screen bg-background" />;

  return (
    <div style={{ fontFamily: F, background: 'var(--background)', color: 'var(--brand-navy)', overflowX: 'hidden' }}>

      {/* ─── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--background)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-gray)',
      }}>
        <div style={{
          maxWidth: 1160, margin: '0 auto', padding: '0 28px',
          height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/ja" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <Logo size={26} variant="dark" />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-navy)', letterSpacing: '-0.03em', fontFamily: G }}>Applyd</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link
              href="#features"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >機能</Link>
            <Link
              href="#pricing"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >料金</Link>
            <div style={{ width: 1, height: 16, background: 'var(--border-gray)', margin: '0 4px' }} />
            <Link
              href="/ja/login"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >ログイン</Link>
            <Link
              href="/ja/signup"
              style={{
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                color: '#fff', background: 'var(--accent-blue)', borderRadius: 9999,
                padding: '8px 20px', textDecoration: 'none', fontFamily: F,
                marginLeft: 4, transition: 'opacity 150ms ease, transform 100ms ease-out',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >無料で始める</Link>
            <div style={{ marginLeft: 8 }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 28px 96px' }}>
        <div className="ja-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left — text */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: 28 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: 'var(--accent-blue)', fontFamily: F }}>就活生のための無料ツール</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              color: 'var(--brand-navy)',
              margin: '0 0 24px',
              fontFamily: F,
            }}>
              就活を、<br />
              もっと<span style={{
                color: 'var(--accent-blue)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--accent-blue)',
                textDecorationThickness: '3px',
                textUnderlineOffset: '6px',
              }}>シンプル</span>に。
            </h1>

            <p style={{
              fontSize: 16, fontWeight: 400, letterSpacing: '0.05em',
              lineHeight: 1.95, color: 'var(--muted-text)', maxWidth: 440,
              margin: '0 0 36px', fontFamily: F,
            }}>
              エントリーから内定まですべての選考を一元管理。
              AIが面接対策と選考対策を自動でサポートします。
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
              <Link
                href="/ja/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 50, padding: '0 36px', borderRadius: 9999,
                  background: 'var(--accent-blue)', color: '#fff',
                  fontSize: 15, fontWeight: 600, letterSpacing: '0.05em',
                  textDecoration: 'none', fontFamily: F,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'opacity 150ms ease, transform 100ms ease-out',
                }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >無料で始める</Link>
              <a
                href="#features"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 50, padding: '0 28px', borderRadius: 9999,
                  background: 'transparent', color: 'var(--brand-navy)',
                  border: '1.5px solid var(--border-gray)',
                  fontSize: 15, fontWeight: 400, letterSpacing: '0.05em',
                  textDecoration: 'none', fontFamily: F,
                  transition: 'border-color 150ms ease, background 150ms ease, transform 100ms ease-out',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-emphasis)'; el.style.background = 'var(--surface-gray)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-gray)'; el.style.background = 'transparent'; (el as HTMLElement).style.transform = 'scale(1)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >機能を見る</a>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.06em', fontFamily: F }}>
              クレジットカード不要・完全無料でスタート
            </p>

            {/* Trust stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--border-gray)', flexWrap: 'wrap' }}>
              {[
                { num: '5,000+', label: '就活生が利用中' },
                { num: '50社',   label: '平均管理社数' },
                { num: '97%',    label: '継続利用率' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', margin: 0, fontFamily: G, letterSpacing: '-0.03em' }}>{s.num}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: '2px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — app mockup */}
          <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ─── University strip ─────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)', padding: '18px 28px', overflow: 'hidden', background: 'var(--card-bg)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.12em', fontFamily: F, marginRight: 8, whiteSpace: 'nowrap' }}>
            利用している大学
          </span>
          {UNIVERSITIES.map((u, i) => (
            <span key={u} style={{
              fontSize: 12, color: 'var(--muted-text)', letterSpacing: '0.08em',
              fontFamily: F, whiteSpace: 'nowrap',
              paddingRight: i < UNIVERSITIES.length - 1 ? 12 : 0,
              borderRight: i < UNIVERSITIES.length - 1 ? '1px solid var(--border-gray)' : 'none',
            }}>{u}</span>
          ))}
        </div>
      </div>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>主な機能</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <div key={f.n} className="ja-feature-row" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
              padding: '48px 0',
              borderTop: '1px solid var(--border-gray)',
            }}>
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
                    color: 'var(--text-tertiary)', fontFamily: F, textTransform: 'uppercase',
                  }}>{f.tag}</span>
                </div>
                <p style={{
                  fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 700,
                  letterSpacing: '-0.015em', lineHeight: 1.3,
                  color: 'var(--brand-navy)', margin: '0 0 16px', fontFamily: F,
                }}>{f.title}</p>
                <p style={{
                  fontSize: 15, fontWeight: 400, letterSpacing: '0.05em',
                  lineHeight: 1.95, color: 'var(--muted-text)', margin: 0, fontFamily: F,
                }}>{f.body}</p>
              </div>

              {/* Visual placeholder */}
              <div style={{ order: i % 2 === 0 ? 1 : 0, maxWidth: '100%', overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-gray)',
                  borderRadius: 16,
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 20,
                }}>
                  {i === 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                      {['#64748B','#8B5CF6','#3B82F6','#EC4899','#22C55E'].map((c, j) => (
                        <div key={c} style={{
                          flex: 1, maxWidth: 48, background: c + '20', border: `1px solid ${c}40`,
                          borderRadius: 8, display: 'flex', flexDirection: 'column',
                          gap: 6, padding: 8,
                          height: [90,130,110,70,150][j],
                        }}>
                          {[...Array([2,4,3,1,4][j])].map((_,k) => (
                            <div key={k} style={{ height: 16, borderRadius: 4, background: c + '50' }} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 1 && (
                    <div style={{ width: '100%', maxWidth: 280 }}>
                      <div style={{ height: 10, borderRadius: 4, background: 'rgba(37,99,235,0.2)', marginBottom: 10, width: '60%' }} />
                      {['よくある質問①：入社後のキャリアパスは？','よくある質問②：チームの雰囲気は？','よくある質問③：残業について教えてください'].map((q, j) => (
                        <div key={j} style={{
                          padding: '9px 12px', borderRadius: 8,
                          background: 'var(--surface-gray)', border: '1px solid var(--border-gray)',
                          marginBottom: 6,
                          fontSize: 10, color: 'var(--muted-text)', fontFamily: F, letterSpacing: '0.04em',
                        }}>{q}</div>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div style={{ width: '100%', maxWidth: 280 }}>
                      {['志望動機','自己PR','ガクチカ'].map((label, j) => (
                        <div key={j} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: 'var(--muted-text)', fontFamily: F, letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                          <div style={{
                            height: j === 0 ? 44 : 32, borderRadius: 6,
                            background: 'var(--surface-gray)', border: '1px solid var(--border-gray)',
                            position: 'relative',
                          }}>
                            <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 9, color: 'var(--text-tertiary)', fontFamily: G }}>
                              {[148, 97, 203][j]} / {[400, 400, 400][j]}文字
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 3 && (
                    <div style={{ width: '100%', maxWidth: 280 }}>
                      {[
                        { label: 'Mercari ES締め切り', days: 2, color: '#EF4444' },
                        { label: 'Recruit 説明会',     days: 5, color: '#F59E0B' },
                        { label: 'DeNA 一次面接',      days: 9, color: 'var(--muted-text)' },
                      ].map(d => (
                        <div key={d.label} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 8,
                          background: 'var(--surface-gray)', border: '1px solid var(--border-gray)', marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 11, color: 'var(--brand-navy)', fontFamily: F, letterSpacing: '0.04em' }}>{d.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: d.color, fontFamily: G }}>あと{d.days}日</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Mock Interview callout ───────────────────────────────────────── */}
      <section style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)', padding: '72px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }} className="ja-mock-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 9999, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', marginBottom: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>Pro</span>
              <span style={{ fontSize: 10, color: 'var(--accent-blue)', fontFamily: F, letterSpacing: '0.06em' }}>面接前日に使える</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'var(--brand-navy)', margin: '0 0 16px', fontFamily: F }}>
              本番同様のAI模擬面接。<br />企業別・職種別で対策。
            </h2>
            <p style={{ fontSize: 14, letterSpacing: '0.05em', lineHeight: 1.95, color: 'var(--muted-text)', margin: '0 0 28px', fontFamily: F }}>
              JDを貼り付けると、その企業に特化した質問をAIが生成。回答するとSTAR法でフィードバックを返します。テキストでも音声でも使えます。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['企業別・職種別の質問自動生成', 'STAR法スコア（1〜5点）とフィードバック', '音声入力対応・セッション保存', 'トランスクリプトをダウンロード'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckIcon blue />
                  <span style={{ fontSize: 13, color: 'var(--brand-navy)', fontFamily: F, letterSpacing: '0.04em' }}>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/ja/signup"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 46, padding: '0 28px', borderRadius: 10,
                background: 'var(--accent-blue)', color: '#fff',
                fontSize: 14, fontWeight: 600, letterSpacing: '0.05em',
                textDecoration: 'none', fontFamily: F,
                transition: 'opacity 150ms ease, transform 100ms ease-out',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >Proで始める</Link>
          </div>

          {/* Mock interview preview */}
          <div style={{ background: 'var(--surface-gray)', borderRadius: 16, border: '1px solid var(--border-gray)', padding: 24, overflow: 'hidden' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', fontFamily: F, textTransform: 'uppercase', marginBottom: 16 }}>
              AI 模擬面接
            </div>

            {/* Question */}
            <div style={{ background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border-gray)', padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#3B82F6', fontFamily: F, letterSpacing: '0.06em' }}>質問 2 / 5</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: G }}>行動面接</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--brand-navy)', margin: 0, fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.7 }}>
                困難なプロジェクトでチームをまとめた経験を教えてください。具体的にどう行動しましたか？
              </p>
            </div>

            {/* STAR feedback */}
            {[
              { label: 'Situation', rating: 'strong', note: '状況説明が明確で具体的' },
              { label: 'Task',      rating: 'okay',   note: '役割をもう少し明確に' },
              { label: 'Action',    rating: 'strong', note: '行動の詳細が非常に良い' },
              { label: 'Result',    rating: 'missing', note: '成果の数値化が必要' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: s.rating === 'strong' ? '#16A34A' : s.rating === 'okay' ? '#D97706' : '#DC2626',
                  background: s.rating === 'strong' ? 'rgba(22,163,74,0.12)' : s.rating === 'okay' ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.12)',
                  borderRadius: 4, padding: '2px 7px', fontFamily: G, flexShrink: 0,
                }}>{s.label}</span>
                <span style={{ fontSize: 11, color: 'var(--muted-text)', fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.5 }}>{s.note}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-gray)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--muted-text)', fontFamily: F }}>総合スコア</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n <= 3 ? 'var(--accent-blue)' : 'var(--border-gray)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pipeline journey ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface-gray)', padding: '80px 28px', borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>就活の全ステージ</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand-navy)', margin: '0 0 48px', fontFamily: F, lineHeight: 1.25 }}>
            就活のすべてのステージに<br />Applydが寄り添います。
          </h2>

          <div className="ja-pipeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.label} style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-gray)',
                borderTop: `3px solid ${stage.color}`,
                borderRadius: '0 0 12px 12px',
                padding: '16px 14px',
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)',
                  margin: '0 0 6px', fontFamily: G, letterSpacing: '0.1em',
                }}>{stage.num}</p>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)',
                  margin: 0, fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.4,
                }}>{stage.label}</p>
                <div style={{
                  width: 20, height: 3, borderRadius: 99,
                  background: stage.color, marginTop: 10, opacity: 0.6,
                }} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 20, letterSpacing: '0.06em', fontFamily: F }}>
            エントリーから承諾まで — 就活のあらゆる場面でApplydが現在地を教えてくれます。
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>利用者の声</span>
        </div>

        <div className="ja-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              padding: '28px 24px',
              borderRadius: 16,
              border: '1px solid var(--border-gray)',
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}>
              <div>
                <p style={{
                  fontSize: 32, fontWeight: 700, color: 'var(--accent-blue)',
                  margin: '0 0 14px', fontFamily: G, lineHeight: 1, opacity: 0.3,
                }}>&ldquo;</p>
                <p style={{
                  fontSize: 14, fontWeight: 400, lineHeight: 1.95,
                  letterSpacing: '0.06em', color: 'var(--brand-navy)',
                  margin: 0, fontFamily: F,
                }}>{t.quote}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-navy)', margin: 0, fontFamily: F, letterSpacing: '0.04em' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted-text)', margin: '3px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{t.detail}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--green-success)',
                    background: 'rgba(22,163,74,0.12)',
                    borderRadius: 9999, padding: '3px 10px',
                    fontFamily: F, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>{t.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-gray)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>料金</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand-navy)', margin: '0 0 48px', fontFamily: F }}>
            シンプルな料金体系。
          </h2>

          <div className="ja-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Free */}
            <div style={{
              padding: '32px 28px',
              borderRadius: 20,
              border: '1px solid var(--border-gray)',
              background: 'var(--background)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-text)', letterSpacing: '0.08em', margin: '0 0 18px', fontFamily: F }}>無料プラン</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 700, color: 'var(--brand-navy)', fontFamily: G, letterSpacing: '-0.04em' }}>¥0</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '0 0 24px', fontFamily: F, letterSpacing: '0.05em' }}>最大15社まで永久無料</p>
              <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {['選考パイプライン管理', '締め切り管理', '基本統計ダッシュボード', 'カレンダー連携'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckIcon />
                    <span style={{ fontSize: 13, color: 'var(--brand-navy)', fontFamily: F, letterSpacing: '0.04em' }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/ja/signup"
                style={{
                  display: 'block', textAlign: 'center', marginTop: 28,
                  padding: '12px 0', borderRadius: 9999,
                  border: '1.5px solid var(--border-gray)', color: 'var(--brand-navy)',
                  fontSize: 14, fontWeight: 500, letterSpacing: '0.05em',
                  textDecoration: 'none', fontFamily: F,
                  transition: 'border-color 150ms ease, background 150ms ease, transform 100ms ease-out',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface-gray)'; el.style.borderColor = 'var(--border-emphasis)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'var(--border-gray)'; el.style.transform = 'scale(1)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >無料で始める</Link>
            </div>

            {/* Pro */}
            <div style={{
              padding: '32px 28px',
              borderRadius: 20,
              border: '2px solid var(--accent-blue)',
              background: 'var(--background)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                background: 'var(--accent-blue)', color: '#fff',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                textAlign: 'center', padding: '4px 0', fontFamily: F,
              }}>おすすめ</div>

              <div style={{ paddingTop: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-blue)', letterSpacing: '0.08em', margin: '0 0 18px', fontFamily: F }}>Proプラン</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 700, color: 'var(--brand-navy)', fontFamily: G, letterSpacing: '-0.04em' }}>¥7,000</span>
                  <span style={{ fontSize: 14, color: 'var(--muted-text)', fontFamily: G }}>/年</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: 0, fontFamily: F, letterSpacing: '0.05em' }}>月あたり¥583（月払いは¥1,000）</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--green-success)',
                    background: 'rgba(22,163,74,0.12)',
                    borderRadius: 9999, padding: '2px 8px',
                    fontFamily: F, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>年間¥5,000お得</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {[
                    '無制限の選考管理',
                    'AI面接対策（企業別・職種別）',
                    'AI模擬面接（STAR法フィードバック）',
                    'ES管理・志望動機・ガクチカ保存',
                    'AIフォローアップメール生成',
                    'オファー交渉ガイド',
                    '週次AIコーチング',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckIcon blue />
                      <span style={{ fontSize: 13, color: 'var(--brand-navy)', fontFamily: F, letterSpacing: '0.04em' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/ja/signup"
                  style={{
                    display: 'block', textAlign: 'center', marginTop: 28,
                    padding: '12px 0', borderRadius: 9999,
                    background: 'var(--accent-blue)', color: '#fff',
                    fontSize: 14, fontWeight: 600, letterSpacing: '0.05em',
                    textDecoration: 'none', fontFamily: F,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                    transition: 'opacity 150ms ease, transform 100ms ease-out',
                  }}
                  onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >Proを始める</Link>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20, letterSpacing: '0.05em', fontFamily: F }}>
            クレジットカードで安全に決済 · いつでもキャンセル可能 · 返金保証あり
          </p>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: '#060810', padding: '96px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 48, height: 2, background: 'var(--accent-blue)', margin: '0 auto 28px' }} />
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
            letterSpacing: '-0.025em', lineHeight: 1.18,
            color: '#fff', margin: '0 0 18px', fontFamily: F,
          }}>今日から、就活を<br />シンプルにしよう。</h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.06em', margin: '0 0 36px', fontFamily: F, lineHeight: 1.8,
          }}>5,000人以上の就活生がすでに使い始めています。</p>
          <Link
            href="/ja/signup"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 52, padding: '0 48px', borderRadius: 9999,
              background: '#fff', color: '#060810',
              fontSize: 16, fontWeight: 700, letterSpacing: '0.05em',
              textDecoration: 'none', fontFamily: F,
              transition: 'opacity 150ms ease, transform 100ms ease-out',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >無料で始める</Link>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 14, letterSpacing: '0.06em', fontFamily: F }}>
            クレジットカード不要
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#060810', padding: '48px 28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="ja-footer-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 36 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Logo size={22} variant="dark" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', letterSpacing: '0.05em', margin: 0, fontFamily: F, lineHeight: 1.8 }}>
                就活生のために<br />就活生が作りました。
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: F, textTransform: 'uppercase' }}>プロダクト</p>
                {[
                  { label: '機能について', href: '#features' },
                  { label: '料金プラン',   href: '#pricing' },
                  { label: 'ダッシュボード', href: '/ja/dashboard' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: '#64748B', margin: '0 0 10px', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: F, transition: 'color 150ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                  >{l.label}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: F, textTransform: 'uppercase' }}>サポート</p>
                {[
                  { label: 'よくある質問',         href: '/ja/faq' },
                  { label: 'プライバシーポリシー', href: '/ja/privacy' },
                  { label: '利用規約',             href: '/ja/terms' },
                  { label: 'お問い合わせ',         href: '/ja/support' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: '#64748B', margin: '0 0 10px', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: F, transition: 'color 150ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                  >{l.label}</Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', margin: 0, fontFamily: F }}>© {new Date().getFullYear()} Applyd. All rights reserved.</p>
            <LocaleSwitcher />
          </div>
        </div>
      </footer>

      {/* ─── Responsive CSS ───────────────────────────────────────────────── */}
      <style>{`
        .ja-hero-grid { grid-template-columns: 1fr 1fr; gap: 64px; }
        .ja-mock-grid { grid-template-columns: 1fr 1fr; gap: 56px; }
        .ja-feature-row { grid-template-columns: 1fr 1fr; gap: 64px; }
        .ja-pipeline-grid { grid-template-columns: repeat(5, 1fr); }
        .ja-testimonials-grid { grid-template-columns: repeat(3, 1fr); }
        .ja-pricing-grid { grid-template-columns: 1fr 1fr; }
        .ja-footer-top { flex-direction: row; }

        @media (max-width: 900px) {
          .ja-hero-grid, .ja-mock-grid, .ja-feature-row {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .ja-pipeline-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ja-testimonials-grid { grid-template-columns: 1fr !important; }
          .ja-pricing-grid { grid-template-columns: 1fr !important; }
          nav a[href="#features"], nav a[href="#pricing"] { display: none !important; }
        }
        @media (max-width: 600px) {
          .ja-footer-top { flex-direction: column !important; }
          section { padding-left: 16px !important; padding-right: 16px !important; }
          nav > div { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
