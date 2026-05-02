import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — all entries for a company slug, grouped by question (public, no auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ company: string }> },
) {
  try {
    const { company } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id, company, role, question, question_type, score, answer_text, display_name, lang, created_at')
      .eq('company_slug', company)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    console.error('[leaderboard/[company] GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
