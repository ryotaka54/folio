import { Barlow, Bebas_Neue } from 'next/font/google'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-barlow',
  display: 'swap',
})

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '1OAK Tokyo — Luxury Nightclub',
  description:
    "Tokyo's premier luxury nightclub. VIP reservations, world-class DJs, Roppongi.",
}

export default function OakLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${barlow.variable} ${bebas.variable}`}>
      {children}
    </div>
  )
}
