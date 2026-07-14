import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TutorialProvider } from "@/lib/tutorial-context";
import CommandPalette from "@/components/CommandPalette";
import TutorialOverlay from "@/components/TutorialOverlay";
import DemoOverlay from "@/components/DemoOverlay";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://useapplyd.com'),
  title: {
    default: 'Applyd — AI-Powered Internship Tracker for Students',
    template: '%s | Applyd',
  },
  description: 'Applyd is the AI-powered internship and job tracker built for college students. Organize your pipeline, track deadlines, and stay on top of recruiting season. Upgrade to Pro for AI interview prep, follow-up emails, and personalized coaching.',
  keywords: ['internship tracker', 'AI internship tracker', 'job application tracker', 'recruiting pipeline', 'student job tracker', 'AI interview prep', 'internship recruiting', 'recruiting AI'],
  authors: [{ name: 'Applyd', url: 'https://useapplyd.com' }],
  creator: 'Applyd',
  publisher: 'Applyd',
  alternates: { canonical: 'https://useapplyd.com' },
  openGraph: {
    title: 'Applyd — AI-Powered Internship Tracker for Students',
    description: 'Applyd is the AI-powered internship and job tracker built for college students. Organize your pipeline, track deadlines, and stay on top of recruiting season. Upgrade to Pro for AI interview prep, follow-up emails, and personalized coaching.',
    url: 'https://useapplyd.com',
    siteName: 'Applyd',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Applyd — AI-Powered Internship Tracker' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@useapplyd',
    creator: '@useapplyd',
    title: 'Applyd — AI-Powered Internship Tracker for Students',
    description: 'Track internship and job applications with a recruiting-native pipeline. Upgrade to Pro for AI interview prep, coaching, and follow-up emails.',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="application-name" content="Applyd" />
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Applyd" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Windows */}
        <meta name="msapplication-TileColor" content="#2563EB" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Applyd',
              url: 'https://useapplyd.com',
              description: 'AI-powered internship and job tracker for college students. Organize your recruiting pipeline, track deadlines, and unlock AI coaching with Pro.',
              applicationCategory: 'ProductivityApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free to start — Pro plan available for AI features' },
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
              <PWAInstallPrompt />
              <MobileBottomNav />
            </TutorialProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
