import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: { document: "/offline.html" },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Google Fonts — cache first, 1 year
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Static assets — stale while revalidate
      {
        urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|ico|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // Supabase API — network first, 24h fallback
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Dashboard page — network first
      {
        urlPattern: /^https:\/\/useapplyd\.com\/dashboard/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "dashboard-page",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;",
          },
        ],
      },
    ];
  },
};

export default pwa(nextConfig);
