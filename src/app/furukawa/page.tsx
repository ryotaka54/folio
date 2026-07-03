/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'

// ─── Font vars ────────────────────────────────────────────────────────────────
const FS = 'var(--font-shippori), "Shippori Mincho B1", "Hiragino Mincho ProN", serif'
const FN = 'var(--font-noto), "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif'

// ─── Verified images — HTTP 200 curl-checked 2026-07-03 ──────────────────────
const IM = {
  hero:        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // Yatsugatake-area mountains ✅
  parsley:     'https://images.unsplash.com/photo-1776089770931-e422e57f760c', // coriander/parsley leaves close-up ✅
  greenhouse:  'https://images.unsplash.com/photo-1684479924024-3b243f3155e8', // rustic greenhouse interior ✅
  farmworkers: 'https://images.unsplash.com/photo-1760243875549-d49e7a1b3281', // Japanese rural village + mountains ✅
  field:       'https://images.unsplash.com/photo-1628953535333-a64a918181c0', // Japanese highland green hillside ✅
}
const uImg = (base: string, w = 1600) => `${base}?auto=format&fit=crop&w=${w}&q=85`

// ─── Palette — light-primary with dark hero/footer ───────────────────────────
const C = {
  // Dark (hero + footer only)
  dark:         'oklch(0.14 0.055 158)',

  // Light backgrounds (most sections)
  white:        'oklch(0.98 0.005 148)',
  sage:         'oklch(0.93 0.02 148)',

  // Typography on light
  heading:      'oklch(0.17 0.065 158)',
  body:         'oklch(0.32 0.04 155)',
  muted:        'oklch(0.52 0.025 152)',

  // Typography on dark
  onDark:       'oklch(0.96 0.008 150)',
  onDarkSoft:   'oklch(0.96 0.008 150 / 0.52)',

  // Accent
  accent:       'oklch(0.50 0.16 148)',
  accentLight:  'oklch(0.88 0.065 148)',

  // Borders
  border:       'oklch(0.88 0.022 150)',
  borderLight:  'oklch(0.92 0.014 150)',
} as const

// ─── Eases ───────────────────────────────────────────────────────────────────
const EXPO  = [0.22, 1, 0.36, 1]  as [number, number, number, number]
const QUART = [0.76, 0, 0.24, 1]  as [number, number, number, number]
const SILK  = [0.16, 1, 0.3, 1]   as [number, number, number, number]

// ─── Primitives ───────────────────────────────────────────────────────────────
function FadeUp({
  children, delay = 0, style = {},
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.85, delay, ease: SILK }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function SlideIn({
  children, from = 'left', delay = 0, style = {},
}: { children: React.ReactNode; from?: 'left' | 'right' | 'bottom'; delay?: number; style?: React.CSSProperties }) {
  const reduce = useReducedMotion()
  const x = from === 'left' ? -42 : from === 'right' ? 42 : 0
  const y = from === 'bottom' ? 30 : 0
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 1.05, delay, ease: SILK }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function AnimLine({ delay = 0, color = C.border }: { delay?: number; color?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { scaleX: 0, transformOrigin: 'left' }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 1.0, delay, ease: QUART }}
      style={{ height: '1px', background: color, width: '100%' }}
    />
  )
}

// ─── Brand mark — hexagon + 竜, scales to any size ───────────────────────────
function BrandMark({ size = 32, color = C.onDark }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <polygon
        points="100,10 177,55 177,145 100,190 23,145 23,55"
        stroke={color} strokeWidth="8" strokeLinejoin="miter"
      />
      <text
        x="100" y="100"
        fontFamily={FS}
        fontSize="90" fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
      >竜</text>
    </svg>
  )
}

// ─── Brand seal — full hexagon + 竜 + curved FURUKAWA FARMS ──────────────────
function BrandSeal({ width = 160, color = C.heading }: { width?: number; color?: string }) {
  const h = Math.round(width * 435 / 400)
  const arcId = 'fs-arc'
  return (
    <svg
      width={width} height={h}
      viewBox="0 0 400 435"
      fill="none"
      aria-label="古川農園ブランドシール"
      style={{ flexShrink: 0 }}
    >
      <polygon
        points="200,30 334,108 334,263 200,340 66,263 66,108"
        stroke={color} strokeWidth="5" strokeLinejoin="miter"
      />
      <text
        x="200" y="185"
        fontFamily={FS}
        fontSize="175" fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
      >竜</text>
      <defs>
        <path id={arcId} d="M 71,372 A 215,215 0 0,1 329,372" />
      </defs>
      <text
        fontFamily="'Futura', 'Century Gothic', 'Avenir', 'Trebuchet MS', Arial, sans-serif"
        fontSize="22" letterSpacing="5"
        fill={color}
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">FURUKAWA FARMS</textPath>
      </text>
    </svg>
  )
}

