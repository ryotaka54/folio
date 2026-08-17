'use client'

import { FG, FD, FM, BG, SURFACE, INK, MUTED, BORDER, ArtVariant, Nav, Footer, FadeUp, PhotoTile, FinalCta, PageHeader } from '../shared'

const CASE_TILES: { title: string; variant: ArtVariant; offset: string }[] = [
  { title: 'パイプ加工事例', variant: 'pipe', offset: '' },
  { title: 'ロー付け事例', variant: 'braze', offset: 'md:mt-10' },
  { title: 'アルミ溶接事例', variant: 'weldBead', offset: '' },
]

export default function CasesPage() {
  return (
    <main style={{ background: BG }}>
      <Nav />
      <PageHeader
        eyebrow="CASES"
        title="導入事例"
        lead="実際の事例は準備中です。まずは対応できる加工の一部をご紹介します。"
      />

      <section className="pb-20 md:pb-28 px-6 md:px-10" style={{ background: SURFACE }}>
        <div className="max-w-[1400px] mx-auto">
          <FadeUp className="mb-10">
            <div className="p-7 md:p-8 border" style={{ borderColor: BORDER, background: BG }}>
              <p style={{ fontFamily: FM, color: MUTED }} className="text-[0.68rem] tracking-[0.1em] mb-3">
                主要取引先
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-1.5">
                <p style={{ fontFamily: FD, fontWeight: 700, color: INK }} className="text-lg md:text-xl">
                  三菱電機株式会社 伊丹製作所
                </p>
                <p style={{ fontFamily: FD, fontWeight: 700, color: INK }} className="text-lg md:text-xl">
                  三菱電機株式会社 系統変電システム製作所
                </p>
                <p style={{ fontFamily: FD, fontWeight: 700, color: INK }} className="text-lg md:text-xl">
                  住軽商事株式会社
                </p>
              </div>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {CASE_TILES.map((p, i) => (
              <FadeUp key={p.title} delay={i * 0.06} className={p.offset}>
                <PhotoTile variant={p.variant} className="aspect-[4/5] w-full mb-3" />
                <p style={{ fontFamily: FG, color: MUTED }} className="text-sm">
                  {p.title}
                </p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <FinalCta text="近い加工のご相談も歓迎です。" />
      <Footer />
    </main>
  )
}
