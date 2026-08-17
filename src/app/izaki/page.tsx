'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  FG, FD, FM, BG, INK, MUTED, ACCENT, ACCENT_BRIGHT, DARK, DARK_BORDER, OFFWHITE,
  CTA_LABEL, EASE, Nav, Footer, FadeUp, DiagonalWash, PhotoTile, FinalCta,
} from './shared'

// ─── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  const reduce = useReducedMotion()
  return (
    <section className="relative overflow-hidden pt-14 md:pt-20 pb-16 md:pb-24 px-6 md:px-10" style={{ background: BG }}>
      <DiagonalWash side="right" opacity={0.11} className="w-[60%] md:w-[46%]" />
      <div className="relative max-w-[1400px] mx-auto">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{
            fontFamily: FD,
            fontWeight: 900,
            color: INK,
            fontSize: 'clamp(2rem, 6.6vw, 5.6rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
          }}
          className="max-w-5xl"
        >
          アルミ溶接、有資格者が担当していますか。
        </motion.h1>

        <div className="mt-10 md:mt-14 grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          <div className="lg:col-span-5">
            <FadeUp delay={0.15}>
              <p style={{ fontFamily: FG, color: MUTED }} className="text-base md:text-lg leading-loose max-w-md">
                1967年創業。全溶接士がアルミニウム溶接技術資格を保有し、三菱電機など製造現場の実績があります。
              </p>
              <div className="mt-8">
                <Link
                  href="/izaki/contact"
                  style={{ fontFamily: FG, background: ACCENT, color: '#fff' }}
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold hover:opacity-90 transition-opacity"
                >
                  {CTA_LABEL}
                  <ArrowRight size={18} strokeWidth={2.25} />
                </Link>
              </div>
            </FadeUp>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col gap-5 md:gap-6">
              <FadeUp delay={0.05}>
                <PhotoTile variant="weld" className="aspect-[16/9] w-full" priority />
              </FadeUp>
              <div className="flex gap-5 md:gap-6 md:pl-[22%]">
                <FadeUp delay={0.12} className="w-[55%]">
                  <PhotoTile variant="bend" className="aspect-[4/5] w-full" />
                </FadeUp>
                <FadeUp delay={0.19} className="w-[45%] md:mt-8">
                  <PhotoTile variant="texture" className="aspect-square w-full" />
                </FadeUp>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Proof strip ────────────────────────────────────────────────────────────
const PROOF_FACTS = ['1967年創業', '大阪府東大阪市', '全溶接士 アルミニウム溶接技術資格保有', '三菱電機と1970年より取引'] as const

function ProofStrip() {
  return (
    <section aria-label="実績概要" className="py-6 md:py-7 px-6 md:px-10" style={{ background: DARK }}>
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-0">
        {PROOF_FACTS.map((fact, i) => (
          <span key={fact} className="flex items-center">
            {i > 0 && <span className="hidden sm:block w-px h-4 mx-5" style={{ background: DARK_BORDER }} />}
            <span style={{ fontFamily: FM, color: OFFWHITE }} className="text-[0.72rem] tracking-[0.03em]">
              {fact}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}

// ─── Section link row ("見る" teaser card) ──────────────────────────────────
function SectionTeaser({
  eyebrow,
  title,
  desc,
  href,
  variant,
  reverse = false,
}: {
  eyebrow: string
  title: string
  desc: string
  href: string
  variant: 'weldCross' | 'equipment'
  reverse?: boolean
}) {
  return (
    <FadeUp>
      <div className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${reverse ? 'lg:[direction:rtl]' : ''}`}>
        <div className={`lg:col-span-6 ${reverse ? '[direction:ltr]' : ''}`}>
          <PhotoTile variant={variant} className="aspect-[4/3] w-full" />
        </div>
        <div className={`lg:col-span-6 ${reverse ? '[direction:ltr]' : ''}`}>
          <p style={{ fontFamily: FM, color: ACCENT }} className="text-[0.7rem] tracking-[0.12em] mb-3">
            {eyebrow}
          </p>
          <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', lineHeight: 1.2 }}>
            {title}
          </h2>
          <p style={{ fontFamily: FG, color: MUTED }} className="mt-4 text-sm md:text-base leading-loose max-w-md">
            {desc}
          </p>
          <Link
            href={href}
            style={{ fontFamily: FG, color: ACCENT }}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold hover:gap-2.5 transition-all"
          >
            詳しく見る
            <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </FadeUp>
  )
}

function CompanyTeaser() {
  return (
    <FadeUp>
      <div
        className="relative overflow-hidden grid lg:grid-cols-12 gap-8 lg:gap-12 items-center p-8 md:p-14"
        style={{ background: DARK }}
      >
        <DiagonalWash side="left" color={ACCENT_BRIGHT} opacity={0.12} className="w-[42%]" />
        <div className="relative lg:col-span-7">
          <p style={{ fontFamily: FM, color: '#8C8D8F' }} className="text-[0.7rem] tracking-[0.12em] mb-3">
            会社案内
          </p>
          <span
            style={{ fontFamily: FD, fontWeight: 900, color: ACCENT_BRIGHT, fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 1 }}
            className="block -ml-1"
          >
            1967
          </span>
          <p style={{ fontFamily: FG, color: '#9A9B9C' }} className="mt-3 text-sm md:text-base leading-loose max-w-md">
            大阪府東大阪市を拠点に、三菱電機株式会社をはじめとする取引先と半世紀以上にわたり信頼関係を築いてきました。
          </p>
          <Link
            href="/izaki/company"
            style={{ fontFamily: FG, color: ACCENT_BRIGHT }}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold hover:gap-2.5 transition-all"
          >
            会社概要・沿革を見る
            <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
        <div className="relative lg:col-span-5">
          <PhotoTile dark variant="factory" className="aspect-[16/10] w-full" />
        </div>
      </div>
    </FadeUp>
  )
}

function Teasers() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-10" style={{ background: BG }}>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16 md:gap-24">
        <SectionTeaser
          eyebrow="事業内容"
          title="アルミ・銅の一貫加工"
          desc="アルミ加工・溶接・組立・ヘラ絞り・パイプ加工など、全10工程に対応。全溶接士がアルミニウム溶接技術資格を保有しています。"
          href="/izaki/business"
          variant="weldCross"
        />
        <SectionTeaser
          eyebrow="設備紹介"
          title="汎用性の高い設備で柔軟な加工"
          desc="大型品にも対応できる工場環境と、シャーリング・プレスブレーキなど汎用性の高い設備を備えています。"
          href="/izaki/equipment"
          variant="equipment"
          reverse
        />
        <CompanyTeaser />
      </div>
    </section>
  )
}

export default function IzakiHomePage() {
  return (
    <main style={{ background: BG }}>
      <Nav />
      <Hero />
      <ProofStrip />
      <Teasers />
      <FinalCta />
      <Footer />
    </main>
  )
}
