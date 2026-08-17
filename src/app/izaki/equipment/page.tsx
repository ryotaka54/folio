'use client'

import { FG, FD, FM, BG, INK, MUTED, ACCENT, BORDER, Nav, Footer, FadeUp, PhotoTile, FinalCta, PageHeader } from '../shared'

const EQUIPMENT_LIST = [
  { name: 'シャーリング', maker: '相澤鉄工所', desc: '板材の直線切断に対応。厚板から薄板まで精度の高い切断を行います。' },
  { name: 'プレスブレーキ', maker: 'アマダ', desc: '板金の曲げ加工に対応。角度・寸法の異なる多様な曲げに対応します。' },
] as const

const FACILITY_POINTS = [
  '大型の製品にも余裕を持って対応できる工場環境。',
  '材料・部品置き場と作業スペースのレイアウトを工夫し、効率的な加工を実現。',
  '汎用性の高い設備を備えることで、多品種小ロットにも柔軟に対応。',
] as const

export default function EquipmentPage() {
  return (
    <main style={{ background: BG }}>
      <Nav />
      <PageHeader
        eyebrow="EQUIPMENT"
        title="設備紹介"
        lead="大型品にも余裕を持って対応できる工場環境と、汎用性の高い設備で柔軟な加工を可能にしています。"
      />

      <section className="pb-20 md:pb-28 px-6 md:px-10" style={{ background: BG }}>
        <div className="max-w-[1400px] mx-auto">
          <FadeUp className="mb-16 md:mb-20">
            <PhotoTile variant="equipment" className="aspect-[21/9] w-full" priority />
          </FadeUp>

          <FadeUp className="mb-16 md:mb-20">
            <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', lineHeight: 1.2 }} className="mb-6">
              主な設備
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {EQUIPMENT_LIST.map(eq => (
                <div key={eq.name} className="p-7 border" style={{ borderColor: BORDER }}>
                  <p style={{ fontFamily: FM, color: MUTED }} className="text-[0.68rem] tracking-[0.1em] mb-2">
                    メーカー：{eq.maker}
                  </p>
                  <h3 style={{ fontFamily: FD, fontWeight: 900, color: INK }} className="text-xl mb-3">
                    {eq.name}
                  </h3>
                  <p style={{ fontFamily: FG, color: MUTED }} className="text-sm leading-relaxed">
                    {eq.desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp>
            <h2 style={{ fontFamily: FD, fontWeight: 900, color: INK, fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', lineHeight: 1.2 }} className="mb-6">
              工場環境
            </h2>
            <ul className="flex flex-col gap-4 max-w-2xl">
              {FACILITY_POINTS.map(point => (
                <li
                  key={point}
                  className="flex items-start gap-3 py-4 border-t"
                  style={{ borderColor: BORDER }}
                >
                  <span aria-hidden="true" className="w-1.5 h-1.5 mt-2 shrink-0" style={{ background: ACCENT }} />
                  <span style={{ fontFamily: FG, color: MUTED }} className="text-sm md:text-base leading-relaxed">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </section>

      <FinalCta text="お手元の図面から、ご相談ください。" />
      <Footer />
    </main>
  )
}
