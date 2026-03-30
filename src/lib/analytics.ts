/**
 * Analytics — thin PostHog wrapper.
 * PostHog is initialized via instrumentation-client.ts (Next.js 15.3+ pattern).
 * All calls are fire-and-forget and never throw, so analytics
 * can never break the app.
 */

import posthog from 'posthog-js';

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try { posthog.identify(userId, traits); } catch { /* silent */ }
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try { posthog.capture(event, properties); } catch { /* silent */ }
}

export function reset() {
  if (typeof window === 'undefined') return;
  try { posthog.reset(); } catch { /* silent */ }
}
