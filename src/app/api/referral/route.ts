import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REWARD_EVERY = 3; // referrals per reward

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Deterministic 8-char base36 code from a user ID */
function deriveCode(userId: string): string {
  const clean = userId.replace(/-/g, '');
  let h = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, '0').slice(0, 7);
}

export async function GET(req: Request) {
  const admin = getAdmin();

  // Verify auth via Bearer token
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get or create referral code
  const { data: profile } = await admin
    .from('users')
    .select('referral_code, referral_rewards_granted')
    .eq('id', user.id)
    .single();

  let code = profile?.referral_code as string | null;
  if (!code) {
    code = deriveCode(user.id);
    // Handle rare collision by appending a digit
    const { error: upsertErr } = await admin
      .from('users')
      .update({ referral_code: code })
      .eq('id', user.id);
    if (upsertErr) {
      code = deriveCode(user.id + '1');
      await admin.from('users').update({ referral_code: code }).eq('id', user.id);
    }
  }

  // Fetch referrals for this user
  const { data: referrals } = await admin
    .from('referrals')
    .select('id, created_at')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const confirmedCount = referrals?.length ?? 0;
  const rewardsGranted = (profile?.referral_rewards_granted as number) ?? 0;
  const progressInCurrentCycle = confirmedCount - rewardsGranted * REWARD_EVERY;
  const nextRewardAt = (rewardsGranted + 1) * REWARD_EVERY;

  return NextResponse.json({
    code,
    referrals: referrals ?? [],
    confirmedCount,
    rewardsGranted,
    progressInCurrentCycle,
    nextRewardAt,
    rewardEvery: REWARD_EVERY,
  });
}
