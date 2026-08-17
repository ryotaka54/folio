import { Noto_Sans_JP, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../globals.css'

// Noto Sans JP: the de-facto standard for serious Japanese corporate/B2B sites —
// confirmed against unitec-mt.com's own stylesheet (the conversion-structure
// reference for this page), which runs 'Noto Sans JP', Meiryo, sans-serif
// throughout and builds all headline weight via font-weight 900, not a
// separate display face. Same approach here: one professional family,
// weight does the work.
const gothic = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-izaki-gothic',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-izaki-mono',
  display: 'swap',
})

const TITLE = '株式会社イザキ ｜ アルミ加工・溶接（大阪府東大阪市）'
const DESCRIPTION =
  '1967年創業、東大阪市のアルミ加工会社。アルミ加工・板金加工・アルミ溶接・ヘラ絞り・パイプ加工・ロー付けに対応。全溶接士がアルミニウム溶接技術資格を保有し、三菱電機など製造現場の実績があります。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: 'ja_JP',
    type: 'website',
    siteName: '株式会社イザキ',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function IzakiLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${gothic.variable} ${mono.variable}`}>
      <body className="antialiased bg-[#F7F6F3]">{children}</body>
    </html>
  )
}
