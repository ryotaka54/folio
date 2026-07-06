import { Shippori_Mincho_B1, Noto_Sans_JP } from 'next/font/google'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const shippori = Shippori_Mincho_B1({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-shippori',
  display: 'swap',
})

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '古川農園 — 長野県茅野市のパセリ農家',
  description:
    '八ヶ岳山麓、標高1,200mのハウスで育てるパセリ。長野県茅野市の古川農園。',
}

export default function FurukawaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${shippori.variable} ${noto.variable}`} style={{ overflowX: 'hidden' }}>
      {children}
    </div>
  )
}
