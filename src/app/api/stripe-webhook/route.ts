import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
}

/** Derive renewal date from the first subscription item's current_period_end */
function getExpiresAt(sub: Stripe.Subscription): string {
  const item = sub.items?.data?.[0];
  // In API version 2025-06-30.basil, current_period_end is on SubscriptionItem
  const ts: number | undefined = (item as Stripe.SubscriptionItem & { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

async function setProStatus(userId: string, active: boolean, subscriptionId?: string, expiresAt?: string | null) {
  await supabaseAdmin
    .from('users')
    .update({
      pro: active,
      ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      ...(expiresAt !== undefined ? { pro_expires_at: expiresAt } : {}),
    })
    .eq('id', userId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = getExpiresAt(sub);

        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setProStatus(userId, true, subscriptionId, expiresAt);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        // In v22 (2025-06-30.basil), subscription is nested under invoice.parent.subscription_details.subscription
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = getExpiresAt(sub);

        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setProStatus(userId, true, subscriptionId, expiresAt);
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setProStatus(userId, false, sub.id, null);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const active = sub.status === 'active' || sub.status === 'trialing';
        const expiresAt = active ? getExpiresAt(sub) : null;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setProStatus(userId, active, sub.id, expiresAt);
        break;
      }
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
