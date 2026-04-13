import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import './ja.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://useapplyd.com'),
  title: 'Applyd - 就活管理アプリ | エントリーから内定まで一元管理',
  description:
    '就活生のための無料アプリ。エントリーから内定まで全ステージを管理、AIが面接対策をサポート。5,000人以上の就活生が使用中。',
  keywords: [
    '就活管理',
    '就活アプリ',
    '就活ツール',
    'エントリーシート管理',
    '面接対策',
    '内定管理',
    '就活',
    'シューカツ',
  ],
  alternates: {
    canonical: 'https://useapplyd.com/ja',
    languages: {
      'en': 'https://useapplyd.com',
      'ja': 'https://useapplyd.com/ja',
      'x-default': 'https://useapplyd.com',
    },
  },
  openGraph: {
    title: 'Applyd - 就活管理アプリ',
    description: '就活をシンプルに。エントリーから内定まで一元管理。',
    url: 'https://useapplyd.com/ja',
    siteName: 'Applyd',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Applyd — 就活管理アプリ' }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Applyd - 就活管理アプリ',
    description: '就活をシンプルに。エントリーから内定まで一元管理。',
    images: ['/og-image.png'],
  },
};

export default function JaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="alternate" hrefLang="en" href="https://useapplyd.com" />
        <link rel="alternate" hrefLang="ja" href="https://useapplyd.com/ja" />
        <link rel="alternate" hrefLang="x-default" href="https://useapplyd.com" />
      </head>
      <body className="antialiased ja-body">
        {children}
      </body>
    </html>
  );
}
