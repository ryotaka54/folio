'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// ─── Design tokens ──────────────────────────────────────────────────────────
// Accent blue sampled directly from イザキ's real logo (image/nc_gpcLogoMark....gif,
// dominant fill #0B499D) and cross-checked against their real site CSS link color
// (#0081CE) — this is their actual 20-year brand color, not an invented one.
// One serious corporate family (Noto Sans JP) for everything — headline weight
// comes from font-weight 900/700, not a separate display face.
export const FG = 'var(--font-izaki-gothic), "Noto Sans JP", sans-serif'
export const FD = FG
export const FM = 'var(--font-izaki-mono), "JetBrains Mono", monospace'

export const BG = '#F1F3F5'
export const INK = '#12151A'
export const SURFACE = '#E6E9EC'
export const BORDER = '#CFD5DA'
export const MUTED = '#565D63'
export const ACCENT = '#0B499D'
export const ACCENT_DEEP = '#082F66'
// Brighter blue, also real — sampled from izaki.co.jp's own CSS link color.
// Used only for large accent text on dark backgrounds where ACCENT itself is too low-contrast.
export const ACCENT_BRIGHT = '#0081CE'
export const DARK = '#12161C'
export const DARK_BORDER = '#333A42'
export const OFFWHITE = '#F0F2F4'

export const CTA_LABEL = '無料お見積り'
export const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export const NAV_LINKS = [
  { href: '/izaki/business', label: '事業内容' },
  { href: '/izaki/equipment', label: '設備紹介' },
  { href: '/izaki/cases', label: '導入事例' },
  { href: '/izaki/company', label: '会社案内' },
] as const

// ─── Reveal utility ─────────────────────────────────────────────────────────
export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Diagonal accent panel ──────────────────────────────────────────────────
export function DiagonalWash({
  side = 'right',
  color = ACCENT,
  opacity = 0.08,
  className = '',
}: {
  side?: 'right' | 'left'
  color?: string
  opacity?: number
  className?: string
}) {
  const clip =
    side === 'right'
      ? 'polygon(22% 0, 100% 0, 100% 100%, 0% 100%)'
      : 'polygon(0 0, 100% 0, 78% 100%, 0% 100%)'
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} pointer-events-none ${className}`}
      style={{ background: color, opacity, clipPath: clip }}
    />
  )
}

// ─── Photo tiles ────────────────────────────────────────────────────────────
// Real photography (Unsplash License — free for commercial use, no attribution
// required), standing in for the client's own facility/process photos until
// those exist. Each URL was resolved from a specific Unsplash photo page and
// verified to be a standard (non-Unsplash+/premium) asset.
export type ArtVariant =
  | 'weld' | 'bend' | 'texture' | 'weldCross' | 'spin'
  | 'pipe' | 'braze' | 'weldBead' | 'factory' | 'equipment'

export const STOCK_IMAGES: Record<ArtVariant, { id: string; alt: string; focus?: string }> = {
  weld: { id: '1745448797901-2a4c9d9af1c1', alt: '溶接作業の様子' },
  bend: { id: '1509024368907-57294758cfc5', alt: '金属フレーム構造' },
  texture: { id: '1756758932992-3cac25c395f7', alt: 'ブラッシュド仕上げの金属表面' },
  weldCross: { id: '1744735973756-b2efa8be24c8', alt: '金属の溶接作業' },
  spin: { id: '1776090188130-26c7253ff423', alt: '旋盤加工の様子' },
  pipe: { id: '1759064776046-45b988af4b6d', alt: '金属パイプ' },
  braze: { id: '1560883123-04646fef95df', alt: '配管の接合部', focus: 'center 30%' },
  weldBead: { id: '1689961476760-4a6b2461eec0', alt: '金属加工の火花' },
  factory: { id: '1666219462105-2909c2d72d01', alt: '工場建屋' },
  equipment: { id: '1531053326607-9d349096d887', alt: '工場設備の様子' },
}

export const stockImg = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export function CornerMarks() {
  const base = { position: 'absolute' as const, width: 16, height: 16, borderColor: '#FFFFFF', opacity: 0.75 }
  return (
    <>
      <div aria-hidden="true" style={{ ...base, top: 10, left: 10, borderTop: '1.5px solid', borderLeft: '1.5px solid' }} />
      <div aria-hidden="true" style={{ ...base, top: 10, right: 10, borderTop: '1.5px solid', borderRight: '1.5px solid' }} />
      <div aria-hidden="true" style={{ ...base, bottom: 10, left: 10, borderBottom: '1.5px solid', borderLeft: '1.5px solid' }} />
      <div aria-hidden="true" style={{ ...base, bottom: 10, right: 10, borderBottom: '1.5px solid', borderRight: '1.5px solid' }} />
    </>
  )
}

export function PhotoTile({
  variant,
  className = '',
  dark = false,
  priority = false,
}: {
  variant: ArtVariant
  className?: string
  dark?: boolean
  priority?: boolean
}) {
  const img = STOCK_IMAGES[variant]
  return (
    <div
      className={`relative overflow-hidden border ${className}`}
      style={{ borderColor: dark ? DARK_BORDER : BORDER }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stockImg(img.id)}
        alt={img.alt}
        loading={priority ? 'eager' : 'lazy'}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: img.focus ?? 'center',
          filter: 'grayscale(30%) saturate(85%) contrast(1.08) brightness(0.97)',
        }}
      />
      {/* Unify photos sourced from different photographers/lighting into one
          visual system with a consistent brand-blue duotone wash. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: ACCENT_DEEP, opacity: 0.16, mixBlendMode: 'color' }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 -40px 60px rgba(0,0,0,0.24)' }} />
      <CornerMarks />
    </div>
  )
}

// ─── Nav ────────────────────────────────────────────────────────────────────
export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: `${BG}F2`, borderColor: BORDER, backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/izaki" className="flex items-center shrink-0">
            <Image
              src="/images/izaki/izaki-logo.gif"
              alt="株式会社イザキ"
              width={330}
              height={65}
              unoptimized
              priority
              className="h-8 md:h-9 w-auto"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7 list-none">
              {NAV_LINKS.map(link => {
                const active = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ fontFamily: FG, color: INK }}
                      className={`text-[0.86rem] font-medium transition-opacity ${active ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/izaki/contact"
              style={{ fontFamily: FG, background: ACCENT, color: '#fff' }}
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {CTA_LABEL}
            </Link>
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="lg:hidden flex flex-col justify-center gap-[5px] p-2 -mr-2"
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={
                    menuOpen
                      ? i === 0 ? { rotate: 45, y: 7, opacity: 1 }
                      : i === 1 ? { opacity: 0 }
                      : { rotate: -45, y: -7, opacity: 1 }
                      : { rotate: 0, y: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.2 }}
                  className="block w-5 h-[2px] origin-center"
                  style={{ background: INK }}
                />
              ))}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-label="ナビゲーション"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden flex flex-col items-center justify-center gap-8"
            style={{ background: BG }}
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{ fontFamily: FG, color: INK }}
                className="text-2xl font-bold"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/izaki/contact"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: FG, background: ACCENT, color: '#fff' }}
              className="mt-4 inline-flex items-center px-8 py-3.5 text-base font-bold"
            >
              {CTA_LABEL}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Final CTA band ─────────────────────────────────────────────────────────
