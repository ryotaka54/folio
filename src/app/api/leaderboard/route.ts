import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — list companies with entry counts (public, no auth)
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('company, company_slug, lang')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by company_slug + lang, count entries
    const counts: Record<string, { company: string; company_slug: string; lang: string; count: number }> = {};
    for (const row of data ?? []) {
      const key = `${row.company_slug}__${row.lang}`;
      if (!counts[key]) counts[key] = { company: row.company, company_slug: row.company_slug, lang: row.lang, count: 0 };
      counts[key].count++;
    }

    const companies = Object.values(counts).sort((a, b) => b.count - a.count);
    return NextResponse.json({ companies });
  } catch (err) {
    console.error('[leaderboard GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST — submit a leaderboard entry (auth required)
export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { company, company_slug, role, question, question_type, score, answer_text, display_name, lang } = await request.json();

    if (!company || !company_slug || !role || !question || !score) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be 1–5' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        user_id: authedUser.id,
        company,
        company_slug,
        role,
        question,
        question_type: question_type ?? 'behavioral',
        score,
        answer_text: answer_text ?? null,
        display_name: display_name ?? null,
        lang: lang ?? 'en',
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('[leaderboard POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
