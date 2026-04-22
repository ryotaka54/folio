'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';
import ProductWalkthrough from '@/components/ProductWalkthrough';
import { motion, useInView } from 'framer-motion';

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
    body: 'エントリーから内定まですべての選考をパイプライン形式で一元管理。複数の企業を同時に追いかけながら何も見落とさない。スプレッドシートとはもう、さよならです。',
    tag: '選考管理',
  },
  {
    n: '二',
    title: 'AIと本番さながらの模擬面接。',
    body: '企業名と職種を入力するだけで、その企業に特化した質問をAIが生成。テキストでも音声でも答えられ、STAR法でスコアリング。前日の深夜でも、面接本番と同じ緊張感で練習できる。',
    tag: 'AI模擬面接',
    isNew: true,
  },
  {
    n: '三',
    title: 'AIが、面接の準備を一瞬で。',
    body: '企業名と職種を入れるだけでその企業に特化した頻出質問と対策をAIが自動生成。前日の深夜でも即座に準備できる。人事が実際に聞く質問が、あなたの手元に届く。',
    tag: 'AI面接対策',
  },
  {
    n: '四',
    title: 'ESを書いたら、ここに保存。',
    body: '志望動機・自己PR・ガクチカを企業ごとに保存。文字数カウント付きで提出前の最終確認もスムーズに。過去のESを見返してアップデートするのも、一瞬でできる。',
    tag: 'ES管理',
  },
  {
    n: '五',
    title: '締め切りを、絶対に見逃さない。',
    body: '説明会・ES・面接のすべての期限を自動でトラッキング。あと何日かが色で一目でわかる。カレンダーとも連携。締め切り直前の「しまった」がなくなる。',
    tag: '締め切り管理',
  },
];

const TESTIMONIALS = [
  {
    quote: '正直Notionで管理していた頃は何社受けているか把握できていなかった。Applydを使い始めてからどの選考がどこにいるか一瞬でわかるようになりました。今思えば、なぜもっと早く使わなかったのかと思います。',
    name: 'K.M さん',
    detail: '早稲田大学 商学部 3年生 / 26卒',
    result: '内定 3社',
    color: '#3B82F6',
  },
  {
    quote: 'AI面接対策が本当に便利。メルカリの最終面接の前日に使ったら聞かれた質問の7割が対策に出てた。偶然じゃないと思う。あれ以来、面接前は必ずApplydで練習するようになりました。',
    name: 'T.Y さん',
    detail: '東京工業大学 情報工学系 4年生 / 25卒',
    result: 'IT企業に内定',
    color: '#10B981',
  },
  {
    quote: 'ES管理が特に助かりました。企業ごとにガクチカをカスタマイズしていたので前に何を書いたか見返せるのはすごく重要でした。志望動機の使い回しが格段に楽になりました。',
    name: 'S.A さん',
    detail: '慶應義塾大学 法学部 3年生 / 26卒',
    result: 'コンサル内定',
    color: '#8B5CF6',
  },
];

const UNIVERSITIES = [
  '東京大学', '京都大学', '早稲田大学', '慶應義塾大学', '東京工業大学',
  '一橋大学', '大阪大学', '東北大学', '名古屋大学', '九州大学',
];

const F = "'Noto Sans JP', sans-serif";
const G = "var(--font-geist), -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// Animation helpers
// ─────────────────────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App mockup
// ─────────────────────────────────────────────────────────────────────────────

