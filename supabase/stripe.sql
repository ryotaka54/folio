-- Stripe Pro tier columns for the users table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pro                    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS pro_expires_at         timestamptz;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx
  ON users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
