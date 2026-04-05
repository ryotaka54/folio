import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TutorialProvider } from "@/lib/tutorial-context";
import CommandPalette from "@/components/CommandPalette";
import TutorialOverlay from "@/components/TutorialOverlay";
import DemoOverlay from "@/components/DemoOverlay";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://useapplyd.com'),
  title: {
    default: 'Applyd — Recruiting Pipeline Tracker for Students',
    template: '%s | Applyd',
  },
  description: 'Track every internship and job application in one place. Recruiting-native stages like OA, Superday, and Recruiter Screen. Automatic deadline alerts. Free for students.',
  keywords: ['internship tracker', 'job application tracker', 'recruiting pipeline', 'student job tracker', 'OA tracker', 'superday', 'internship recruiting'],
  authors: [{ name: 'Applyd', url: 'https://useapplyd.com' }],
  creator: 'Applyd',
  publisher: 'Applyd',
  alternates: { canonical: 'https://useapplyd.com' },
  openGraph: {
    title: 'Applyd — Recruiting Pipeline Tracker for Students',
    description: 'Track every internship and job application in one place. Recruiting-native stages, automatic deadline alerts, and response rate analytics. Free for students.',
    url: 'https://useapplyd.com',
    siteName: 'Applyd',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Applyd — Recruiting Pipeline Tracker' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@useapplyd',
    creator: '@useapplyd',
    title: 'Applyd — Recruiting Pipeline Tracker for Students',
    description: 'Track every internship and job application in one place. OA, Superday, Recruiter Screen — stages built for how recruiting actually works.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#0A0A0A" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Applyd',
              url: 'https://useapplyd.com',
              description: 'Recruiting pipeline tracker for students. Track internship and job applications with recruiting-native stages, automatic deadline alerts, and response rate analytics.',
              applicationCategory: 'ProductivityApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              author: { '@type': 'Organization', name: 'Applyd', url: 'https://useapplyd.com' },
              audience: { '@type': 'Audience', audienceType: 'Students' },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
          <AuthProvider>
            <TutorialProvider>
              {children}
              <CommandPalette />
              <TutorialOverlay />
              <DemoOverlay />
            </TutorialProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
