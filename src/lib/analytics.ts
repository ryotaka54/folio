/**
 * Analytics — thin PostHog wrapper.
 * All calls are fire-and-forget and never throw, so analytics
 * can never break the app.
 *
 * Setup:
 *   1. Go to posthog.com → create project → copy your API key
 *   2. Add to .env.local:
 *        NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
 *        NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
 *   3. That's it — events start flowing.
 */

let _posthog: typeof import('posthog-js').default | null = null;

async function getPostHog() {
  if (_posthog) return _posthog;
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  try {
    const { default: posthog } = await import('posthog-js');
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // keep events intentional
      });
    }
    _posthog = posthog;
    return posthog;
  } catch {
    return null;
  }
}

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  getPostHog().catch(() => {});
}

export async function identify(userId: string, traits?: Record<string, unknown>) {
  const ph = await getPostHog();
  try { ph?.identify(userId, traits); } catch { /* silent */ }
}

export async function capture(event: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog();
  try { ph?.capture(event, properties); } catch { /* silent */ }
}

export async function reset() {
  const ph = await getPostHog();
  try { ph?.reset(); } catch { /* silent */ }
}