function AppMockup() {
  const cards = [
    { company: 'Mercari',    role: 'バックエンドエンジニア', stage: 'ES提出',  color: '#8B5CF6', deadline: 'あと2日', urgent: true },
    { company: 'Recruit',    role: 'プロダクトマネージャー', stage: '一次面接', color: '#3B82F6', deadline: 'あと5日', urgent: false },
    { company: 'CyberAgent', role: 'Webエンジニア',          stage: '最終面接', color: '#EC4899', deadline: null,     urgent: false },
    { company: 'Sansan',     role: 'バックエンドエンジニア', stage: '内々定',   color: '#10B981', deadline: null,     urgent: false },
  ];

  return (
    <div style={{
      background: 'var(--surface-gray)',
      borderRadius: 20,
      border: '1px solid var(--border-gray)',
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      width: '100%',
    }}>
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-gray)',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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

      {/* Stats */}
      <div style={{ padding: '14px 18px 0', display: 'flex', gap: 10 }}>
        {[
          { label: '選考中', value: '12' },
          { label: '面接中', value: '3' },
          { label: '内定',   value: '1' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--card-bg)', borderRadius: 10,
            border: '1px solid var(--border-gray)', padding: '10px 12px',
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', margin: 0, fontFamily: G, letterSpacing: '-0.03em' }}>{s.value}</p>
            <p style={{ fontSize: 10, color: 'var(--muted-text)', margin: '2px 0 0', fontFamily: F, letterSpacing: '0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.company}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            style={{
              background: 'var(--card-bg)',
              borderRadius: 11,
              border: '1px solid var(--border-gray)',
              borderLeft: `3px solid ${card.color}`,
              padding: '11px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
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
                <span style={{ fontSize: 10, color: card.urgent ? '#EF4444' : '#D97706', fontFamily: G, fontWeight: 600 }}>{card.deadline}</span>
              )}
            </div>
          </motion.div>
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
// Feature visuals
// ─────────────────────────────────────────────────────────────────────────────

function FeatureVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
        {['#64748B','#8B5CF6','#3B82F6','#EC4899','#22C55E'].map((c, j) => (
          <motion.div
            key={c}
            initial={{ scaleY: 0, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 + j * 0.08, ease: 'easeOut' }}
            style={{
              flex: 1, maxWidth: 48, background: c + '20', border: `1px solid ${c}40`,
              borderRadius: 8, display: 'flex', flexDirection: 'column',
              gap: 6, padding: 8,
              height: [90,130,110,70,150][j],
              transformOrigin: 'bottom',
            }}
          >
            {[...Array([2,4,3,1,4][j])].map((_,k) => (
              <div key={k} style={{ height: 16, borderRadius: 4, background: c + '50' }} />
            ))}
          </motion.div>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div style={{ width: '100%', maxWidth: 300, background: '#080C14', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: F, letterSpacing: '0.08em' }}>AI 模擬面接 · 質問 2 / 5</span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, borderLeft: '2px solid #2563EB' }}>
            <p style={{ fontSize: 11, color: '#fff', margin: 0, fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.7 }}>
              困難なプロジェクトでチームをまとめた経験を教えてください。
            </p>
          </div>
          {[
            { label: 'Situation', rating: 'strong', note: '状況説明が明確' },
            { label: 'Task',      rating: 'okay',   note: '役割をもう少し明確に' },
            { label: 'Action',    rating: 'strong', note: '行動の詳細が良い' },
            { label: 'Result',    rating: 'missing', note: '数値で示してください' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                color: s.rating === 'strong' ? '#10B981' : s.rating === 'okay' ? '#F59E0B' : '#EF4444',
                background: s.rating === 'strong' ? 'rgba(16,185,129,0.15)' : s.rating === 'okay' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.12)',
              }}>{s.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: F, letterSpacing: '0.04em' }}>{s.note}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div style={{ width: '100%', maxWidth: 280 }}>
        <div style={{ height: 10, borderRadius: 4, background: 'rgba(37,99,235,0.2)', marginBottom: 10, width: '60%' }} />
        {['よくある質問①：入社後のキャリアパスは？','よくある質問②：チームの雰囲気は？','よくある質問③：残業について教えてください'].map((q, j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: j * 0.09 }}
            style={{
              padding: '9px 12px', borderRadius: 8,
              background: 'var(--surface-gray)', border: '1px solid var(--border-gray)',
              marginBottom: 6, fontSize: 10, color: 'var(--muted-text)', fontFamily: F, letterSpacing: '0.04em',
            }}
          >{q}</motion.div>
        ))}
      </div>
    );
  }
  if (index === 3) {
    return (
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
                {[148, 97, 203][j]} / 400文字
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // index === 4
  return (
    <div style={{ width: '100%', maxWidth: 280 }}>
      {[
        { label: 'Mercari ES締め切り', days: 2, color: '#EF4444' },
        { label: 'Recruit 説明会',     days: 5, color: '#F59E0B' },
        { label: 'DeNA 一次面接',      days: 9, color: 'var(--muted-text)' },
      ].map((d, j) => (
        <motion.div
          key={d.label}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: j * 0.08 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', borderRadius: 8,
            background: 'var(--surface-gray)', border: '1px solid var(--border-gray)', marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--brand-navy)', fontFamily: F, letterSpacing: '0.04em' }}>{d.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: d.color, fontFamily: G }}>あと{d.days}日</span>
        </motion.div>
      ))}
    </div>
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
            <Link href="#features"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >機能</Link>
            <Link href="#pricing"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >料金</Link>
            <div style={{ width: 1, height: 16, background: 'var(--border-gray)', margin: '0 4px' }} />
            <Link href="/ja/login"
              style={{ fontSize: 13, color: 'var(--muted-text)', letterSpacing: '0.04em', padding: '6px 12px', textDecoration: 'none', fontFamily: F, borderRadius: 8, transition: 'color 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--brand-navy)'; el.style.background = 'var(--surface-gray)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted-text)'; el.style.background = 'transparent'; }}
            >ログイン</Link>
            <Link href="/ja/signup"
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
            <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 28px 96px' }}>
        <div className="ja-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left — text */}
          <div>
            {/* Eyebrow badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: 'var(--accent-blue)', fontFamily: F }}>就活生のための無料ツール</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#10B981', fontFamily: F }}>NEW · AI模擬面接</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: 'var(--brand-navy)',
                margin: '0 0 24px',
                fontFamily: F,
              }}
            >
              面接を練習して、<br />
              内定を<span style={{
                color: 'var(--accent-blue)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--accent-blue)',
                textDecorationThickness: '3px',
                textUnderlineOffset: '6px',
              }}>勝ち取ろう。</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              style={{
                fontSize: 16, fontWeight: 400, letterSpacing: '0.05em',
                lineHeight: 1.95, color: 'var(--muted-text)', maxWidth: 440,
                margin: '0 0 36px', fontFamily: F,
              }}
            >
              エントリーから内定まですべての選考を一元管理。
              AI模擬面接でSTAR法フィードバックを受け、面接本番に備える。
              スプレッドシートとは今日でさよなら。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}
            >
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
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              style={{ fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.06em', fontFamily: F }}
            >
              クレジットカード不要・完全無料でスタート
            </motion.p>

            {/* Trust stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.62 }}
              style={{ display: 'flex', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--border-gray)', flexWrap: 'wrap' }}
            >
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
            </motion.div>
          </div>

          {/* Right — app mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            <AppMockup />
          </motion.div>
        </div>
      </section>

      {/* ─── University strip ─────────────────────────────────────────────── */}
      <FadeUp>
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
      </FadeUp>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 28px' }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>主な機能</span>
          </div>
        </FadeUp>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map((f, i) => (
            <FadeUp key={f.n} delay={0.05}>
              <div className="ja-feature-row" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                alignItems: 'center',
                padding: '48px 0',
                borderTop: '1px solid var(--border-gray)',
              }}>
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
                      color: 'var(--text-tertiary)', fontFamily: F, textTransform: 'uppercase',
                    }}>{f.tag}</span>
                    {f.isNew && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                        color: '#10B981', background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 9999, padding: '2px 8px', fontFamily: F,
                      }}>NEW</span>
                    )}
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
                    <FeatureVisual index={i} />
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── AI Mock Interview — Dark section ────────────────────────────── */}
      <section style={{ background: '#080C14', padding: '96px 0 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 28px' }}>
          <FadeUp>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 9999, border: '1px solid rgba(37,99,235,0.35)', background: 'rgba(37,99,235,0.15)', marginBottom: 20 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#60A5FA', fontFamily: F }}>NEW · AI 模擬面接</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
                letterSpacing: '-0.025em', lineHeight: 1.18,
                color: '#fff', margin: '0 0 18px', fontFamily: F,
              }}>
                前日でも間に合う。<br />
                <span style={{ color: '#60A5FA' }}>本番さながらの練習を。</span>
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 500, fontFamily: F, letterSpacing: '0.05em' }}>
                企業名と職種を入れるだけで、その会社に特化した面接質問をAIが生成。STAR法でフィードバックして、弱点を即日改善。
              </p>
              <Link
                href="/ja/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 28, height: 48, padding: '0 36px', borderRadius: 9999,
                  background: '#2563EB', color: '#fff',
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.06em',
                  textDecoration: 'none', fontFamily: F,
                  boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                  transition: 'box-shadow 200ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(37,99,235,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)'; }}
              >無料で試してみる →</Link>
            </div>
          </FadeUp>

          {/* Dark UI preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              background: '#0D1117',
              maxWidth: 860,
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>applyd.io/interview</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr' }} className="ja-mock-inner">
              {/* Left */}
              <div style={{ padding: '20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#60A5FA' }}>M</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, fontFamily: F }}>Mercari</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: F }}>バックエンドエンジニア</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['S','Situation','状況'],['T','Task','役割'],['A','Action','行動'],['R','Result','成果']].map(([k,l,d]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: 'rgba(37,99,235,0.2)', color: '#60A5FA' }}>{k}</span>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: G }}>{l}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: F }}>{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right */}
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: 'rgba(37,99,235,0.18)', color: '#60A5FA', letterSpacing: '0.08em', fontFamily: G }}>行動面接</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: F }}>質問 2 / 5</span>
                </div>
                <div style={{ borderRadius: 10, padding: '14px 16px', marginBottom: 14, background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #2563EB', paddingLeft: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.7, margin: 0, fontFamily: F, letterSpacing: '0.04em' }}>
                    チームで困難に直面した経験と、あなたがどう行動したかを具体的に教えてください。
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Situation', rating: 'strong', note: '状況説明が明確で具体的' },
                    { label: 'Task',      rating: 'okay',   note: '役割をもう少し明確に' },
                    { label: 'Action',    rating: 'strong', note: '行動の詳細が非常に良い' },
                    { label: 'Result',    rating: 'missing', note: '成果の数値化が必要' },
                  ].map(s => (
                    <div key={s.label} style={{
                      borderRadius: 8, padding: '10px 12px',
                      background: s.rating === 'strong' ? 'rgba(16,185,129,0.1)' : s.rating === 'okay' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${s.rating === 'strong' ? 'rgba(16,185,129,0.2)' : s.rating === 'okay' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)'}`,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, margin: '0 0 3px', fontFamily: G, color: s.rating === 'strong' ? '#10B981' : s.rating === 'okay' ? '#F59E0B' : '#EF4444' }}>{s.label}</p>
                      <p style={{ fontSize: 10, margin: 0, fontFamily: F, letterSpacing: '0.03em', color: s.rating === 'strong' ? '#10B981' : s.rating === 'okay' ? '#F59E0B' : '#EF4444', opacity: 0.85 }}>{s.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div style={{ height: 80, background: 'linear-gradient(to bottom, #080C14, var(--background))' }} />
      </section>

      {/* ─── Product tour ─────────────────────────────────────────────────── */}
      <div style={{ scrollMarginTop: 72 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 0 0' }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '64px 28px 0' }}>
              <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>製品ツアー</span>
            </div>
          </FadeUp>
          <ProductWalkthrough />
        </div>
      </div>

      {/* ─── Pipeline journey ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface-gray)', padding: '80px 28px', borderTop: '1px solid var(--border-gray)', borderBottom: '1px solid var(--border-gray)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>就活の全ステージ</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand-navy)', margin: '0 0 48px', fontFamily: F, lineHeight: 1.25 }}>
              就活のすべてのステージに<br />Applydが寄り添います。
            </h2>
          </FadeUp>

          <div className="ja-pipeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {PIPELINE_STAGES.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-gray)',
                  borderTop: `3px solid ${stage.color}`,
                  borderRadius: '0 0 12px 12px',
                  padding: '16px 14px',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)', margin: '0 0 6px', fontFamily: G, letterSpacing: '0.1em' }}>{stage.num}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-navy)', margin: 0, fontFamily: F, letterSpacing: '0.04em', lineHeight: 1.4 }}>{stage.label}</p>
                <div style={{ width: 20, height: 3, borderRadius: 99, background: stage.color, marginTop: 10, opacity: 0.6 }} />
              </motion.div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 20, letterSpacing: '0.06em', fontFamily: F }}>
            エントリーから承諾まで — 就活のあらゆる場面でApplydが現在地を教えてくれます。
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 28px' }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>利用者の声</span>
          </div>
        </FadeUp>

        <div className="ja-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{
                padding: '28px 24px',
                borderRadius: 16,
                border: '1px solid var(--border-gray)',
                borderTop: `3px solid ${t.color}`,
                background: 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 20,
              }}
            >
              <div>
                <p style={{
                  fontSize: 32, fontWeight: 700, color: t.color,
                  margin: '0 0 14px', fontFamily: G, lineHeight: 1, opacity: 0.25,
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
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-gray)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 1, background: 'var(--accent-blue)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-blue)', fontFamily: F, textTransform: 'uppercase' }}>料金</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand-navy)', margin: '0 0 48px', fontFamily: F }}>
              シンプルな料金体系。
            </h2>
          </FadeUp>

          <div className="ja-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                padding: '32px 28px', borderRadius: 20,
                border: '1px solid var(--border-gray)', background: 'var(--background)',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-text)', letterSpacing: '0.08em', margin: '0 0 18px', fontFamily: F }}>無料プラン</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 700, color: 'var(--brand-navy)', fontFamily: G, letterSpacing: '-0.04em' }}>¥0</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted-text)', margin: '0 0 24px', fontFamily: F, letterSpacing: '0.05em' }}>最大15社まで永久無料</p>
              <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {['選考パイプライン管理', '締め切り管理', '基本統計ダッシュボード', 'カレンダー連携', 'スマートリマインダー'].map(item => (
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
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                padding: '32px 28px', borderRadius: 20,
                border: '2px solid var(--accent-blue)', background: 'var(--background)',
                position: 'relative', overflow: 'hidden',
              }}
            >
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
            </motion.div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20, letterSpacing: '0.05em', fontFamily: F }}>
            クレジットカードで安全に決済 · いつでもキャンセル可能 · 返金保証あり
          </p>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: '#060810', padding: '96px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ width: 48, height: 2, background: 'var(--accent-blue)', margin: '0 auto 28px', borderRadius: 1 }} />
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
                boxShadow: '0 4px 24px rgba(255,255,255,0.15)',
                transition: 'opacity 150ms ease, transform 100ms ease-out',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >無料で始める</Link>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 14, letterSpacing: '0.06em', fontFamily: F }}>
              クレジットカード不要
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#060810', padding: '48px 28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="ja-footer-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 36 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Logo size={22} variant="dark" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', letterSpacing: '0.05em', margin: 0, fontFamily: F, lineHeight: 1.8 }}>
                就活生のために<br />就活生が作りました。
              </p>
            </div>

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
        .ja-feature-row { grid-template-columns: 1fr 1fr; gap: 64px; }
        .ja-pipeline-grid { grid-template-columns: repeat(5, 1fr); }
        .ja-testimonials-grid { grid-template-columns: repeat(3, 1fr); }
        .ja-pricing-grid { grid-template-columns: 1fr 1fr; }
        .ja-footer-top { flex-direction: row; }
        .ja-mock-inner { grid-template-columns: 2fr 3fr; }

        @media (max-width: 900px) {
          .ja-hero-grid, .ja-feature-row {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .ja-mock-inner { grid-template-columns: 1fr !important; }
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
