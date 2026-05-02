import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// PATCH — hide_answer or anonymize (auth required, own entry only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { entryId } = await params;
    const { action } = await request.json();

    if (action !== 'hide_answer' && action !== 'anonymize') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const update = action === 'hide_answer'
      ? { answer_text: null }
      : { display_name: null };

    const supabase = getSupabase();
    const { error } = await supabase
      .from('leaderboard_entries')
      .update(update)
      .eq('id', entryId)
      .eq('user_id', authedUser.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leaderboard/[entryId] PATCH]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE — remove entry from leaderboard entirely (auth required, own entry only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { entryId } = await params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('leaderboard_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', authedUser.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leaderboard/[entryId] DELETE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
