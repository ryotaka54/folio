'use client'

import { FG, FD, FM, BG, INK, MUTED, ACCENT, BORDER, Nav, Footer, FadeUp, PhotoTile, FinalCta, PageHeader } from '../shared'

type FeatureRow = { title: string; desc: string; label: string; variant: 'weldCross' | 'spin' }

const FEATURE_ROWS: FeatureRow[] = [
  {
    title: 'アルミ溶接',
    desc: '全溶接士がアルミニウム溶接技術資格を保有しています。歪みを抑えた仕上がりを、薄板から厚板まで追求します。',
    label: '溶接工程',
    variant: 'weldCross',
  },
  {
    title: 'ヘラ絞り',
    desc: '型を使わず、金属を回転させながら絞り込み、曲面を成形する技術です。少量・特殊形状の成形にも対応します。',
    label: '成形工程',
    variant: 'spin',
  },
]

const LIST_SERVICES = [
  { title: 'アルミ加工', desc: 'アルミニウム素材の切断・成形・仕上げまで一貫対応。' },
  { title: '組立', desc: '加工から組立まで、社内で一貫して対応します。' },
  { title: '銅加工', desc: 'アルミだけでなく銅の曲げ・溶接にも対応しています。' },
  { title: 'パイプ加工', desc: '配管・フレーム用パイプの曲げ・加工に対応。' },
  { title: '丸棒加工', desc: '丸棒材の切断・切削・加工に対応します。' },
  { title: '型材加工', desc: 'チャンネル・アングルなど型材の加工に対応。' },
  { title: 'ロー付け', desc: '異種金属の接合や気密性が求められる箇所に対応。' },
  { title: '曲げ加工', desc: '板・パイプ・型材、素材に応じた曲げ加工に対応。' },
] as const

export default function BusinessPage() {
  return (
    <main style={{ background: BG }}>
      <Nav />
      <PageHeader
        eyebrow="BUSINESS"
        title="事業内容"
        lead="板金からアルミ・銅の溶接、特殊成形まで一貫して対応します。アルミ加工に関することでしたら、何なりとご相談ください。"
      />

      <section className="pb-20 md:pb-28 px-6 md:px-10" style={{ background: BG }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-16 md:gap-24 mb-16 md:mb-20">
            {FEATURE_ROWS.map((row, i) => (
              <FadeUp key={row.title}>
                <div className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
                  <div className={`lg:col-span-6 ${i % 2 === 1 ? '[direction:ltr]' : ''}`}>
                    <PhotoTile variant={row.variant} className="aspect-[4/3] w-full" />
                  </div>
                  <div className={`lg:col-span-6 ${i % 2 === 1 ? '[direction:ltr]' : ''}`}>
                    <p style={{ fontFamily: FM, color: ACCENT }} className="text-[0.7rem] tracking-[0.12em] mb-3">
                      0{i + 1}
                    </p>
                    <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', lineHeight: 1.2 }}>
                      {row.title}
                    </h2>
                    <p style={{ fontFamily: FG, color: MUTED }} className="mt-4 text-sm md:text-base leading-loose max-w-md">
                      {row.desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.2 }} className="mb-6">
              その他の対応加工
            </h2>
            <div className="grid sm:grid-cols-2 sm:gap-x-10" style={{ borderColor: BORDER }}>
              {LIST_SERVICES.map(item => (
                <div key={item.title} className="py-6 flex flex-col gap-1.5 border-t" style={{ borderColor: BORDER }}>
                  <h3 style={{ fontFamily: FG, color: INK }} className="text-base font-bold">
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: FG, color: MUTED }} className="text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <FinalCta text="加工内容が未定でも、ご相談を。" />
      <Footer />
    </main>
  )
}
