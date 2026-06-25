import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
