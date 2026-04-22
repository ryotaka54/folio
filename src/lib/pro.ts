'use client';

export const FREE_TIER_LIMIT = 25;

/** Returns true if the user has an active Pro subscription. */
export function isPro(user: { pro?: boolean; pro_expires_at?: string | null } | null): boolean {
  if (!user?.pro) return false;
  if (!user.pro_expires_at) return true; // no expiry set → treat as active
  return new Date(user.pro_expires_at) > new Date();
}

/**
 * Redirects the user to Stripe Checkout for a given price.
 * Returns an error string if checkout fails, or null on success (browser redirects).
 */
export async function startCheckout(opts: {
  userId: string;
  email: string;
  priceId: string;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: opts.userId,
        email: opts.email,
        priceId: opts.priceId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) return data.error ?? 'Failed to start checkout';
    window.location.href = data.url;
    return null;
  } catch {
    return 'Network error — please try again';
  }
}

export const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? '';
export const ANNUAL_PRICE_ID  = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL  ?? '';
