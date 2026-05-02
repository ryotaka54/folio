import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — all leaderboard entries posted by the authenticated user
export async function GET(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id, company, company_slug, role, question, score, answer_text, display_name, lang, created_at')
      .eq('user_id', authedUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to a safe shape — don't expose internal fields
    const entries = (data ?? []).map(e => ({
      id: e.id,
      company: e.company,
      company_slug: e.company_slug,
      role: e.role,
      question: e.question,
      score: e.score,
      has_answer: e.answer_text !== null,
      has_name: e.display_name !== null,
      lang: e.lang,
      created_at: e.created_at,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[leaderboard/mine GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
