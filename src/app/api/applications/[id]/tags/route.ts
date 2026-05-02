import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: applicationId } = await params;
    const { tag_id } = await request.json();
    if (!tag_id) return NextResponse.json({ error: 'tag_id required' }, { status: 400 });

    const supabase = getSupabase();

    // Verify tag belongs to user
    const { data: tag, error: tagErr } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tag_id)
      .eq('user_id', authedUser.id)
      .single();
    if (tagErr || !tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

    // Verify application belongs to user
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', authedUser.id)
      .single();
    if (appErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const { error } = await supabase
      .from('application_tags')
      .insert({ application_id: applicationId, tag_id });

    if (error && error.code !== '23505') throw error; // ignore duplicate
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[applications/[id]/tags POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: applicationId } = await params;
    const { tag_id } = await request.json();
    if (!tag_id) return NextResponse.json({ error: 'tag_id required' }, { status: 400 });

    const supabase = getSupabase();

    // Verify tag belongs to user (ownership check via tag)
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tag_id)
      .eq('user_id', authedUser.id)
      .single();
    if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

    const { error } = await supabase
      .from('application_tags')
      .delete()
      .eq('application_id', applicationId)
      .eq('tag_id', tag_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[applications/[id]/tags DELETE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