export function FinalCta({ text = 'アルミ・銅の加工、まずはご相談を。' }: { text?: string }) {
  return (
    <section className="relative overflow-hidden py-14 md:py-20 px-6 md:px-10" style={{ background: ACCENT }}>
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[40%] pointer-events-none"
        style={{ background: ACCENT_DEEP, opacity: 0.35, clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />
      <FadeUp className="relative max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <p style={{ fontFamily: FD, fontWeight: 900, color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', lineHeight: 1.25 }} className="max-w-xl">
          {text}
        </p>
        <Link
          href="/izaki/contact"
          style={{ fontFamily: FG, background: INK, color: '#fff' }}
          className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold hover:opacity-90 transition-opacity shrink-0 w-fit"
        >
          {CTA_LABEL}
          <ArrowRight size={18} strokeWidth={2.25} />
        </Link>
      </FadeUp>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="py-10 px-6 md:px-10 border-t" style={{ background: BG, borderColor: BORDER }}>
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Image
          src="/images/izaki/izaki-logo.gif"
          alt="株式会社イザキ"
          width={330}
          height={65}
          unoptimized
          className="h-7 w-auto"
        />
        <span style={{ fontFamily: FG, color: MUTED }} className="text-xs leading-relaxed">
          大阪府東大阪市川俣1丁目11番12号　TEL 06-6789-4387
        </span>
        <span style={{ fontFamily: FM, color: MUTED }} className="text-xs">
          © 2026 Izaki Co., Ltd.
        </span>
      </div>
    </footer>
  )
}

// ─── Page section header (shared H1-style heading for subpages) ────────────
export function PageHeader({
  eyebrow,
  title,
  lead,
  dark = false,
}: {
  eyebrow: string
  title: string
  lead?: string
  dark?: boolean
}) {
  return (
    <section className="pt-14 md:pt-20 pb-12 md:pb-16 px-6 md:px-10" style={{ background: dark ? DARK : BG }}>
      <div className="max-w-[1400px] mx-auto">
        <FadeUp>
          <p style={{ fontFamily: FM, color: dark ? '#8C8D8F' : MUTED }} className="text-[0.7rem] tracking-[0.14em] mb-3">
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: FD,
              fontWeight: 900,
              color: dark ? OFFWHITE : INK,
              fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {lead && (
            <p style={{ fontFamily: FG, color: dark ? '#9A9B9C' : MUTED }} className="mt-4 text-sm md:text-base leading-loose max-w-xl">
              {lead}
            </p>
          )}
        </FadeUp>
      </div>
    </section>
  )
}
