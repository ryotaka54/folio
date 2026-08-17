'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  FG, FD, FM, BG, INK, ACCENT, ACCENT_BRIGHT, DARK, DARK_BORDER, OFFWHITE,
  CTA_LABEL, Nav, Footer, FadeUp, DiagonalWash, PhotoTile, FinalCta, PageHeader,
} from '../shared'

const COMPANY_FACTS = [
  { label: '商号', value: '株式会社イザキ' },
  { label: '所在地', value: '〒577-0063 大阪府東大阪市川俣1丁目11番12号' },
  { label: 'TEL / FAX', value: '06-6789-4387 / 06-6789-7319' },
  { label: '代表者', value: '代表取締役 井崎久人' },
  { label: '資本金', value: '1,000万円' },
  { label: '従業員', value: '16名' },
  { label: '保有資格', value: 'アルミニウム溶接技術（全溶接士が保有）' },
  { label: '主要取引先', value: '三菱電機株式会社、住軽商事株式会社' },
] as const

const HISTORY = [
  { year: '1967年2月', text: '先々代・井崎章が創業（当時 井崎工作所）。新明和鉄工所の協力工場として発足。' },
  { year: '1969年5月', text: '東大阪市西堤に移転し、設備を増強。' },
  { year: '1970年7月', text: '三菱電機株式会社と取引を開始。' },
  { year: '1978年2月', text: '東大阪市川俣に工場を新設（現在地）。' },
  { year: '1991年4月', text: '組織を株式会社に変更。' },
  { year: '1995年9月', text: '井崎久人が代表取締役に就任。' },
  { year: '2004年8月', text: '住軽商事株式会社と取引を開始。' },
] as const

export default function CompanyPage() {
  return (
    <main style={{ background: BG }}>
      <Nav />
      <PageHeader
        eyebrow="COMPANY"
        title="会社案内"
        lead="昭和42年の創業から、大阪府東大阪市を拠点にアルミ加工一筋で実績を重ねてきました。"
      />

      <section className="relative overflow-hidden py-14 md:py-20 px-6 md:px-10" style={{ background: DARK }}>
        <DiagonalWash side="left" color={ACCENT} opacity={0.14} className="w-[42%]" />
        <div className="relative max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <FadeUp className="mb-10 md:mb-14">
                <span
                  style={{ fontFamily: FD, fontWeight: 900, color: ACCENT_BRIGHT, fontSize: 'clamp(3.5rem, 9vw, 7rem)', lineHeight: 1 }}
                  className="block -ml-1"
                >
                  1967
                </span>
                <p style={{ fontFamily: FG, color: '#9A9B9C' }} className="mt-2 text-sm md:text-base">
                  昭和42年2月15日創業。大阪府東大阪市を拠点に、アルミ加工の実績を重ねてきました。
                </p>
              </FadeUp>

              <FadeUp delay={0.1}>
                <dl style={{ borderColor: DARK_BORDER }} className="border-t">
                  {COMPANY_FACTS.map(f => (
                    <div
                      key={f.label}
                      className="py-5 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-8 border-b"
                      style={{ borderColor: DARK_BORDER }}
                    >
                      <dt style={{ fontFamily: FM, color: '#8C8D8F' }} className="text-[0.68rem] tracking-[0.1em] sm:w-36 shrink-0">
                        {f.label}
                      </dt>
                      <dd style={{ fontFamily: FG, color: OFFWHITE }} className="text-base font-bold">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </FadeUp>

              <FadeUp delay={0.15} className="mt-10">
                <Link
                  href="/izaki/contact"
                  style={{ fontFamily: FG, background: ACCENT, color: '#fff' }}
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold hover:opacity-90 transition-opacity"
                >
                  {CTA_LABEL}
                  <ArrowRight size={18} strokeWidth={2.25} />
                </Link>
              </FadeUp>
            </div>

            <div className="lg:col-span-5">
              <FadeUp delay={0.2}>
                <PhotoTile dark variant="factory" className="aspect-[4/5] w-full" />
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 px-6 md:px-10" style={{ background: BG }}>
        <div className="max-w-[1400px] mx-auto">
          <FadeUp className="mb-12 md:mb-16">
            <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.9rem, 4vw, 3.2rem)', lineHeight: 1.15 }}>
              沿革
            </h2>
          </FadeUp>

          <FadeUp>
            <div style={{ borderColor: '#CFD5DA' }} className="border-t max-w-3xl">
              {HISTORY.map(h => (
                <div
                  key={h.year}
                  className="py-6 grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-10 border-b"
                  style={{ borderColor: '#CFD5DA' }}
                >
                  <span style={{ fontFamily: FM, color: ACCENT }} className="text-sm w-24 shrink-0">
                    {h.year}
                  </span>
                  <p style={{ fontFamily: FG, color: '#565D63' }} className="text-sm md:text-base leading-relaxed">
                    {h.text}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <FinalCta />
      <Footer />
    </main>
  )
}
