import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REWARD_EVERY = 3;
const REWARD_DAYS = 30;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: Request) {
  const admin = getAdmin();

  // Auth
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user: referredUser }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !referredUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { referrer_code } = await req.json() as { referrer_code?: string };
  if (!referrer_code) return NextResponse.json({ error: 'Missing referrer_code' }, { status: 400 });

  // Resolve referrer from code
  const { data: referrerProfile } = await admin
    .from('users')
    .select('id, referral_rewards_granted')
    .eq('referral_code', referrer_code.toLowerCase().trim())
    .single();

  if (!referrerProfile) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  const referrerId = referrerProfile.id as string;

  // Prevent self-referral
  if (referrerId === referredUser.id) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  // Insert referral — UNIQUE(referred_id) handles duplicate gracefully
  const { error: insertErr } = await admin.from('referrals').insert({
    referrer_id: referrerId,
    referred_id: referredUser.id,
  });

  // If duplicate (user already referred), return silently OK — idempotent
  if (insertErr && insertErr.code !== '23505') {
    console.error('Referral insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to record referral' }, { status: 500 });
  }

  // If it was a duplicate, nothing else to do
  if (insertErr?.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Count total confirmed referrals for the referrer
  const { count } = await admin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId);

  const totalReferrals = count ?? 0;
  const rewardsAlreadyGranted = (referrerProfile.referral_rewards_granted as number) ?? 0;
  const rewardsDue = Math.floor(totalReferrals / REWARD_EVERY);

  let rewardGranted = false;

  if (rewardsDue > rewardsAlreadyGranted) {
    // Grant 1 month Pro for each new reward cycle crossed
    const monthsToGrant = rewardsDue - rewardsAlreadyGranted;

    // Get current pro_expires_at (may already be Pro)
    const { data: referrerFull } = await admin
      .from('users')
      .select('pro, pro_expires_at')
      .eq('id', referrerId)
      .single();

    // Calculate new expiry: extend from now or from current expiry, whichever is later
    const base = referrerFull?.pro_expires_at
      ? new Date(referrerFull.pro_expires_at as string)
      : new Date();
    if (base < new Date()) base.setTime(Date.now());
    base.setDate(base.getDate() + REWARD_DAYS * monthsToGrant);

    await admin.from('users').update({
      pro: true,
      pro_expires_at: base.toISOString(),
      referral_rewards_granted: rewardsDue,
    }).eq('id', referrerId);

    rewardGranted = true;
  }

  return NextResponse.json({ ok: true, rewardGranted, totalReferrals });
}
