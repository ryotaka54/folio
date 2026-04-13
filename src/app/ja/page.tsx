'use client';

import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

// ────────────────────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────────────────────

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
    body: 'エントリーから内定まで、すべての選考をパイプライン形式で一元管理。複数の企業を同時に追いかけながら、何も見落とさない。',
    tag: '選考管理',
  },
  {
    n: '二',
    title: 'AIが、面接の準備を一瞬で。',
    body: '企業名と職種を入れるだけで、その企業に特化した頻出質問と対策をAIが自動生成。前日の深夜でも即座に準備できる。',
    tag: 'AI面接対策',
  },
  {
    n: '三',
    title: 'ESを書いたら、ここに保存。',
    body: '志望動機・自己PR・ガクチカを企業ごとに保存。文字数カウント付きで、提出前の最終確認もスムーズに。',
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
    quote: '正直、Notionで管理していた頃は何社受けているか把握できていなかった。Applydを使い始めてから、どの選考がどこにいるか一瞬でわかるようになりました。',
    name: 'K.M さん',
    detail: '早稲田大学 商学部 3年生 / 26卒',
    result: '内定 3社',
  },
  {
    quote: 'AI面接対策が本当に便利。メルカリの最終面接の前日に使ったら、聞かれた質問の7割が対策に出てた。偶然じゃないと思う。',
    name: 'T.Y さん',
    detail: '東京工業大学 情報工学系 4年生 / 25卒',
    result: 'IT企業に内定',
  },
  {
    quote: 'ES管理が特に助かりました。企業ごとにガクチカをカスタマイズしていたので、前に何を書いたか見返せるのはすごく重要でした。',
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
const G = "var(--font-geist), sans-serif";
const NAVY = '#0A0A14';
const BLUE = '#2563EB';
const MUTED = '#64748B';
const BORDER = '#E8ECF2';

// ────────────────────────────────────────────────────────────────────────────
// Logo mark SVG
// ────────────────────────────────────────────────────────────────────────────

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill={BLUE} />
      <rect x="7"  y="20" width="4" height="7" rx="1" fill="white" fillOpacity="0.35" />
      <rect x="14" y="13" width="4" height="14" rx="1" fill="white" fillOpacity="0.65" />
      <rect x="21" y="7"  width="4" height="20" rx="1" fill="white" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// App mockup — static, pixel-precise representation of the dashboard
// ────────────────────────────────────────────────────────────────────────────

function AppMockup() {
  const cards = [
    { company: 'Mercari',    role: 'バックエンドエンジニア', stage: 'ES提出',  color: '#8B5CF6', deadline: 'あと2日' },
    { company: 'Recruit',    role: 'プロダクトマネージャー', stage: '一次面接', color: '#3B82F6', deadline: 'あと5日' },
    { company: 'CyberAgent', role: 'Webエンジニア',          stage: '最終面接', color: '#EC4899', deadline: null },
    { company: 'Sansan',     role: 'バックエンドエンジニア', stage: '内々定',   color: '#10B981', deadline: null },
  ];

  return (
    <div style={{
      background: '#F8FAFC',
      borderRadius: 20,
      border: `1px solid ${BORDER}`,
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {/* Mock toolbar */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: G, letterSpacing: '-0.02em' }}>Applyd</span>
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
            background: '#fff',
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            padding: '10px 12px',
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0, fontFamily: G, letterSpacing: '-0.03em' }}>{s.value}</p>
            <p style={{ fontSize: 10, color: MUTED, margin: '2px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mock cards */}
      <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map(card => (
          <div key={card.company} style={{
            background: '#fff',
            borderRadius: 11,
            border: `1px solid ${BORDER}`,
            borderLeft: `3px solid ${card.color}`,
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0, fontFamily: F, letterSpacing: '0.02em' }}>{card.company}</p>
              <p style={{ fontSize: 11, color: MUTED, margin: '1px 0 0', fontFamily: F, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.role}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 500, color: card.color,
                background: `${card.color}14`, border: `1px solid ${card.color}25`,
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

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function JaLandingPage() {
  return (
    <div style={{ fontFamily: F, background: '#fff', color: NAVY, overflowX: 'hidden' }}>

      {/* ─── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          maxWidth: 1160, margin: '0 auto', padding: '0 28px',
          height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/ja" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <LogoMark size={26} />
            <span style={{ fontSize: 17, fontWeight: 700, color: NAVY, letterSpacing: '-0.03em', fontFamily: G }}>Applyd</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="#features" style={{ fontSize: 13, color: MUTED, letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F }}>機能</Link>
            <Link href="#pricing" style={{ fontSize: 13, color: MUTED, letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F }}>料金</Link>
            <div style={{ width: 1, height: 16, background: BORDER, margin: '0 4px' }} />
            <Link href="/login" style={{ fontSize: 13, color: MUTED, letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F }}>ログイン</Link>
            <Link href="/ja/onboarding" style={{
              fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
              color: '#fff', background: BLUE, borderRadius: 9999,
              padding: '7px 20px', textDecoration: 'none', fontFamily: F,
              marginLeft: 4,
            }}>無料で始める</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 28px 104px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

          {/* Left — text */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 28, height: 1, background: BLUE }} />
              <span style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.18em',
                color: BLUE, fontFamily: F, textTransform: 'uppercase',
              }}>就活生のための無料ツール</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(42px, 5.5vw, 62px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.12,
              color: NAVY,
              margin: '0 0 28px',
              fontFamily: F,
            }}>
              就活を、<br />
              もっと<span style={{ color: BLUE }}>シンプル</span>に。
            </h1>

            {/* Subtext */}
            <p style={{
              fontSize: 17, fontWeight: 400, letterSpacing: '0.05em',
              lineHeight: 1.95, color: MUTED, maxWidth: 440,
              margin: '0 0 36px', fontFamily: F,
            }}>
              エントリーから内定まで、すべての選考を一元管理。
              AIが面接対策と選考対策を自動でサポートします。
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
              <Link href="/ja/onboarding" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 50, padding: '0 36px', borderRadius: 9999,
                background: BLUE, color: '#fff',
                fontSize: 15, fontWeight: 500, letterSpacing: '0.05em',
                textDecoration: 'none', fontFamily: F,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              }}>無料で始める</Link>
              <a href="#features" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 50, padding: '0 28px', borderRadius: 9999,
                background: 'transparent', color: NAVY,
                border: `1.5px solid ${BORDER}`,
                fontSize: 15, fontWeight: 400, letterSpacing: '0.05em',
                textDecoration: 'none', fontFamily: F,
              }}>機能を見る</a>
            </div>

            <p style={{ fontSize: 12, color: '#94A3B8', letterSpacing: '0.06em', fontFamily: F }}>
              クレジットカード不要・完全無料でスタート
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 20, marginTop: 36, paddingTop: 28, borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '5,000+', label: '就活生が利用中' },
                { num: '50社',   label: '平均管理社数' },
                { num: '97%',    label: '継続利用率' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: NAVY, margin: 0, fontFamily: G, letterSpacing: '-0.03em' }}>{s.num}</p>
                  <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — app mockup */}
          <div>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ─── University strip ─────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '20px 28px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', fontFamily: F, marginRight: 8, whiteSpace: 'nowrap' }}>
            利用している大学
          </span>
          {UNIVERSITIES.map((u, i) => (
            <span key={u} style={{
              fontSize: 12, color: MUTED, letterSpacing: '0.08em',
              fontFamily: F, whiteSpace: 'nowrap',
              paddingRight: i < UNIVERSITIES.length - 1 ? 12 : 0,
              borderRight: i < UNIVERSITIES.length - 1 ? `1px solid ${BORDER}` : 'none',
            }}>{u}</span>
          ))}
        </div>
      </div>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '112px 28px' }}>
        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div style={{ width: 28, height: 1, background: BLUE }} />
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: BLUE, fontFamily: F, textTransform: 'uppercase' }}>主な機能</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <div key={f.n} style={{
              display: 'grid',
              gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
              gap: 80,
              alignItems: 'center',
              padding: '56px 0',
              borderTop: `1px solid ${BORDER}`,
            }}>
              {/* Number + tag */}
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                    color: '#94A3B8', fontFamily: F, textTransform: 'uppercase',
                  }}>{f.tag}</span>
                </div>
                <p style={{
                  fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700,
                  letterSpacing: '-0.015em', lineHeight: 1.25,
                  color: NAVY, margin: '0 0 18px', fontFamily: F,
                }}>{f.title}</p>
                <p style={{
                  fontSize: 16, fontWeight: 400, letterSpacing: '0.05em',
                  lineHeight: 1.95, color: MUTED, margin: 0, fontFamily: F,
                }}>{f.body}</p>
              </div>

              {/* Visual placeholder */}
              <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                <div style={{
                  background: '#F8FAFC',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Abstract representation of each feature */}
                  {i === 0 && (
                    <div style={{ display: 'flex', gap: 8, padding: 20 }}>
                      {['#64748B','#8B5CF6','#3B82F6','#EC4899','#22C55E'].map((c, j) => (
                        <div key={c} style={{
                          width: 40, background: c + '20', border: `1px solid ${c}40`,
                          borderRadius: 8, display: 'flex', flexDirection: 'column',
                          gap: 6, padding: 8,
                          height: [100,140,120,80,160][j],
                          alignSelf: 'flex-end',
                        }}>
                          {[...Array(Math.floor([2,4,3,1,5][j] / 1))].map((_,k) => (
                            <div key={k} style={{ height: 20, borderRadius: 4, background: c + '40' }} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 1 && (
                    <div style={{ padding: 24, width: '100%', maxWidth: 280 }}>
                      <div style={{ height: 12, borderRadius: 4, background: '#2563EB20', marginBottom: 10, width: '70%' }} />
                      {['よくある質問①：入社後のキャリアパスは？','よくある質問②：チームの雰囲気は？','よくある質問③：残業について教えてください'].map((q, j) => (
                        <div key={j} style={{
                          padding: '10px 12px', borderRadius: 8,
                          background: '#fff', border: `1px solid ${BORDER}`,
                          marginBottom: 6,
                          fontSize: 10, color: MUTED, fontFamily: F, letterSpacing: '0.04em',
                        }}>{q}</div>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div style={{ padding: 24, width: '100%', maxWidth: 280 }}>
                      {['志望動機','自己PR','ガクチカ'].map((label, j) => (
                        <div key={j} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: MUTED, fontFamily: F, letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                          <div style={{
                            height: j === 0 ? 48 : 36, borderRadius: 6,
                            background: '#fff', border: `1px solid ${BORDER}`,
                            position: 'relative',
                          }}>
                            <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 9, color: '#94A3B8', fontFamily: G }}>
                              {[148, 97, 203][j]} / {[400, 400, 400][j]}文字
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 3 && (
                    <div style={{ padding: 24, width: '100%' }}>
                      {[
                        { label: 'Mercari ES締め切り', days: 2, color: '#EF4444' },
                        { label: 'Recruit 説明会',     days: 5, color: '#F59E0B' },
                        { label: 'DeNA 一次面接',      days: 9, color: '#94A3B8' },
                      ].map(d => (
                        <div key={d.label} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 8,
                          background: '#fff', border: `1px solid ${BORDER}`, marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 11, color: NAVY, fontFamily: F, letterSpacing: '0.04em' }}>{d.label}</span>
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

      {/* ─── Pipeline journey ─────────────────────────────────────────────── */}
      <section style={{ background: '#F8FAFC', padding: '96px 28px', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: BLUE }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: BLUE, fontFamily: F, textTransform: 'uppercase' }}>就活の全ステージ</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: NAVY, margin: '0 0 56px', fontFamily: F, lineHeight: 1.2 }}>
            就活のすべてのステージに、<br />Applydが寄り添います。
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.label} style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderTop: `3px solid ${stage.color}`,
                borderRadius: '0 0 12px 12px',
                padding: '18px 16px',
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 500, color: '#94A3B8',
                  margin: '0 0 6px', fontFamily: G, letterSpacing: '0.1em',
                }}>{stage.num}</p>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: NAVY,
                  margin: 0, fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.4,
                }}>{stage.label}</p>
                <div style={{
                  width: 24, height: 3, borderRadius: 99,
                  background: stage.color, marginTop: 12, opacity: 0.6,
                }} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 24, letterSpacing: '0.06em', fontFamily: F }}>
            エントリーから承諾まで — 就活のあらゆる場面で、Applydが現在地を教えてくれます。
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '112px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div style={{ width: 28, height: 1, background: BLUE }} />
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: BLUE, fontFamily: F, textTransform: 'uppercase' }}>利用者の声</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              padding: '32px 28px',
              borderRadius: 16,
              border: `1px solid ${BORDER}`,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 24,
            }}>
              {/* Opening mark */}
              <div>
                <p style={{
                  fontSize: 36, fontWeight: 700, color: BLUE + '30',
                  margin: '0 0 16px', fontFamily: G, lineHeight: 1,
                }}>&ldquo;</p>
                <p style={{
                  fontSize: 14, fontWeight: 400, lineHeight: 1.95,
                  letterSpacing: '0.06em', color: NAVY,
                  margin: 0, fontFamily: F,
                }}>{t.quote}</p>
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0, fontFamily: F, letterSpacing: '0.04em' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: '3px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{t.detail}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#16A34A',
                    background: '#DCFCE7', borderRadius: 9999, padding: '3px 10px',
                    fontFamily: F, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>{t.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#F8FAFC', borderTop: `1px solid ${BORDER}`, padding: '112px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: BLUE }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: BLUE, fontFamily: F, textTransform: 'uppercase' }}>料金</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: NAVY, margin: '0 0 56px', fontFamily: F }}>
            シンプルな料金体系。
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Free */}
            <div style={{
              padding: '36px 32px',
              borderRadius: 20,
              border: `1px solid ${BORDER}`,
              background: '#fff',
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: MUTED, letterSpacing: '0.08em', margin: '0 0 20px', fontFamily: F }}>無料プラン</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 700, color: NAVY, fontFamily: G, letterSpacing: '-0.04em' }}>¥0</span>
              </div>
              <p style={{ fontSize: 12, color: MUTED, margin: '0 0 28px', fontFamily: F, letterSpacing: '0.05em' }}>最大15社まで永久無料</p>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['選考パイプライン管理', '締め切り管理', '基本統計ダッシュボード', 'カレンダー連携'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill="#E8F5E9" />
                      <path d="M4.5 7.5l1.75 1.75L9.5 5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 13, color: NAVY, fontFamily: F, letterSpacing: '0.04em' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/ja/onboarding" style={{
                display: 'block', textAlign: 'center', marginTop: 32,
                padding: '13px 0', borderRadius: 9999,
                border: `1.5px solid ${BORDER}`, color: NAVY,
                fontSize: 14, fontWeight: 500, letterSpacing: '0.05em',
                textDecoration: 'none', fontFamily: F,
              }}>無料で始める</Link>
            </div>

            {/* Pro */}
            <div style={{
              padding: '36px 32px',
              borderRadius: 20,
              border: `2px solid ${BLUE}`,
              background: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Top ribbon */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                background: BLUE, color: '#fff',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.1em',
                textAlign: 'center', padding: '5px 0', fontFamily: F,
              }}>おすすめ</div>

              <div style={{ paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: BLUE, letterSpacing: '0.08em', margin: '0 0 20px', fontFamily: F }}>Proプラン</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 44, fontWeight: 700, color: NAVY, fontFamily: G, letterSpacing: '-0.04em' }}>¥7,000</span>
                  <span style={{ fontSize: 14, color: MUTED, fontFamily: G }}>/年</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, fontFamily: F, letterSpacing: '0.05em' }}>月あたり¥583（月払いは¥1,000）</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#16A34A',
                    background: '#DCFCE7', borderRadius: 9999, padding: '2px 8px',
                    fontFamily: F, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>年間¥5,000お得</span>
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    '無制限の選考管理',
                    'AI面接対策（企業別・職種別）',
                    'ES管理・志望動機・ガクチカ保存',
                    'AIフォローアップメール生成',
                    'オファー交渉ガイド',
                    '週次AIコーチング',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="#DBEAFE" />
                        <path d="M4.5 7.5l1.75 1.75L9.5 5" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 13, color: NAVY, fontFamily: F, letterSpacing: '0.04em' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/ja/onboarding" style={{
                  display: 'block', textAlign: 'center', marginTop: 32,
                  padding: '13px 0', borderRadius: 9999,
                  background: BLUE, color: '#fff',
                  fontSize: 14, fontWeight: 500, letterSpacing: '0.05em',
                  textDecoration: 'none', fontFamily: F,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                }}>Proを始める</Link>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 20, letterSpacing: '0.05em', fontFamily: F }}>
            クレジットカードで安全に決済 · いつでもキャンセル可能 · 返金保証あり
          </p>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: NAVY, padding: '112px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 48, height: 2, background: BLUE, margin: '0 auto 32px' }} />
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 700,
            letterSpacing: '-0.025em', lineHeight: 1.15,
            color: '#fff', margin: '0 0 20px', fontFamily: F,
          }}>今日から、就活を<br />シンプルにしよう。</h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.06em', margin: '0 0 40px', fontFamily: F, lineHeight: 1.8,
          }}>5,000人以上の就活生が、すでに使い始めています。</p>
          <Link href="/ja/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: 54, padding: '0 48px', borderRadius: 9999,
            background: '#fff', color: NAVY,
            fontSize: 16, fontWeight: 600, letterSpacing: '0.05em',
            textDecoration: 'none', fontFamily: F,
          }}>無料で始める</Link>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 16, letterSpacing: '0.06em', fontFamily: F }}>
            クレジットカード不要
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#060810', padding: '48px 28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <LogoMark size={22} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', letterSpacing: '0.05em', margin: 0, fontFamily: F, lineHeight: 1.8 }}>
                就活生のために、<br />就活生が作りました。
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: F, textTransform: 'uppercase' }}>プロダクト</p>
                {[
                  { label: '機能について', href: '#features' },
                  { label: '料金プラン', href: '#pricing' },
                  { label: 'ダッシュボード', href: '/ja/dashboard' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: '#64748B', margin: '0 0 10px', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: F }}>{l.label}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: F, textTransform: 'uppercase' }}>サポート</p>
                {[
                  { label: 'プライバシーポリシー', href: '/privacy' },
                  { label: '利用規約', href: '/terms' },
                  { label: 'お問い合わせ', href: '/contact' },
                  { label: 'English →', href: '/' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: '#64748B', margin: '0 0 10px', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: F }}>{l.label}</Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', margin: 0, fontFamily: F }}>© 2026 Applyd. All rights reserved.</p>
            <p style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', margin: 0, fontFamily: G }}>useapplyd.com/ja</p>
          </div>
        </div>
      </footer>

      {/* ─── Mobile responsive ────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          /* Hero: stack */
          section > div[style*="grid-template-columns: 1fr 1fr"][style*="gap: 72px"] {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          /* Features: stack */
          section > div > div[style*="grid-template-columns: 1fr 1fr"][style*="gap: 80px"] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          /* Pipeline: 2 columns */
          div[style*="repeat(5, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          /* Testimonials: stack */
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          /* Pricing: stack */
          div[style*="grid-template-columns: 1fr 1fr"][style*="gap: 20px"] {
            grid-template-columns: 1fr !important;
          }
          /* Trust badges: wrap */
          div[style*="gap: 20px"][style*="border-top"] {
            gap: 16px !important;
            flex-wrap: wrap;
          }
          /* Nav links: hide middle links */
          nav a[href="#features"], nav a[href="#pricing"] {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          /* Section padding */
          section, div[id="pricing"] { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