// ─── Marquee ticker ───────────────────────────────────────────────────────────
function Marquee() {
  const txt = '古川農園　FURUKAWA FARM　長野県茅野市　八ヶ岳山麓　標高1,200M　パセリ農家　'
  const rep = Array(10).fill(txt).join('')
  return (
    <div
      style={{
        overflow: 'hidden',
        background: C.sage,
        padding: '0.9rem 0',
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <style>{`
        @keyframes __fmq { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) { .__fmq { animation-play-state: paused !important } }
      `}</style>
      <div
        className="__fmq"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: '__fmq 44s linear infinite',
          fontFamily: FN,
          fontSize: '0.67rem',
          letterSpacing: '0.22em',
          color: C.muted,
        }}
      >
        {rep}{rep}
      </div>
    </div>
  )
}

// ─── Splash — slides UP on exit (curtain reveals hero) ───────────────────────
function SplashOverlay({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 0 : 2500)
    return () => clearTimeout(t)
  }, [onDone, reduce])

  if (reduce) return null

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.94, ease: QUART, delay: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: C.dark,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1.4rem',
        pointerEvents: 'none',
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.95, ease: SILK }}
        style={{
          fontFamily: FS,
          fontSize: 'clamp(2.6rem, 6.5vw, 4.4rem)',
          color: C.onDark, letterSpacing: '0.16em', fontWeight: 700, margin: 0,
        }}
      >
        古川農園
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.45, ease: QUART }}
        style={{ width: '2.5rem', height: '1px', background: C.accent }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.65 }}
        style={{
          fontFamily: FN, fontSize: '0.67rem',
          letterSpacing: '0.26em', color: C.onDark, fontWeight: 300, margin: 0,
        }}
      >
        長野県茅野市
      </motion.p>
    </motion.div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ ready }: { ready: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      aria-label="サイトナビゲーション"
      initial={reduce ? false : { opacity: 0, y: -20 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      transition={{ duration: 0.9, delay: 0.25, ease: SILK }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1.2rem clamp(1.5rem, 4vw, 2.5rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.5s ease, backdrop-filter 0.5s ease',
        background: scrolled ? `${C.dark}f0` : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}
    >
      <a href="#top" aria-label="古川農園 トップへ"
        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
      >
        <BrandMark size={28} color={C.onDark} />
        <span style={{
          fontFamily: FS, fontSize: '1.0rem',
          letterSpacing: '0.1em', color: C.onDark, fontWeight: 500,
        }}>古川農園</span>
      </a>
      <nav>
        <ul className="fw-nav" style={{ display: 'flex', gap: 'clamp(1.5rem, 3vw, 2.5rem)', listStyle: 'none', margin: 0, padding: 0 }}>
          {[['農園', '#about'], ['パセリ', '#parsley'], ['栽培', '#growing'], ['問い合わせ', '#contact']].map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                style={{
                  fontFamily: FN, fontSize: '0.72rem', letterSpacing: '0.12em',
                  color: C.onDarkSoft, textDecoration: 'none',
                  transition: 'color 0.3s', fontWeight: 400,
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = C.onDark)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = C.onDarkSoft)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])

  return (
    <section
      id="top"
      ref={ref}
      aria-label="メインビジュアル"
      style={{
        position: 'relative', height: '100svh', minHeight: '640px',
        background: C.dark, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      {/* Parallax + Ken Burns background */}
      <motion.div style={{ position: 'absolute', inset: '-12% 0', y: reduce ? 0 : imgY }}>
        <motion.img
          src={uImg(IM.hero)}
          alt="八ヶ岳山麓の高原"
          initial={reduce ? false : { opacity: 0, scale: 1 }}
          animate={ready ? { opacity: 0.62, scale: reduce ? 1 : 1.07 } : { opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 1.8, ease: 'easeOut' },
            scale: { duration: 18, ease: 'linear' },
          }}
          style={{ width: '100%', height: '112%', objectFit: 'cover', filter: 'saturate(0.72)', display: 'block' }}
        />
      </motion.div>

      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, ${C.dark} 8%, oklch(0.14 0.055 158 / 0.5) 45%, oklch(0.14 0.055 158 / 0.15) 100%)`,
      }} />

      {/* Hero text */}
      <motion.div
        style={{
          position: 'relative',
          padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.5rem, 4vw, 2.5rem)',
          maxWidth: '64rem',
        }}
        initial="hidden"
        animate={ready ? 'visible' : 'hidden'}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.16, delayChildren: 0.4 } } }}
      >
        <motion.div
          variants={{
            hidden: { scaleX: 0, transformOrigin: 'left' },
            visible: { scaleX: 1, transition: { duration: 0.7, ease: QUART } },
          }}
          style={{ width: '2.5rem', height: '1px', background: C.accent, marginBottom: '1.15rem' }}
        />
        <div style={{ overflow: 'hidden' }}>
          <motion.h1
            variants={{
              hidden: { y: '108%' },
              visible: { y: 0, transition: { duration: 1.15, ease: EXPO } },
            }}
            style={{
              fontFamily: FS,
              fontSize: 'clamp(4rem, 13vw, 8.5rem)',
              letterSpacing: '0.06em', color: C.onDark,
              lineHeight: 1, marginBottom: '1.25rem', fontWeight: 700,
            }}
          >
            古川農園
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <motion.p
            variants={{
              hidden: { y: '150%', opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { duration: 0.95, ease: SILK } },
            }}
            style={{
              fontFamily: FN, fontSize: 'clamp(0.7rem, 1.4vw, 0.8rem)',
              letterSpacing: '0.22em', color: C.onDarkSoft, fontWeight: 300,
            }}
          >
            長野県茅野市・八ヶ岳山麓
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 1.7 }}
        style={{
          position: 'absolute', bottom: 'clamp(1.5rem, 3vw, 2.5rem)', right: 'clamp(1.5rem, 4vw, 2.5rem)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        }}
      >
        <span style={{
          fontFamily: FN, fontSize: '0.52rem', letterSpacing: '0.26em',
          color: C.onDarkSoft, writingMode: 'vertical-rl', marginBottom: '0.25rem',
        }}>SCROLL</span>
        <motion.div
          initial={reduce ? false : { scaleY: 0, transformOrigin: 'top' }}
          animate={ready ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.85, delay: 2.1, ease: QUART }}
          style={{ width: '1px', height: '3rem', background: C.onDarkSoft }}
        />
      </motion.div>
    </section>
  )
}

// ─── Farmer Introduction ───────────────────────────────────────────────────────
function FarmerIntro() {
  const reduce = useReducedMotion()
  const quoteLines = ['どう生きたいか。', 'その問いに向き合ったとき、', '農業という答えが見つかりました。']

  return (
    <section
      id="about"
      aria-label="農園主・古川竜生について"
      style={{ background: C.white }}
    >
      <div className="fw-intro-grid" style={{
        maxWidth: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr clamp(280px, 38%, 520px)',
        minHeight: 'clamp(520px, 70vh, 760px)',
      }}>
        {/* Left: text */}
        <div style={{
          padding: 'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: '640px',
        }}>
          <FadeUp style={{ marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BrandSeal width={110} color={C.heading} />
              <div>
                <p style={{
                  fontFamily: FS, fontSize: '1.05rem', color: C.heading,
                  letterSpacing: '0.08em', margin: '0 0 0.2rem', fontWeight: 700,
                }}>古川竜生</p>
                <p style={{
                  fontFamily: FN, fontSize: '0.68rem', color: C.muted,
                  letterSpacing: '0.14em', margin: 0, fontWeight: 300,
                }}>パセリ農家 · 長野県茅野市</p>
              </div>
            </div>
          </FadeUp>

          <div style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            {quoteLines.map((line, i) => (
              <motion.p
                key={line}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.12, ease: SILK }}
                style={{
                  fontFamily: FS,
                  fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                  color: C.heading, lineHeight: 1.85,
                  letterSpacing: '0.05em', fontWeight: 400, margin: 0,
                }}
              >
                {line}
              </motion.p>
            ))}
          </div>

          <FadeUp delay={0.15}>
            <p style={{
              fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.1,
              color: C.body, fontWeight: 300, maxWidth: '34rem',
              textWrap: 'pretty' as React.CSSProperties['textWrap'],
            }}>
              東京農業大学を卒業し、カリフォルニアのパセリ農家で農業を学んだのち、
              生まれ育った長野県茅野市に戻りました。
              2022年に独立就農。いまは母と二人で、
              八ヶ岳山麓のハウスでパセリを育てています。
            </p>
          </FadeUp>
        </div>

        {/* Right: Japanese rural landscape */}
        <div className="fw-intro-img" style={{ position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: SILK, delay: 0.15 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <img
              src={uImg(IM.farmworkers, 800)}
              alt="農作業の様子"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                filter: 'saturate(0.88)',
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Parsley ──────────────────────────────────────────────────────────────────
function Parsley() {
  const reduce = useReducedMotion()
  return (
    <section
      id="parsley"
      aria-label="パセリについて"
      style={{
        background: C.white,
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 4vw, 2.5rem)',
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{
        maxWidth: '72rem', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'clamp(3rem, 7vw, 6rem)',
        alignItems: 'center',
      }}>
        {/* Image: clip-path wipe */}
        <SlideIn from="left">
          <div style={{ position: 'relative' }}>
            <motion.div
              initial={reduce ? false : { clipPath: 'inset(100% 0 0 0)' }}
              whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.35, ease: QUART, delay: 0.1 }}
            >
              <img
                src={uImg(IM.parsley, 900)}
                alt="密な巻きと深い緑色のパセリ"
                style={{
                  width: '100%', aspectRatio: '4 / 5',
                  objectFit: 'cover', display: 'block',
                }}
              />
            </motion.div>
          </div>
        </SlideIn>

        {/* Text */}
        <SlideIn from="right" delay={0.1}>
          <div>
            <h2 style={{
              fontFamily: FS,
              fontSize: 'clamp(1.9rem, 4.8vw, 3.2rem)',
              color: C.heading, lineHeight: 1.3,
              letterSpacing: '0.04em', marginBottom: '2rem', fontWeight: 700,
            }}>
              1,200m で<br />育つパセリ
            </h2>
            <p style={{
              fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.05,
              color: C.body, fontWeight: 300, maxWidth: '28rem',
              textWrap: 'pretty' as React.CSSProperties['textWrap'],
              marginBottom: '1.5rem',
            }}>
              八ヶ岳の澄んだ空気と、昼夜の大きな寒暖差。
              その環境が、パセリ本来の力を引き出します。
              密な巻きと深い緑色。
              低地では出しにくい品質が、ここでは生まれます。
            </p>
            <p style={{
              fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.05,
              color: C.body, fontWeight: 300, maxWidth: '28rem',
              textWrap: 'pretty' as React.CSSProperties['textWrap'],
            }}>
              JAしんしゅう諏訪を通じて、
              関東・東海・関西エリアの市場へ出荷しています。
            </p>
          </div>
        </SlideIn>
      </div>
    </section>
  )
}

// ─── Surprise — full-bleed parsley photo with white text ─────────────────────
function Surprise() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section
      ref={ref}
      aria-label="パセリの意外な使われ方"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'clamp(420px, 60vh, 640px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Field photo as full-bleed background */}
      <motion.div style={{ position: 'absolute', inset: '-10% 0', y: reduce ? 0 : imgY }}>
        <img
          src={uImg(IM.field, 1400)}
          alt="農場風景"
          style={{
            width: '100%', height: '120%',
            objectFit: 'cover', display: 'block',
          }}
        />
      </motion.div>
      {/* Overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, oklch(0.14 0.055 158 / 0.78) 0%, oklch(0.20 0.045 158 / 0.65) 100%)',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', padding: 'clamp(5rem, 12vw, 9rem) clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '44rem' }}>
        {['東京の寿司店のショーケースで、', '殺菌と保湿のために', '使われていた。'].map((line, i) => (
          <div key={i} style={{ overflow: 'hidden' }}>
            <motion.p
              initial={reduce ? false : { y: '110%' }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.1, delay: i * 0.14, ease: EXPO }}
              style={{
                fontFamily: FS,
                fontSize: 'clamp(1.2rem, 3.2vw, 1.9rem)',
                color: C.onDark, lineHeight: 1.9,
                letterSpacing: '0.06em', fontWeight: 400, margin: 0,
              }}
            >
              {line}
            </motion.p>
          </div>
        ))}
        <FadeUp delay={0.35}>
          <p style={{
            fontFamily: FN, fontSize: '0.65rem',
            letterSpacing: '0.26em', color: C.onDarkSoft,
            marginTop: '2rem', fontWeight: 300,
          }}>
            食べるだけじゃない、パセリの仕事。
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Farm Story ───────────────────────────────────────────────────────────────
const STEPS = [
  { year: '東京農大',       label: '農業経営を学ぶ',  text: '東京農業大学で農業科学と経営を学ぶ。農業を「生き方」として選ぶ決意を固める。' },
  { year: 'カリフォルニア', label: '現地研修',         text: '2020年、カリフォルニアのパセリ農家のもとで研修。海外の農業スタイルに触れる。' },
  { year: '2022年',        label: '独立就農',           text: '長野県茅野市で母と二人、ハウス栽培を開始。15aからのスタート。' },
  { year: '現在',           label: '拡大と多様化',       text: '30aへの拡大を目標に、品目の多様化・加工品の開発も視野に。' },
] as const

function FarmStory() {
  return (
    <section
      aria-label="農園の歩み"
      style={{
        background: C.white,
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 4vw, 2.5rem)',
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ overflow: 'hidden', marginBottom: 'clamp(3rem, 7vw, 5.5rem)' }}>
          <motion.h2
            initial={{ y: '110%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.95, ease: EXPO }}
            style={{
              fontFamily: FS,
              fontSize: 'clamp(1.4rem, 3.5vw, 2.1rem)',
              color: C.heading, letterSpacing: '0.06em', fontWeight: 700,
            }}
          >
            農園の歩み
          </motion.h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {STEPS.map(({ year, label, text }, i) => (
            <div key={year}>
              <AnimLine delay={i * 0.1} color={C.border} />
              <FadeUp delay={i * 0.1 + 0.15}>
                <div style={{
                  paddingTop: '1.5rem',
                  paddingRight: 'clamp(1rem, 2.5vw, 2rem)',
                  paddingBottom: '2.5rem',
                }}>
                  <p style={{
                    fontFamily: FN, fontSize: '0.67rem',
                    color: C.accent, letterSpacing: '0.12em',
                    marginBottom: '0.7rem', fontWeight: 500,
                  }}>{year}</p>
                  <p style={{
                    fontFamily: FS, fontSize: '0.95rem',
                    color: C.heading, marginBottom: '0.8rem',
                    letterSpacing: '0.04em', fontWeight: 500,
                  }}>{label}</p>
                  <p style={{
                    fontFamily: FN, fontSize: '0.8rem',
                    color: C.body, lineHeight: 1.88,
                    fontWeight: 300,
                    textWrap: 'pretty' as React.CSSProperties['textWrap'],
                  }}>{text}</p>
                </div>
              </FadeUp>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Growing — greenhouse photo, light treatment ───────────────────────────────
function Growing() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

  return (
    <section
      id="growing"
      ref={ref}
      aria-label="栽培について"
      style={{
        position: 'relative', background: C.dark,
        overflow: 'hidden', minHeight: '70vh',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <motion.div style={{ position: 'absolute', inset: '-14% 0', y: reduce ? 0 : imgY }}>
        <img
          src={uImg(IM.greenhouse)}
          alt="ハウス内の栽培風景"
          style={{
            width: '100%', height: '114%',
            objectFit: 'cover', opacity: 0.72,
            filter: 'saturate(0.78)', display: 'block',
          }}
        />
      </motion.div>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, ${C.dark} 14%, oklch(0.14 0.055 158 / 0.18) 58%, transparent 100%)`,
      }} />

      <div style={{ position: 'relative', padding: 'clamp(4rem, 8vw, 6.5rem) clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '44rem' }}>
        <SlideIn from="bottom">
          <h2 style={{
            fontFamily: FS,
            fontSize: 'clamp(1.5rem, 3.8vw, 2.4rem)',
            color: C.onDark, letterSpacing: '0.05em',
            marginBottom: '1.35rem', fontWeight: 700,
          }}>
            ハウス栽培
          </h2>
          <p style={{
            fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.05,
            color: C.onDarkSoft, fontWeight: 300, maxWidth: '32rem',
            textWrap: 'pretty' as React.CSSProperties['textWrap'],
          }}>
            八ヶ岳山麓の気候を活かしながら、
            ハウス内で温度と湿度を管理し、安定した品質を維持しています。
            年間を通じた安定供給で、
            飲食店や量販店のニーズに応えます。
          </p>
        </SlideIn>
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section
      id="contact"
      aria-label="出荷先・お問い合わせ"
      style={{
        background: C.sage,
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 4vw, 2.5rem)',
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{
        maxWidth: '72rem', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'clamp(3rem, 8vw, 6rem)',
        alignItems: 'start',
      }}>
        <SlideIn from="left">
          <div>
            <h2 style={{
              fontFamily: FS,
              fontSize: 'clamp(1.25rem, 3vw, 1.8rem)',
              color: C.heading, letterSpacing: '0.06em',
              marginBottom: '1.5rem', fontWeight: 700,
            }}>
              出荷先
            </h2>
            <p style={{
              fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.05,
              color: C.body, fontWeight: 300, maxWidth: '28rem',
              textWrap: 'pretty' as React.CSSProperties['textWrap'],
            }}>
              JAしんしゅう諏訪を通じて、
              関東・東海・関西エリアへ出荷しています。
              飲食店・量販店への個別のご相談も承ります。
            </p>
          </div>
        </SlideIn>

        <SlideIn from="right" delay={0.1}>
          <div>
            <h2 style={{
              fontFamily: FS,
              fontSize: 'clamp(1.25rem, 3vw, 1.8rem)',
              color: C.heading, letterSpacing: '0.06em',
              marginBottom: '1.5rem', fontWeight: 700,
            }}>
              お問い合わせ
            </h2>
            <p style={{
              fontFamily: FN, fontSize: '0.875rem', lineHeight: 2.05,
              color: C.body, fontWeight: 300, marginBottom: '1.5rem',
            }}>
              Instagram よりご連絡ください。
            </p>
            <a
              href="https://www.instagram.com/furukawaryuki/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: FN, fontSize: '0.82rem',
                color: C.accent, textDecoration: 'none',
                letterSpacing: '0.08em',
                borderBottom: `1px solid oklch(0.50 0.16 148 / 0.32)`,
                paddingBottom: '2px',
                transition: 'color 0.3s, border-color 0.3s',
                display: 'inline-block', fontWeight: 400,
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement
                el.style.color = 'oklch(0.42 0.18 148)'
                el.style.borderColor = 'oklch(0.42 0.18 148 / 0.5)'
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement
                el.style.color = C.accent
                el.style.borderColor = 'oklch(0.50 0.16 148 / 0.32)'
              }}
            >
              @furukawaryuki
            </a>
          </div>
        </SlideIn>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: C.dark,
      borderTop: `1px solid oklch(0.96 0.008 150 / 0.06)`,
      padding: '2rem clamp(1.5rem, 4vw, 2.5rem)',
      display: 'flex', flexWrap: 'wrap', gap: '1rem',
      alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <BrandMark size={22} color={C.onDark} />
        <span style={{
          fontFamily: FS, fontSize: '0.85rem',
          letterSpacing: '0.1em',
          color: 'oklch(0.96 0.008 150 / 0.6)', fontWeight: 400,
        }}>古川農園</span>
      </div>
      <p style={{
        fontFamily: FN, fontSize: '0.64rem',
        color: C.onDarkSoft, fontWeight: 300,
        letterSpacing: '0.08em', margin: 0,
      }}>
        長野県茅野市 · © 2026
      </p>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FurukawaPage() {
  const [splashDone, setSplashDone] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('nosplash')
  )

  return (
    <>
      <AnimatePresence>
        {!splashDone && (
          <SplashOverlay key="splash" onDone={() => setSplashDone(true)} />
        )}
      </AnimatePresence>

      <main style={{ background: C.white, color: C.heading }} className="antialiased" data-splash={splashDone ? 'done' : 'active'}>
        <style>{`
          @media (max-width: 680px) {
            .fw-nav { display: none !important; }
          }
          @media (max-width: 768px) {
            .fw-intro-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
            .fw-intro-img { height: 300px; order: -1; }
          }
        `}</style>
        <Nav ready={splashDone} />
        <Hero ready={splashDone} />
        <Marquee />
        <FarmerIntro />
        <Parsley />
        <Surprise />
        <FarmStory />
        <Growing />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
